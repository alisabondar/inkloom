import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl } from './env';

// The only module that reads the service-role key. It bypasses RLS, so use it only for
// Storage signing/uploads, Auth admin calls, and background generation jobs.
let adminClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  adminClient ??= createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

export async function signStoragePath(bucket: 'avatars' | 'templates', path: string | null, expiresIn = 60 * 60) {
  if (!path) return null;
  const { data } = await getAdminClient().storage.from(bucket).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}
