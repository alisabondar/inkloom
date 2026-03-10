import { supabaseAdmin } from './supabase';
import type { Template } from './supabase';

const STORAGE_BUCKET = 'templates';
const SIGNED_URL_EXPIRY_SECONDS = 3600;

export async function ensureTemplateImageSignedUrl(template: Template): Promise<Template> {
  if (!template?.image_url || !supabaseAdmin) return template;

  let storagePath: string | null = null;
  if (template.image_url.startsWith('http')) {
    const match = template.image_url.match(/\/templates\/(.+)$/);
    if (match) storagePath = decodeURIComponent(match[1]);
  } else {
    storagePath = template.image_url;
  }

  if (!storagePath) return template;

  const { data: signedData, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

  if (!error && signedData?.signedUrl) {
    return { ...template, image_url: signedData.signedUrl };
  }
  return template;
}
