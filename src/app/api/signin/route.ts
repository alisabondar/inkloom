import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createUserClient, supabaseAdmin, PROFILE_FIELDS } from '@/lib/supabase';
import { setSessionCookies } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { emailOrUsername, password } = body;

    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: 'Email/username and password are required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 });
    }

    const isEmail = emailOrUsername.includes('@');
    let email = emailOrUsername;

    if (!isEmail) {
      const { data } = await supabaseAdmin
        .from('user')
        .select('email')
        .eq('username', emailOrUsername)
        .single();

      if (!data?.email) {
        return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
      }
      email = data.email;
    }

    const { data: authData, error: authError } = await createAuthClient().auth.signInWithPassword({ email, password });

    if (authError || !authData.session) {
      return NextResponse.json({
        error: isEmail ? 'Invalid email or password' : 'Invalid username or password'
      }, { status: 401 });
    }

    const { data: profile, error: profileError } = await createUserClient(authData.session.access_token)
      .from('user')
      .select(PROFILE_FIELDS)
      .eq('auth_id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Account profile not found' }, { status: 404 });
    }

    return setSessionCookies(NextResponse.json({ success: true, user: profile }), authData.session);

  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json({
      error: 'Failed to sign in',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
