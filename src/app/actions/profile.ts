'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getAdminClient, signStoragePath } from '@/lib/supabase/admin';
import { clearSessionCookies, createAuthClient, requireUser, setSessionCookies } from '@/lib/supabase/server';
import { changePasswordSchema, profileSchema, type ActionState } from '@/lib/validation';
import type { ProfileRow, TemplateRow } from '@/lib/db/types';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = profileSchema(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
  const { supabase, user } = await requireUser();
  const { email, first_name, username, favorite_medium } = parsed.data;

  if (username) {
    const { data: taken } = await getAdminClient().from('profiles').select('id').ilike('username', username).neq('id', user.id).maybeSingle();
    if (taken) return { fieldErrors: { username: 'That username is taken' } };
  }

  if (email !== user.email) {
    const { error } = await getAdminClient().auth.admin.updateUserById(user.id, { email });
    if (error) return { fieldErrors: { email: error.message } };
  }

  const { error } = await supabase.from('profiles').update({ first_name, username, favorite_medium }).eq('id', user.id);
  if (error) return { error: 'Could not save your profile' };

  revalidatePath('/', 'layout');
  return { ok: true, message: 'Saved.' };
}

export async function uploadAvatarAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const file = formData.get('avatar');
  if (!(file instanceof File) || !file.size) return { fieldErrors: { avatar: 'Choose an image' } };
  if (!file.type.startsWith('image/')) return { fieldErrors: { avatar: 'Avatar must be an image' } };
  if (file.size > MAX_AVATAR_BYTES) return { fieldErrors: { avatar: 'Avatar must be smaller than 5 MB' } };

  const { supabase, user } = await requireUser();
  const extension = file.type.split('/')[1]?.replace(/[^a-z0-9]/g, '') || 'png';
  const path = `${user.id}/avatar-${Date.now()}.${extension}`;

  // Uploaded with the user's session, so the storage policy limits it to their own folder.
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) return { error: 'Upload failed' };

  const { error } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', user.id);
  if (error) return { error: 'Could not save your avatar' };

  revalidatePath('/', 'layout');
  return { ok: true, message: 'Avatar updated.' };
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = changePasswordSchema(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
  const { user } = await requireUser();
  if (!user.email) return { error: 'This account has no email' };

  const authClient = createAuthClient();
  const { error: verifyError } = await authClient.auth.signInWithPassword({ email: user.email, password: parsed.data.currentPassword });
  if (verifyError) return { fieldErrors: { currentPassword: 'Current password is incorrect' } };

  const { error } = await getAdminClient().auth.admin.updateUserById(user.id, { password: parsed.data.newPassword });
  if (error) return { error: error.message };

  // Changing the password ends existing sessions; start a new one so the user stays signed in.
  const { data } = await authClient.auth.signInWithPassword({ email: user.email, password: parsed.data.newPassword });
  if (data.session) await setSessionCookies(data.session);
  return { ok: true, message: 'Password changed.' };
}

export async function exportDataAction() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: templates }, { data: generations }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<ProfileRow>(),
    supabase.from('templates').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }).returns<TemplateRow[]>(),
    supabase.from('generations').select('id, status, prompt, options, provider, created_at').eq('owner_id', user.id),
  ]);

  return {
    exported_at: new Date().toISOString(),
    profile: profile ? { ...profile, avatar_url: await signStoragePath('avatars', profile.avatar_path) } : null,
    templates: await Promise.all(
      (templates ?? []).map(async (t) => ({ ...t, concept_url: await signStoragePath('templates', t.concept_path) })),
    ),
    generations: generations ?? [],
  };
}

async function removeFolder(supabase: Awaited<ReturnType<typeof requireUser>>['supabase'], bucket: string, folder: string) {
  const { data: entries } = await supabase.storage.from(bucket).list(folder, { limit: 1000 });
  for (const entry of entries ?? []) {
    const path = `${folder}/${entry.name}`;
    // Folders have no id in Storage listings.
    if (entry.id) await supabase.storage.from(bucket).remove([path]);
    else await removeFolder(supabase, bucket, path);
  }
}

export async function deleteAccountAction() {
  const { supabase, user } = await requireUser();

  await removeFolder(supabase, 'avatars', user.id);
  await removeFolder(supabase, 'templates', user.id);

  // Deleting the Auth user cascades to the profile, templates, and generations.
  const { error } = await getAdminClient().auth.admin.deleteUser(user.id);
  if (error) return { error: 'Could not delete the account' };

  await clearSessionCookies();
  redirect('/?deleted=1');
}
