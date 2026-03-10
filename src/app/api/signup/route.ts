import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, first_name, username } = body;

    if (!email || !password || !first_name) {
      return NextResponse.json({ error: 'Email, password, and first name are required' }, { status: 400 });
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

    const { data: existingEmail } = await client
      .from('user')
      .select('email')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    if (username?.trim()) {
      const { data: existingUsername } = await client
        .from('user')
        .select('username')
        .eq('username', username.trim())
        .single();

      if (existingUsername) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
    }

    const { data, error } = await client
      .from('user')
      .insert({
        email: email,
        password: password,
        first_name: first_name,
        username: username?.trim() || null,
        favorite_medium: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: 'Failed to create user', details: error.message }, { status: 500 });
    }

    const userWithoutPassword = Object.fromEntries(
      Object.entries(data).filter(([key]) => key !== 'password')
    );
    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({
      error: 'Failed to sign up',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

