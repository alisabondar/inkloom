'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/supabase/server';
import { saveTemplateSchema, templateIdSchema, visibilitySchema, workspaceSettingsSchema, type ActionState } from '@/lib/validation';
import type { GenerationRow, WorkspaceLayer, WorkspaceSettings } from '@/lib/db/types';

const LAYERS: WorkspaceLayer[] = ['lines', 'values', 'numbers', 'grid', 'colour'];

export async function saveTemplateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = saveTemplateSchema(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
  const { supabase } = await requireUser();

  const { data: generation } = await supabase
    .from('generations')
    .select('id, status, result_path, prompt, options')
    .eq('id', parsed.data.generationId)
    .maybeSingle<Pick<GenerationRow, 'id' | 'status' | 'result_path' | 'prompt' | 'options'>>();

  if (!generation || generation.status !== 'succeeded' || !generation.result_path) {
    return { error: 'That concept is not ready yet' };
  }

  const { data: template, error } = await supabase
    .from('templates')
    .insert({
      generation_id: generation.id,
      title: parsed.data.title,
      medium: generation.options.medium,
      difficulty: parsed.data.difficulty,
      prompt: generation.options.idea,
      concept_path: generation.result_path,
    })
    .select('id')
    .single<{ id: string }>();

  if (error || !template) return { error: 'Could not save the template' };
  redirect(`/t/${template.id}`);
}

export async function updateWorkspaceSettingsAction(input: Record<string, unknown>): Promise<ActionState> {
  const parsed = workspaceSettingsSchema(input);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
  const { supabase } = await requireUser();
  const { id, layers, ...numbers } = parsed.data;

  let layerState: WorkspaceSettings['layers'] = {};
  try {
    const raw = JSON.parse(layers) as Record<string, unknown>;
    layerState = Object.fromEntries(LAYERS.map((layer) => [layer, raw[layer] === true]));
  } catch {
    return { fieldErrors: { layers: 'Layers are invalid' } };
  }

  const settings: WorkspaceSettings = { ...numbers, layers: layerState };
  const { error } = await supabase.from('templates').update({ settings }).eq('id', id);
  return error ? { error: 'Could not save settings' } : { ok: true };
}

export async function setVisibilityAction(input: Record<string, unknown>): Promise<ActionState> {
  const parsed = visibilitySchema(input);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
  const { supabase } = await requireUser();

  const { error } = await supabase.from('templates').update({ is_public: parsed.data.isPublic }).eq('id', parsed.data.id);
  if (error) return { error: 'Could not change visibility' };

  revalidatePath('/gallery');
  revalidatePath(`/t/${parsed.data.id}`);
  return { ok: true };
}

export async function deleteTemplateAction(formData: FormData) {
  const parsed = templateIdSchema(formData);
  if (!parsed.ok) return;
  const { supabase } = await requireUser();

  await supabase.from('templates').delete().eq('id', parsed.data.id);
  revalidatePath('/projects');
  redirect('/projects');
}
