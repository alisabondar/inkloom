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

  // A photo is stored once per user: its name is its content hash, so uploading the same photo
  // again reuses the stored file instead of adding a copy. Each upload still gets its own
  // generation row, so the idea, medium and title can differ.
  const hash = await contentHash(file);
  const path = `${user.id}/concepts/upload-${hash}.${EXTENSIONS[file.type]}`;
  const { error: uploadError } = await supabase.storage
    .from('templates')
    .upload(path, file, { contentType: file.type, upsert: false });
  const alreadyStored = Boolean(uploadError && isDuplicate(uploadError));
  if (uploadError && !alreadyStored) return { error: 'Could not upload the photo' };

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
    // Only clean up a file this call added; an earlier upload may still use the stored one.
    if (!alreadyStored) await supabase.storage.from('templates').remove([path]);
    return { error: 'Could not save the photo' };
  }
  return { ok: true, batchId, generationIds: [data.id] };
}

// SHA-256 of the file's bytes, as hex (the first 32 characters are plenty to tell photos apart).
async function contentHash(file: File) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

// Supabase Storage answers 409 "The resource already exists" when the path is taken and upsert is off.
function isDuplicate(error: { message?: string; statusCode?: string | number }) {
  return String(error.statusCode) === '409' || /already exists|duplicate/i.test(error.message ?? '');
}
