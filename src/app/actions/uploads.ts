'use server';

import { requireUser } from '@/lib/supabase/server';
import { referencePhotoSchema } from '@/lib/validation';
import type { StartConceptsState } from './generations';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function useReferencePhotoAction(_prev: StartConceptsState, formData: FormData): Promise<StartConceptsState> {
  const parsed = referencePhotoSchema(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
  const { photo: file, medium, title, idea } = parsed.data;
  const { supabase, user } = await requireUser();

  // Storage policies only allow writes inside the user's own folder.
  const path = `${user.id}/concepts/upload-${Date.now()}.${EXTENSIONS[file.type]}`;
  const { error: uploadError } = await supabase.storage
    .from('templates')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: 'Could not upload the photo' };

  const text = idea || 'Reference photo';
  const batchId = crypto.randomUUID();
  const { data, error } = await supabase
    .from('generations')
    .insert({
      batch_id: batchId,
      status: 'succeeded',
      provider: 'upload',
      prompt: text,
      options: { idea: text, medium, title: title ?? undefined },
      result_path: path,
      finished_at: new Date().toISOString(),
    })
    .select('id')
    .single<{ id: string }>();

  if (error || !data) {
    await supabase.storage.from('templates').remove([path]);
    return { error: 'Could not save the photo' };
  }
  return { ok: true, batchId, generationIds: [data.id] };
}
