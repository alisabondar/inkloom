import { NextRequest, NextResponse } from 'next/server';
import { ensureTemplateImageSignedUrl } from '@/lib/storage';
import { supabaseAdmin, Template } from '@/lib/supabase';
import { requireProfile } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireProfile(req);
    if (auth instanceof NextResponse) return auth;

    const user = auth.profile;

    let avatarUrl = user.avatar_url || null;
    if (user.avatar_url && supabaseAdmin) {
      const { data: signedAvatar } = await supabaseAdmin.storage
        .from('avatars')
        .createSignedUrl(user.avatar_url, 60 * 60);
      avatarUrl = signedAvatar?.signedUrl || user.avatar_url;
    }

    const { data: templates, error: templatesError } = await auth.db
      .from('template')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (templatesError) {
      console.error('Export templates error:', templatesError);
      return NextResponse.json({ error: 'Failed to export templates' }, { status: 500 });
    }

    const templatesWithSignedUrls = await Promise.all(
      ((templates || []) as Template[]).map((template) => ensureTemplateImageSignedUrl(template))
    );

    return auth.respond(NextResponse.json({
      success: true,
      exported_at: new Date().toISOString(),
      user: {
        ...user,
        avatar_url: avatarUrl
      },
      templates: templatesWithSignedUrls
    }));
  } catch (error) {
    console.error('Export user data error:', error);
    return NextResponse.json({
      error: 'Failed to export user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
