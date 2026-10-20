import { NextRequest, NextResponse } from 'next/server';
import { Template } from '@/lib/supabase';
import { getOptionalSessionClient } from '@/lib/auth/session';
import { ensureTemplateImageSignedUrl } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    const { db, respond } = await getOptionalSessionClient(req);

    const { data: templates, error } = await db
      .from('template')
      .select('*')
      .eq('public', true)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to retrieve public templates' },
        { status: 500 }
      );
    }

    const templatesWithSignedUrls = await Promise.all(
      (templates || []).map((t) => ensureTemplateImageSignedUrl(t as Template))
    );

    return respond(NextResponse.json({
      success: true,
      templates: templatesWithSignedUrls,
    }));
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to retrieve public templates',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
