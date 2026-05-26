import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const formData = await req.formData();
    const userId = formData.get('userId');
    const file = formData.get('avatar');

    if (typeof userId !== 'string' || !userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Avatar image is required' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Avatar must be an image' }, { status: 400 });
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: 'Avatar must be smaller than 5MB' }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const bucketError = await ensureAvatarBucket(client.storage);

    if (bucketError) {
      console.error('Avatar bucket setup error:', bucketError);
      return NextResponse.json({
        error: 'Failed to prepare avatar storage',
        details: bucketError.message
      }, { status: 500 });
    }

    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const storagePath = `${userId}/avatar-${Date.now()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await client.storage
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

    const { data: updatedUser, error: updateError } = await client
      .from('user')
      .update({ avatar_url: storagePath })
      .eq('id', userId)
      .select('id, email, first_name, username, favorite_medium, avatar_url')
      .single();

    if (updateError) {
      console.error('Avatar profile update error:', updateError);
      return NextResponse.json({
        error: 'Failed to save avatar',
        details: updateError.message
      }, { status: 500 });
    }

    const { data: signedAvatar } = await client.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(storagePath, 60 * 60);

    return NextResponse.json({
      success: true,
      avatar_url: signedAvatar?.signedUrl || storagePath,
      user: {
        ...updatedUser,
        avatar_url: signedAvatar?.signedUrl || storagePath
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return NextResponse.json({
      error: 'Failed to upload avatar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
