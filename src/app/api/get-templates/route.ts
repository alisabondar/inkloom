import { NextRequest, NextResponse } from 'next/server';
import { supabase, Template, SupabaseQueryResponse } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';

    const user_id = "1";

    const { data: templates, error, count } = (await supabase
      .from('template')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)) as SupabaseQueryResponse<Template[]>;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to retrieve templates from database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      templates,
      count: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

