import { NextRequest, NextResponse } from 'next/server';
import { Template } from '@/lib/supabase';
import { getOptionalSessionClient } from '@/lib/auth/session';
import { ensureTemplateImageSignedUrl } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const { db, respond } = await getOptionalSessionClient(req);

    const { data, error } = await db
      .from('template')
      .select('*')
      .eq('id', id)
      .single<Template>();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to retrieve template from database' }, { status: 500 });
    }

    const template = await ensureTemplateImageSignedUrl({ ...data });

    return respond(NextResponse.json({
      success: true,
      template
    }));

  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

