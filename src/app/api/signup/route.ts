import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, supabaseAdmin, PROFILE_FIELDS } from '@/lib/supabase';
import { setSessionCookies } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, first_name, username } = body;

    if (!email || !password || !first_name) {
      return NextResponse.json({ error: 'Email, password, and first name are required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 });
    }

    const { data: existingEmail } = await supabaseAdmin
      .from('user')
      .select('email')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    if (username?.trim()) {
      const { data: existingUsername } = await supabaseAdmin
        .from('user')
        .select('username')
        .eq('username', username.trim())
        .single();

      if (existingUsername) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
    }

    const { data: authData, error: authError } = await createAuthClient().auth.signUp({ email, password });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create account' }, { status: 400 });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('user')
      .insert({
        auth_id: authData.user.id,
        email: email,
        first_name: first_name,
        username: username?.trim() || null,
        favorite_medium: null,
      })
      .select(PROFILE_FIELDS)
      .single();

    if (error) {
      console.error('Error creating user:', error);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Failed to create user', details: error.message }, { status: 500 });
    }

    // With email confirmation enabled, Supabase returns no session until the email is confirmed.
    if (!authData.session) {
      return NextResponse.json({ success: true, user: profile, needsConfirmation: true });
    }

    return setSessionCookies(NextResponse.json({ success: true, user: profile }), authData.session);

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({
      error: 'Failed to sign up',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
