import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// Map joint names to checkpoint keyword fragments that identify them
const JOINT_KEYWORDS: Record<string, string[]> = {
  'Lower Back': ['spine', 'back', 'lumbar', 'hinge', 'brace'],
  'Hips':       ['hip', 'depth', 'drive'],
  'Knees':      ['knee', 'descent', 'tracking', 'foot'],
  'Shoulders':  ['shoulder', 'arch', 'retraction', 'bar path', 'chest', 'grip width'],
  'Elbows':     ['elbow', 'lockout', 'press'],
};

function computeJointHealth(sessions: any[]) {
  const scores: Record<string, { current: number[]; previous: number[] }> = {};
  for (const joint of Object.keys(JOINT_KEYWORDS)) {
    scores[joint] = { current: [], previous: [] };
  }

  const half = Math.ceil(sessions.length / 2);
  sessions.forEach((session, idx) => {
    const checkpoints: any[] = Array.isArray(session.checkpoints) ? session.checkpoints : [];
    const bucket = idx < half ? 'current' : 'previous';
    for (const cp of checkpoints) {
      if (!cp?.name || typeof cp.score !== 'number') continue;
      const lower = cp.name.toLowerCase();
      for (const [joint, keywords] of Object.entries(JOINT_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) {
          scores[joint][bucket].push(cp.score);
        }
      }
    }
  });

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  return Object.entries(scores).map(([name, { current, previous }]) => {
    const currentAvg = avg(current) ?? 65;
    const previousAvg = avg(previous) ?? currentAvg;
    const diff = currentAvg - previousAvg;
    return {
      name,
      score: currentAvg,
      trend: diff > 3 ? 'up' : diff < -3 ? 'down' : 'neutral',
      trendValue: Math.abs(Math.round(diff)),
      hasData: current.length > 0,
    };
  });
}

function computeStreak(sessions: any[]) {
  const dateSet = new Set(
    sessions.map(s => {
      const d = new Date(s.created_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const today = new Date();
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  // Start from today; skip today if no session yet (count from yesterday)
  let current = 0;
  let daysBack = dateSet.has(key(today)) ? 0 : 1;
  while (true) {
    const d = new Date(today);
    d.setDate(today.getDate() - daysBack);
    if (dateSet.has(key(d))) {
      current++;
      daysBack++;
    } else {
      break;
    }
  }

  // Last 7 calendar days (index 0 = 6 days ago, index 6 = today)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return dateSet.has(key(d));
  });

  return { current, last7 };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();

  const { data: sessions, error } = await db
    .from('workout_sessions')
    .select('overall_score, checkpoints, exercise, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const all = sessions ?? [];

  // Score trend — last 30 sessions in chronological order
  const scoreTrend = all
    .slice(0, 30)
    .reverse()
    .map(s => s.overall_score ?? 0);

  // 7-day and 30-day averages
  const now = Date.now();
  const ms7  = 7  * 86_400_000;
  const ms30 = 30 * 86_400_000;
  const recent7  = all.filter(s => now - new Date(s.created_at).getTime() < ms7);
  const recent30 = all.filter(s => now - new Date(s.created_at).getTime() < ms30);
  const avgScore7d  = recent7.length  ? Math.round(recent7.reduce( (a, s) => a + (s.overall_score ?? 0), 0) / recent7.length)  : null;
  const avgScore30d = recent30.length ? Math.round(recent30.reduce((a, s) => a + (s.overall_score ?? 0), 0) / recent30.length) : null;

  const streak = computeStreak(all);
  const jointHealth = computeJointHealth(all);

  return NextResponse.json({
    totalSessions:    all.length,
    sessionsThisWeek: recent7.length,
    avgScore7d,
    avgScore30d,
    streak:           streak.current,
    streakLast7:      streak.last7,
    scoreTrend,
    jointHealth,
  });
}
