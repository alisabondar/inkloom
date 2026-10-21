'use server';

import { requireUser } from '@/lib/supabase/server';
import { MEDIUMS, type Medium } from '@/lib/plan';
import { object, oneOf, optional, string } from '@/lib/validation';
import type { StartConceptsState } from './generations';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const referencePhotoSchema = object({
  medium: oneOf(MEDIUMS.map((m) => m.id) as Medium[], 'Medium'),
  title: optional(string({ label: 'Title', max: 120 })),
  idea: optional(string({ label: 'Idea', max: 1000 })),
});

export async function useReferencePhotoAction(_prev: StartConceptsState, formData: FormData): Promise<StartConceptsState> {
  const parsed = referencePhotoSchema(formData);
  const photo = formData.get('photo');
  const fieldErrors: Record<string, string> = parsed.ok ? {} : { ...(parsed.fieldErrors as Record<string, string>) };

  if (!(photo instanceof File) || photo.size === 0) fieldErrors.photo = 'Choose a photo to upload';
  else if (!EXTENSIONS[photo.type]) fieldErrors.photo = 'Use a JPG, PNG, WebP or GIF image';
  else if (photo.size > MAX_PHOTO_BYTES) fieldErrors.photo = 'Photos must be 8 MB or smaller';
  if (!parsed.ok || Object.keys(fieldErrors).length) return { fieldErrors };

  const file = photo as File;
  const { medium, title, idea } = parsed.data;
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
