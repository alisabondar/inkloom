import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ACCESS_TOKEN_COOKIE, clearSessionCookies } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken && supabaseAdmin) {
    // Revokes the refresh token so the session can't be renewed after sign out.
    await supabaseAdmin.auth.admin.signOut(accessToken).catch((error) => {
      console.error('Signout error:', error);
    });
  }

  return clearSessionCookies(NextResponse.json({ success: true }));
}
