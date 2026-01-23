import { NextRequest, NextResponse } from 'next/server';
import { supabase, Template, TemplateInsert } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, medium, difficulty, duration, generated_image_id, image_url, source } = body;

    const user_id = "1";

    const newTemplate: TemplateInsert = {
      title: title || 'Untitled Template',
      medium,
      difficulty,
      duration,
      generated_image_id,
      image_url,
      source,
      user_id
    };

    const { data, error } = await supabase
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

