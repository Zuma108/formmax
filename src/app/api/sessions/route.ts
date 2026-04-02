import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { exercise, result } = body;

  if (!exercise || !result) {
    return NextResponse.json({ error: 'Missing exercise or result' }, { status: 400 });
  }

  const db = createAdminClient();

  const { data, error } = await db
    .from('workout_sessions')
    .insert({
      user_id: userId,
      exercise,
      overall_score: result.overall_score ?? null,
      checkpoints: result.checkpoints ?? null,
      injury_risk: result.injury_risk ?? null,
      detected_rep_count: result.detected_rep_count ?? null,
      rep_scores: result.rep_scores ?? null,
      top_priority: result.top_priority ?? null,
      positive: result.positive ?? null,
      bad_form_detected: result.bad_form_detected ?? false,
      bad_form_flags: result.bad_form_flags ?? [],
      camera_angle_quality: result.camera_angle_quality ?? null,
      body_visibility_quality: result.body_visibility_quality ?? null,
      consistency_summary: result.consistency_summary ?? null,
      is_public: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[session insert]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from('workout_sessions')
    .select('id, exercise, overall_score, injury_risk, top_priority, is_public, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}
