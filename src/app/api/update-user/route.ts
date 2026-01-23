import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, first_name, username, favorite_medium } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
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

    const { data, error } = await client
      .from('user')
      .upsert({
        id: id,
        email: email,
        first_name: first_name,
        username: username?.trim() || null,
        favorite_medium: favorite_medium || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to update user data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: data
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({
      error: 'Failed to update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

