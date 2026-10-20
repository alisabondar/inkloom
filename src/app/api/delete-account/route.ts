import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { clearSessionCookies, requireProfile } from '@/lib/auth/session';

const AVATAR_BUCKET = 'avatars';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireProfile(req);
    if (auth instanceof NextResponse) return auth;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const profileId = String(auth.profile.id);

    const { data: avatarFiles } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .list(profileId);

    if (avatarFiles?.length) {
      await supabaseAdmin.storage
        .from(AVATAR_BUCKET)
        .remove(avatarFiles.map((file) => `${profileId}/${file.name}`));
    }

    await auth.db
      .from('template')
      .delete()
      .eq('user_id', auth.profile.id);

    const { error: deleteError } = await auth.db
      .from('user')
      .delete()
      .eq('id', auth.profile.id);

    if (deleteError) {
      console.error('Delete account error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(auth.authUser.id);

    if (authDeleteError) {
      console.error('Delete auth user error:', authDeleteError);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    return clearSessionCookies(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Delete account route error:', error);
    return NextResponse.json({
      error: 'Failed to delete account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
