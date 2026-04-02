import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

const ALLOWED_FIELDS = new Set([
  'first_name', 'last_name', 'email', 'gender', 'body_weight', 'weight_unit',
  'experience', 'setup', 'focus_areas', 'weaknesses', 'injuries', 'primary_goal',
  'strictness', 'audio_feedback', 'notifications_allowed', 'language',
  'form_score_targets', 'joint_thresholds', 'session_replay_autoplay', 'session_replay_quality',
]);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key)) updates[key] = value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const db = createAdminClient();
  const { error } = await db
    .from('user_profiles')
    .update(updates)
    .eq('clerk_user_id', userId);

  if (error) {
    console.error('[profile update]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
