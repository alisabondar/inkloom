import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
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
      .select('id, email, first_name, username, favorite_medium, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to retrieve user data' }, { status: 500 });
    }

    let user = data;

    if (data.avatar_url) {
      const { data: signedAvatar } = await client.storage
        .from('avatars')
        .createSignedUrl(data.avatar_url, 60 * 60);

      user = {
        ...data,
        avatar_url: signedAvatar?.signedUrl || data.avatar_url
      };
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
