import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username } = body;

    const hasEmail = email && typeof email === 'string' && email.trim().length > 0;
    const hasUsername = username && typeof username === 'string' && username.trim().length > 0;

    if (!hasEmail && !hasUsername) {
      return NextResponse.json({ error: 'Email or username is required' }, { status: 400 });
    }

    const client = supabaseAdmin || supabase;

    let userData = null;

    if (hasEmail) {
      const { data, error } = await client
        .from('user')
        .select('email, username')
        .eq('email', email.trim())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: 'Failed to check user' }, { status: 500 });
      }

      userData = data;
    } else if (hasUsername) {
      const { data, error } = await client
        .from('user')
        .select('email, username')
        .eq('username', username.trim())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: 'Failed to check user' }, { status: 500 });
      }

      userData = data;
    }

    return NextResponse.json({
      success: true,
      exists: !!userData,
      user: userData
    });

  } catch (error) {
    console.error('Check user error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({
        error: 'Invalid request body',
        details: 'Request body must be valid JSON'
      }, { status: 400 });
    }
    return NextResponse.json({
      error: 'Failed to check user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

