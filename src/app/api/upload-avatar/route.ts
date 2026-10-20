import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin, PROFILE_FIELDS } from '@/lib/supabase';
import { requireProfile } from '@/lib/auth/session';

const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
type SupabaseStorageClient = ReturnType<typeof createClient>['storage'];

async function ensureAvatarBucket(storage: SupabaseStorageClient) {
  const { data: buckets, error: listError } = await storage.listBuckets();

  if (listError) {
    return listError;
  }

  if (buckets?.some((bucket) => bucket.name === AVATAR_BUCKET)) {
    return null;
  }

  const { error: createError } = await storage.createBucket(AVATAR_BUCKET, {
    public: false,
    fileSizeLimit: MAX_AVATAR_BYTES
  });

  return createError;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireProfile(req);
    if (auth instanceof NextResponse) return auth;

    const formData = await req.formData();
    const file = formData.get('avatar');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Avatar image is required' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Avatar must be an image' }, { status: 400 });
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: 'Avatar must be smaller than 5MB' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const bucketError = await ensureAvatarBucket(supabaseAdmin.storage);

    if (bucketError) {
      console.error('Avatar bucket setup error:', bucketError);
      return NextResponse.json({
        error: 'Failed to prepare avatar storage',
        details: bucketError.message
      }, { status: 500 });
    }

    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const storagePath = `${auth.profile.id}/avatar-${Date.now()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json({
        error: 'Failed to upload avatar',
        details: uploadError.message
      }, { status: 500 });
    }

    const { data: updatedUser, error: updateError } = await auth.db
      .from('user')
      .update({ avatar_url: storagePath })
      .eq('id', auth.profile.id)
      .select(PROFILE_FIELDS)
      .single();

    if (updateError) {
      console.error('Avatar profile update error:', updateError);
      return NextResponse.json({
        error: 'Failed to save avatar',
        details: updateError.message
      }, { status: 500 });
    }

    const { data: signedAvatar } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(storagePath, 60 * 60);

    return auth.respond(NextResponse.json({
      success: true,
      avatar_url: signedAvatar?.signedUrl || storagePath,
      user: {
        ...updatedUser,
        avatar_url: signedAvatar?.signedUrl || storagePath
      }
    }));
  } catch (error) {
    console.error('Upload avatar error:', error);
    return NextResponse.json({
      error: 'Failed to upload avatar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
