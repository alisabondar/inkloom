import { getAdminClient } from '@/lib/supabase/admin';
import type { GenerationRow } from '@/lib/db/types';
import { generateImage } from './providers';

export const CONCEPTS_PER_IDEA = 4;
const DEFAULT_GENERATIONS_PER_HOUR = 10;

export function getGenerationLimitPerHour() {
  const configured = parseInt(process.env.GENERATE_RATE_LIMIT_PER_HOUR || '', 10);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_GENERATIONS_PER_HOUR;
}

// Whether `requested` more generations fit in the hourly limit, given how many were made in the last hour.
export function checkGenerationQuota(usedInLastHour: number, requested: number, limit = getGenerationLimitPerHour()) {
  const remaining = Math.max(0, limit - usedInLastHour);
  return { allowed: requested <= remaining, remaining, limit };
}

const EXTENSIONS: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

// Runs one generation job in the background (after the Server Action has responded). Uses the admin
// client because no user request is attached; the row was created by its owner under RLS.
export async function runGeneration(generation: Pick<GenerationRow, 'id' | 'owner_id' | 'prompt'>, seed?: number) {
  const admin = getAdminClient();
  await admin.from('generations').update({ status: 'running' }).eq('id', generation.id);

  try {
    const { provider, image } = await generateImage({ prompt: generation.prompt, seed });
    const extension = EXTENSIONS[image.contentType] ?? 'png';
    const path = `${generation.owner_id}/concepts/${generation.id}.${extension}`;

    const { error: uploadError } = await admin.storage
      .from('templates')
      .upload(path, image.bytes, { contentType: image.contentType, upsert: true });
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    await admin
      .from('generations')
      .update({ status: 'succeeded', provider, result_path: path, finished_at: new Date().toISOString() })
      .eq('id', generation.id);
  } catch (error) {
    await admin
      .from('generations')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message.slice(0, 500) : 'Generation failed',
        finished_at: new Date().toISOString(),
      })
      .eq('id', generation.id);
  }
}
