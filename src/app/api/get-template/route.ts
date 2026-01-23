import { NextRequest, NextResponse } from 'next/server';
import { supabase, Template } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('template')
      .select('*')
      .eq('id', id)
      .single<Template>();

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to retrieve template from database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template: data
    });

  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

