import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { id, currentPassword, newPassword } = await req.json();

    if (!id || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'User ID, current password, and new password are required' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: user, error: getError } = await client
      .from('user')
      .select('id, password')
      .eq('id', id)
      .single();

    if (getError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.password !== currentPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const { error: updateError } = await client
      .from('user')
      .update({ password: newPassword })
      .eq('id', id);

    if (updateError) {
      console.error('Change password error:', updateError);
      return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password route error:', error);
    return NextResponse.json({
      error: 'Failed to change password',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
