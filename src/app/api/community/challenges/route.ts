import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();

  const [{ data: challenges, error }, { data: participants }] = await Promise.all([
    db.from('challenges').select('*').eq('is_active', true).order('created_at'),
    db.from('challenge_participants').select('challenge_id, user_id'),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const countMap = new Map<string, number>();
  const joinedSet = new Set<string>();
  for (const p of participants ?? []) {
    countMap.set(p.challenge_id, (countMap.get(p.challenge_id) ?? 0) + 1);
    if (p.user_id === userId) joinedSet.add(p.challenge_id);
  }

  const enriched = (challenges ?? []).map((c) => ({
    ...c,
    participant_count: countMap.get(c.id) ?? 0,
    is_joined: joinedSet.has(c.id),
  }));

  return NextResponse.json({ challenges: enriched });
}
