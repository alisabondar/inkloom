import { NextRequest, NextResponse } from 'next/server';
import type { Session, SupabaseClient, User as AuthUser } from '@supabase/supabase-js';
import { createAuthClient, createUserClient, PROFILE_FIELDS, UserProfile } from '@/lib/supabase';

export const ACCESS_TOKEN_COOKIE = 'inkloom-access-token';
export const REFRESH_TOKEN_COOKIE = 'inkloom-refresh-token';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionTokens = Pick<Session, 'access_token' | 'refresh_token'>;

export function setSessionCookies(res: NextResponse, session: SessionTokens) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
  res.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, options);
  res.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, options);
  return res;
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(ACCESS_TOKEN_COOKIE, '', { path: '/', maxAge: 0 });
  res.cookies.set(REFRESH_TOKEN_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}

export interface ResolvedSession {
  authUser: AuthUser;
  accessToken: string;
  refreshedSession: SessionTokens | null;
}

// Verifies the access token cookie with Supabase Auth, falling back to the refresh token when it has expired.
export async function resolveSession(req: NextRequest): Promise<ResolvedSession | null> {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!accessToken && !refreshToken) return null;

  const authClient = createAuthClient();

  if (accessToken) {
    const { data, error } = await authClient.auth.getUser(accessToken);
    if (!error && data.user) {
      return { authUser: data.user, accessToken, refreshedSession: null };
    }
  }

  if (refreshToken) {
    const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken });
    if (!error && data.session && data.user) {
      return {
        authUser: data.user,
        accessToken: data.session.access_token,
        refreshedSession: data.session,
      };
    }
  }

  return null;
}

export interface AuthContext {
  authUser: AuthUser;
  db: SupabaseClient;
  // Writes refreshed session cookies (if the token was refreshed) onto the outgoing response.
  respond: (res: NextResponse) => NextResponse;
}

export interface ProfileContext extends AuthContext {
  profile: UserProfile;
}

function unauthorized(req: NextRequest) {
  const res = NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const hadCookies = req.cookies.has(ACCESS_TOKEN_COOKIE) || req.cookies.has(REFRESH_TOKEN_COOKIE);
  return hadCookies ? clearSessionCookies(res) : res;
}

function toAuthContext(session: ResolvedSession): AuthContext {
  return {
    authUser: session.authUser,
    db: createUserClient(session.accessToken),
    respond: (res) => (session.refreshedSession ? setSessionCookies(res, session.refreshedSession) : res),
  };
}

export async function requireUser(req: NextRequest): Promise<AuthContext | NextResponse> {
  const session = await resolveSession(req);
  if (!session) return unauthorized(req);
  return toAuthContext(session);
}

// Like requireUser, and also loads the signed-in user's `user` profile row through the RLS-bound client.
export async function requireProfile(req: NextRequest): Promise<ProfileContext | NextResponse> {
  const session = await resolveSession(req);
  if (!session) return unauthorized(req);

  const context = toAuthContext(session);
  const { data: profile, error } = await context.db
    .from('user')
    .select(PROFILE_FIELDS)
    .eq('auth_id', session.authUser.id)
    .single<UserProfile>();

  if (error || !profile) return unauthorized(req);
  return { ...context, profile };
}

// Client for table reads that work signed in or out: bound to the session when there is one, anon otherwise.
export async function getOptionalSessionClient(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return { db: createAuthClient(), respond: (res: NextResponse) => res };
  const { db, respond } = toAuthContext(session);
  return { db, respond };
}
