import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const AVATAR_BUCKET = 'avatars';

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: avatarFiles } = await client.storage
      .from(AVATAR_BUCKET)
      .list(id);

    if (avatarFiles?.length) {
      await client.storage
        .from(AVATAR_BUCKET)
        .remove(avatarFiles.map((file) => `${id}/${file.name}`));
    }

    await client
      .from('template')
      .delete()
      .eq('user_id', id);

    const { error: deleteError } = await client
      .from('user')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete account error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account route error:', error);
    return NextResponse.json({
      error: 'Failed to delete account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
