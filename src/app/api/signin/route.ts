import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { emailOrUsername, password } = body;

    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: 'Email/username and password are required' }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 });
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const isEmail = emailOrUsername.includes('@');

    let user;
    if (isEmail) {
      const { data, error } = await client
        .from('user')
        .select('*')
        .eq('email', emailOrUsername)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      user = data;
    } else {
      const { data, error } = await client
        .from('user')
        .select('*')
        .eq('username', emailOrUsername)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
      }
      user = data;
    }

    if (user.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json({
      error: 'Failed to sign in',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

