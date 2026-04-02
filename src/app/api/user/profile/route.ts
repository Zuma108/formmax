import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const clerkUser = await currentUser();

  const db = createAdminClient();

  const { error } = await db.from('user_profiles').upsert(
    {
      clerk_user_id: userId,
      first_name: body.firstName ?? null,
      last_name: body.lastName ?? null,
      email: body.email ?? clerkUser?.primaryEmailAddress?.emailAddress ?? null,
      gender: body.gender ?? null,
      body_weight: body.bodyWeight ?? null,
      weight_unit: body.weightUnit ?? 'kg',
      experience: body.experience ?? null,
      setup: body.setup ?? null,
      focus_areas: body.focusAreas ?? [],
      weaknesses: body.weaknesses ?? [],
      injuries: body.injuries ?? [],
      primary_goal: body.primaryGoal ?? null,
      strictness: body.strictness ?? null,
      audio_feedback: body.audioFeedbackAllowed ?? null,
      notifications_allowed: body.notificationsAllowed ?? null,
      avatar_url: clerkUser?.imageUrl ?? null,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'clerk_user_id' }
  );

  if (error) {
    console.error('[profile upsert]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from('user_profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data ?? null });
}

// ── Partial update (settings, personal details, preferences) ──────────────

const ALLOWED_PATCH_FIELDS: Record<string, string> = {
  first_name: 'first_name',
  last_name: 'last_name',
  email: 'email',
  gender: 'gender',
  body_weight: 'body_weight',
  weight_unit: 'weight_unit',
  experience: 'experience',
  setup: 'setup',
  focus_areas: 'focus_areas',
  weaknesses: 'weaknesses',
  injuries: 'injuries',
  primary_goal: 'primary_goal',
  strictness: 'strictness',
  audio_feedback: 'audio_feedback',
  notifications_allowed: 'notifications_allowed',
  language: 'language',
  form_score_targets: 'form_score_targets',
  joint_thresholds: 'joint_thresholds',
  session_replay_autoplay: 'session_replay_autoplay',
  session_replay_quality: 'session_replay_quality',
};

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  for (const [key, col] of Object.entries(ALLOWED_PATCH_FIELDS)) {
    if (key in body) updates[col] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const db = createAdminClient();
  const { error } = await db
    .from('user_profiles')
    .update(updates)
    .eq('clerk_user_id', userId);

  if (error) {
    console.error('[profile patch]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ── Delete account (cascade-delete all user data from Supabase) ───────────

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();

  // Order matters: delete referencing rows first
  const tables: { table: string; col: string }[] = [
    { table: 'community_posts', col: 'user_id' },
    { table: 'post_likes', col: 'user_id' },
    { table: 'progress_photos', col: 'clerk_user_id' },
    { table: 'weight_logs', col: 'clerk_user_id' },
    { table: 'workout_sessions', col: 'user_id' },
    { table: 'user_profiles', col: 'clerk_user_id' },
  ];

  for (const { table, col } of tables) {
    const { error } = await db.from(table).delete().eq(col, userId);
    if (error) {
      console.error(`[delete ${table}]`, error);
      // continue — best-effort deletion of remaining tables
    }
  }

  return NextResponse.json({ success: true, deleted: true });
}
