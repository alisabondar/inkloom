import { NextRequest, NextResponse } from 'next/server';
import { Template, TemplateInsert } from '@/lib/supabase';
import { ensureTemplateImageSignedUrl } from '@/lib/storage';
import { requireProfile } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireProfile(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { title, medium, difficulty, duration, generated_image_id, image_url, source, public: isPublic } = body;

    if (!image_url || typeof image_url !== 'string') {
      return NextResponse.json(
        { error: 'image_url is required and must be a string' },
        { status: 400 }
      );
    }

    const newTemplate: TemplateInsert = {
      title: title || 'Untitled Template',
      medium,
      difficulty,
      duration,
      generated_image_id,
      image_url,
      source,
      user_id: auth.profile.id,
      public: isPublic === true
    };

    const { data, error } = await auth.db
      .from('template')
      .insert([newTemplate])
      .select()
      .single<Template>();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save template to database' }, { status: 500 });
    }

    const templateWithSignedUrl = await ensureTemplateImageSignedUrl(data as Template);

    return auth.respond(NextResponse.json({
      success: true,
      template: templateWithSignedUrl
    }, { status: 201 }));

  } catch (error) {
    console.error('Save template error:', error);
    return NextResponse.json({
      error: 'Failed to save template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
