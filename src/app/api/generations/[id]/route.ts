import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { signStoragePath } from '@/lib/supabase/admin';
import type { GenerationRow } from '@/lib/db/types';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getServerClient();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  // RLS limits this to the signed-in user's own generations.
  const { data, error } = await supabase
    .from('generations')
    .select('id, status, error, result_path, batch_id')
    .eq('id', id)
    .maybeSingle<Pick<GenerationRow, 'id' | 'status' | 'error' | 'result_path' | 'batch_id'>>();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: data.id,
    batchId: data.batch_id,
    status: data.status,
    error: data.error,
    imageUrl: data.status === 'succeeded' ? await signStoragePath('templates', data.result_path) : null,
  });
}
