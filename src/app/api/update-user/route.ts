import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, PROFILE_FIELDS } from '@/lib/supabase';
import { requireProfile } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireProfile(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { email, first_name, username, favorite_medium } = body;
    const nextEmail = typeof email === 'string' && email.trim() ? email.trim() : auth.profile.email;

    if (nextEmail !== auth.profile.email) {
      if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }

      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(auth.authUser.id, { email: nextEmail });

      if (emailError) {
        return NextResponse.json({ error: 'Failed to update email', details: emailError.message }, { status: 400 });
      }
    }

    const { data, error } = await auth.db
      .from('user')
      .update({
        email: nextEmail,
        first_name: first_name,
        username: username?.trim() || null,
        favorite_medium: favorite_medium || null,
      })
      .eq('id', auth.profile.id)
      .select(PROFILE_FIELDS)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to update user data' }, { status: 500 });
    }

    return auth.respond(NextResponse.json({
      success: true,
      user: data
    }));

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({
      error: 'Failed to update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
