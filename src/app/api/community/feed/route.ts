import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') ?? null;

  const db = createAdminClient();

  let query = db
    .from('community_posts')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (cursor) query = query.lt('created_at', cursor);

  const { data: posts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch which posts current user has liked
  const postIds = (posts ?? []).map((p) => p.id);
  const { data: likes } = postIds.length
    ? await db
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds)
    : { data: [] };

  const likedSet = new Set((likes ?? []).map((l) => l.post_id));

  const enriched = (posts ?? []).map((p) => ({
    ...p,
    is_liked_by_me: likedSet.has(p.id),
  }));

  const nextCursor =
    enriched.length === 20
      ? enriched[enriched.length - 1].created_at
      : null;

  return NextResponse.json({ posts: enriched, nextCursor });
}
