'use server';

import { after } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { startGenerationSchema, type ActionState } from '@/lib/validation';
import { buildConceptPrompt } from '@/lib/ai/prompt';
import { CONCEPTS_PER_IDEA, checkGenerationQuota, runGeneration } from '@/lib/ai/jobs';
import type { GenerationRow } from '@/lib/db/types';

export interface StartConceptsState extends ActionState {
  batchId?: string;
  generationIds?: string[];
}

export async function startConceptsAction(_prev: StartConceptsState, formData: FormData): Promise<StartConceptsState> {
  const parsed = startGenerationSchema(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
  const { supabase, user } = await requireUser();
  const { idea, medium, title } = parsed.data;

  // Rate limit from the database, so it holds across server instances.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .gte('created_at', since);

  const quota = checkGenerationQuota(count ?? 0, CONCEPTS_PER_IDEA);
  if (!quota.allowed) {
    return { error: `You've reached ${quota.limit} concepts this hour. Try again a little later.` };
  }

  const batchId = crypto.randomUUID();
  const rows = Array.from({ length: CONCEPTS_PER_IDEA }, (_, variation) => ({
    batch_id: batchId,
    prompt: buildConceptPrompt({ idea, medium, variation }),
    options: { idea, medium, title: title ?? undefined, variation },
  }));

  const { data, error } = await supabase
    .from('generations')
    .insert(rows)
    .select('id, owner_id, prompt')
    .returns<Pick<GenerationRow, 'id' | 'owner_id' | 'prompt'>[]>();

  if (error || !data?.length) return { error: 'Could not start generating' };

  // Runs after the response is sent; the page follows each job through /api/generations/[id].
  after(() => Promise.all(data.map((generation, index) => runGeneration(generation, 1000 + index * 7919))));

  return { ok: true, batchId, generationIds: data.map((g) => g.id) };
}
