import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

const MAX_PHOTO_BYTES = 300_000; // 300 KB base64 limit

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from('progress_photos')
    .select('id, photo_data, caption, created_at')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ photos: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { photo_data, caption } = body;

  if (!photo_data || typeof photo_data !== 'string') {
    return NextResponse.json({ error: 'Missing photo_data' }, { status: 400 });
  }
  if (photo_data.length > MAX_PHOTO_BYTES * 1.4) {
    return NextResponse.json({ error: 'Photo too large (max 300KB)' }, { status: 413 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from('progress_photos')
    .insert({ clerk_user_id: userId, photo_data, caption: caption ?? null })
    .select('id, photo_data, caption, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ photo: data });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db
    .from('progress_photos')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
