'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase/admin';
import { clearSessionCookies, createAuthClient, requireUser, setSessionCookies } from '@/lib/supabase/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/supabase/env';
import { newPasswordSchema, resetRequestSchema, signInSchema, signUpSchema, type ActionState } from '@/lib/validation';
import { getOrigin, safeNext } from './request';

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
  const { email, password, first_name, username } = parsed.data;

  if (username) {
    const { data: taken } = await getAdminClient().from('profiles').select('id').ilike('username', username).maybeSingle();
    if (taken) return { fieldErrors: { username: 'That username is taken' } };
  }

  const { data, error } = await createAuthClient().auth.signUp({
    email,
    password,
    options: {
      data: { first_name, username },
      emailRedirectTo: `${await getOrigin()}/auth/callback?next=/create`,
    },
  });

  if (error) return { error: error.message };

  if (!data.session) {
    return { ok: true, message: `We sent a confirmation link to ${email}. Open it to finish signing up.` };
  }

  await setSessionCookies(data.session);
  redirect(safeNext(formData.get('next'), '/create'));
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
  const { identifier, password } = parsed.data;

  let email = identifier;
  if (!identifier.includes('@')) {
    // Usernames are resolved to the account email before a session exists.
    const { data } = await getAdminClient().from('profiles').select('email').ilike('username', identifier).maybeSingle();
    if (!data?.email) return { error: 'Wrong username or password' };
    email = data.email;
  }

  const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return { error: error?.message === 'Email not confirmed' ? 'Confirm your email first — check your inbox.' : 'Wrong email/username or password' };
  }

  await setSessionCookies(data.session);
  redirect(safeNext(formData.get('next')));
}

export async function signOutAction() {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) {
    await getAdminClient().auth.admin.signOut(accessToken).catch(() => undefined);
  }
  await clearSessionCookies();
  redirect('/');
}

export async function requestPasswordResetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetRequestSchema(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  await createAuthClient().auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await getOrigin()}/auth/callback?next=/settings/new-password`,
  });

  // Same message whether or not the account exists.
  return { ok: true, message: 'If that email has an account, a reset link is on its way.' };
}

export async function setNewPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = newPasswordSchema(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const { user } = await requireUser();
  const { error } = await getAdminClient().auth.admin.updateUserById(user.id, { password: parsed.data.password });
  if (error) return { error: error.message };

  if (user.email) {
    const { data } = await createAuthClient().auth.signInWithPassword({ email: user.email, password: parsed.data.password });
    if (data.session) await setSessionCookies(data.session);
  }
  return { ok: true, message: 'Password updated.' };
}
