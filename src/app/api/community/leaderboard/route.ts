import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();

  // Top 10 users by average overall_score in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: sessions, error } = await db
    .from('workout_sessions')
    .select('user_id, overall_score')
    .gte('created_at', thirtyDaysAgo)
    .not('overall_score', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate scores per user
  const scoreMap = new Map<string, { total: number; count: number }>();
  for (const s of sessions ?? []) {
    const entry = scoreMap.get(s.user_id) ?? { total: 0, count: 0 };
    entry.total += s.overall_score;
    entry.count += 1;
    scoreMap.set(s.user_id, entry);
  }

  const userIds = Array.from(scoreMap.keys());
  if (userIds.length === 0) {
    return NextResponse.json({ leaderboard: [], currentUserRank: null });
  }

  // Fetch display names from user_profiles
  const { data: profiles } = await db
    .from('user_profiles')
    .select('clerk_user_id, first_name, last_name, avatar_url')
    .in('clerk_user_id', userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.clerk_user_id, p])
  );

  const ranked = Array.from(scoreMap.entries())
    .map(([uid, { total, count }]) => {
      const p = profileMap.get(uid);
      return {
        user_id: uid,
        display_name: p
          ? [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Anonymous'
          : 'Anonymous',
        avatar_url: p?.avatar_url ?? null,
        avg_score: Math.round(total / count),
        session_count: count,
        is_current_user: uid === userId,
      };
    })
    .sort((a, b) => b.avg_score - a.avg_score)
    .slice(0, 10)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  const currentUserRank =
    ranked.find((e) => e.is_current_user)?.rank ?? null;

  return NextResponse.json({ leaderboard: ranked, currentUserRank });
}
