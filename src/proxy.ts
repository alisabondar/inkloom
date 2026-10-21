import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  sessionCookieOptions,
  supabaseAnonKey,
  supabaseUrl,
} from '@/lib/supabase/env';

const REFRESH_MARGIN_SECONDS = 60;

function tokenExpiresAt(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

// Refreshes an expired (or nearly expired) access token before the page renders, so Server
// Components always see a valid session and the new cookies are saved in the browser.
export async function proxy(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return NextResponse.next();

  const expiresAt = accessToken ? tokenExpiresAt(accessToken) : null;
  const stillValid = expiresAt !== null && expiresAt - REFRESH_MARGIN_SECONDS > Date.now() / 1000;
  if (stillValid) return NextResponse.next();

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    const res = NextResponse.next();
    res.cookies.delete(ACCESS_TOKEN_COOKIE);
    res.cookies.delete(REFRESH_TOKEN_COOKIE);
    return res;
  }

  // Pass the new tokens to this request's render as well as back to the browser.
  req.cookies.set(ACCESS_TOKEN_COOKIE, data.session.access_token);
  req.cookies.set(REFRESH_TOKEN_COOKIE, data.session.refresh_token);
  const res = NextResponse.next({ request: { headers: req.headers } });
  res.cookies.set(ACCESS_TOKEN_COOKIE, data.session.access_token, sessionCookieOptions);
  res.cookies.set(REFRESH_TOKEN_COOKIE, data.session.refresh_token, sessionCookieOptions);
  return res;
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|mockups/|favicon|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
};
