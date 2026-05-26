import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ensureTemplateImageSignedUrl } from '@/lib/storage';
import { Template } from '@/lib/supabase';
import { DEFAULT_USER_ID } from '@/constants';

const isNumericId = (value: string) => /^\d+$/.test(value);

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
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: user, error: userError } = await client
      .from('user')
      .select('id, email, first_name, username, favorite_medium, avatar_url')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let avatarUrl = user.avatar_url || null;
    if (user.avatar_url) {
      const { data: signedAvatar } = await client.storage
        .from('avatars')
        .createSignedUrl(user.avatar_url, 60 * 60);
      avatarUrl = signedAvatar?.signedUrl || user.avatar_url;
    }

    const templateOwnerId = isNumericId(userId) ? userId : DEFAULT_USER_ID;

    const { data: templates, error: templatesError } = await client
      .from('template')
      .select('*')
      .eq('user_id', templateOwnerId)
      .order('created_at', { ascending: false });

    if (templatesError) {
      console.error('Export templates error:', templatesError);
      return NextResponse.json({ error: 'Failed to export templates' }, { status: 500 });
    }

    const templatesWithSignedUrls = await Promise.all(
      ((templates || []) as Template[]).map((template) => ensureTemplateImageSignedUrl(template))
    );

    return NextResponse.json({
      success: true,
      exported_at: new Date().toISOString(),
      template_owner_id: templateOwnerId,
      user: {
        ...user,
        avatar_url: avatarUrl
      },
      templates: templatesWithSignedUrls
    });
  } catch (error) {
    console.error('Export user data error:', error);
    return NextResponse.json({
      error: 'Failed to export user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
