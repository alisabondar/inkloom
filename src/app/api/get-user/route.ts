import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireProfile } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireProfile(req);
    if (auth instanceof NextResponse) return auth;

    let user = auth.profile;

    if (user.avatar_url && supabaseAdmin) {
      const { data: signedAvatar } = await supabaseAdmin.storage
        .from('avatars')
        .createSignedUrl(user.avatar_url, 60 * 60);

      user = {
        ...user,
        avatar_url: signedAvatar?.signedUrl || user.avatar_url
      };
    }

    return auth.respond(NextResponse.json({
      success: true,
      user
    }));

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
