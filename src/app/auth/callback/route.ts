import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createAuthClient } from '@/lib/supabase/server';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, sessionCookieOptions } from '@/lib/supabase/env';
import { safeNext } from '@/app/actions/request';

function withSession(res: NextResponse, session: { access_token: string; refresh_token: string }) {
  res.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, sessionCookieOptions);
  res.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, sessionCookieOptions);
  return res;
}

function failed(req: NextRequest) {
  return NextResponse.redirect(new URL('/signin?error=link', req.url));
}

// Email links (confirmation, password reset) land here.
// - Templates using {{ .TokenHash }} arrive as ?token_hash=…&type=… and are verified on the server.
// - Supabase's default templates put the session in the URL #fragment, which never reaches the
//   server, so a tiny page reads the fragment and POSTs the tokens back here to be verified.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get('next'));
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  if (tokenHash && type) {
    const { data, error } = await createAuthClient().auth.verifyOtp({ token_hash: tokenHash, type });
    if (error || !data.session) return failed(req);
    return withSession(NextResponse.redirect(new URL(next, req.url)), data.session);
  }

  const html = `<!doctype html><meta charset="utf-8"><title>Signing you in…</title>
<body style="font-family:system-ui;background:#f3ecdd;color:#172033;display:grid;place-items:center;height:100vh;margin:0">
<p>Signing you in…</p>
<form id="f" method="post"><input type="hidden" name="access_token"><input type="hidden" name="refresh_token"><input type="hidden" name="next" value="${next.replace(/"/g, '&quot;')}"></form>
<script>
  var p = new URLSearchParams(location.hash.slice(1));
  var f = document.getElementById('f');
  if (p.get('access_token') && p.get('refresh_token')) {
    f.access_token.value = p.get('access_token');
    f.refresh_token.value = p.get('refresh_token');
    f.submit();
  } else {
    location.replace('/signin?error=link');
  }
</script></body>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function POST(req: NextRequest) {
  // Only accept the hand-off from our own callback page.
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) return failed(req);

  const form = await req.formData();
  const accessToken = form.get('access_token');
  const refreshToken = form.get('refresh_token');
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') return failed(req);

  // Verify the token with Supabase Auth before trusting it.
  const { data, error } = await createAuthClient().auth.getUser(accessToken);
  if (error || !data.user) return failed(req);

  const next = safeNext(form.get('next'));
  return withSession(NextResponse.redirect(new URL(next, req.url), 303), { access_token: accessToken, refresh_token: refreshToken });
}
