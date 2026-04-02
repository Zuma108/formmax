import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId } = await params;
  const db = createAdminClient();

  // Check if already liked
  const { data: existing } = await db
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Unlike
    await db.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
    const { error: rpcErr } = await db.rpc('decrement_likes', { post_id: postId });
    if (rpcErr) {
      await db.from('community_posts')
        .update({ likes_count: 0 })
        .eq('id', postId);
    }
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await db.from('post_likes').insert({ post_id: postId, user_id: userId });
    // Increment likes_count via a safe update
    const { data: post } = await db
      .from('community_posts')
      .select('likes_count')
      .eq('id', postId)
      .single();
    if (post) {
      await db
        .from('community_posts')
        .update({ likes_count: (post.likes_count ?? 0) + 1 })
        .eq('id', postId);
    }
    return NextResponse.json({ liked: true });
  }
}
