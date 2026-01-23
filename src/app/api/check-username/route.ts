import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const client = supabaseAdmin || supabase;

    const { data, error } = await client
      .from('user')
      .select('username')
      .eq('username', username.trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to check username' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      available: !data,
      taken: !!data
    });

  } catch (error) {
    console.error('Check username error:', error);
    return NextResponse.json({
      error: 'Failed to check username',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

