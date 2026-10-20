import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, supabaseAdmin } from '@/lib/supabase';
import { requireUser } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (auth instanceof NextResponse) return auth;

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin || !auth.authUser.email) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { error: verifyError } = await createAuthClient().auth.signInWithPassword({
      email: auth.authUser.email,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(auth.authUser.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Change password error:', updateError);
      return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
    }

    return auth.respond(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Change password route error:', error);
    return NextResponse.json({
      error: 'Failed to change password',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
