import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, Template, TemplateInsert } from '@/lib/supabase';
import { DEFAULT_USER_ID } from '@/constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, medium, difficulty, duration, generated_image_id, image_url, source, public: isPublic } = body;

    if (!image_url || typeof image_url !== 'string') {
      return NextResponse.json(
        { error: 'image_url is required and must be a string' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' },
        { status: 500 }
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
      user_id: DEFAULT_USER_ID,
      public: isPublic === true
    };

    const { data, error } = await supabaseAdmin
      .from('template')
      .insert([newTemplate])
      .select()
      .single<Template>();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save template to database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template: data
    }, { status: 201 });

  } catch (error) {
    console.error('Save template error:', error);
    return NextResponse.json({
      error: 'Failed to save template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

