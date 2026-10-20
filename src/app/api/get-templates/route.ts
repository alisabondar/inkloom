import { NextRequest, NextResponse } from 'next/server';
import { Template, SupabaseQueryResponse } from '@/lib/supabase';
import { requireProfile } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireProfile(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';

    const { data: templates, error, count } = (await auth.db
      .from('template')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.profile.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)) as SupabaseQueryResponse<Template[]>;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to retrieve templates from database' }, { status: 500 });
    }

    return auth.respond(NextResponse.json({
      success: true,
      templates,
      count: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }));

  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

