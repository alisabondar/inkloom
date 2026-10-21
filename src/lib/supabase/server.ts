import { cache } from 'react';
import { cookies } from 'next/headers';
import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  sessionCookieOptions,
  supabaseAnonKey,
  supabaseUrl,
} from './env';

export class AuthRequiredError extends Error {
  constructor() {
    super('Not signed in');
  }
}

// Stateless client for Supabase Auth calls (sign in, sign up, token refresh).
export function createAuthClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false, flowType: 'pkce' },
  });
}

function createSessionClient(accessToken: string | null): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type SessionTokens = Pick<Session, 'access_token' | 'refresh_token'>;

export async function setSessionCookies(session: SessionTokens) {
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, session.access_token, sessionCookieOptions);
  store.set(REFRESH_TOKEN_COOKIE, session.refresh_token, sessionCookieOptions);
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

interface ResolvedSession {
  user: User;
  accessToken: string;
}

// Verifies the session cookie with Supabase Auth once per request. An expired access token is
// refreshed; cookies can only be written from Server Actions and route handlers, so in Server
// Components the refreshed token is used for this request and src/proxy.ts persists it next time.
export const getSession = cache(async (): Promise<ResolvedSession | null> => {
  const store = await cookies();
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!accessToken && !refreshToken) return null;

  const authClient = createAuthClient();

  if (accessToken) {
    const { data, error } = await authClient.auth.getUser(accessToken);
    if (!error && data.user) return { user: data.user, accessToken };
  }

  if (refreshToken) {
    const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken });
    if (!error && data.session && data.user) {
      await setSessionCookies(data.session).catch(() => undefined);
      return { user: data.user, accessToken: data.session.access_token };
    }
  }

  return null;
});

// Supabase client bound to the request's session (anon when signed out). RLS applies to every query.
export const getServerClient = cache(async () => {
  const session = await getSession();
  return {
    supabase: createSessionClient(session?.accessToken ?? null),
    user: session?.user ?? null,
  };
});

export async function requireUser() {
  const { supabase, user } = await getServerClient();
  if (!user) throw new AuthRequiredError();
  return { supabase, user };
}
