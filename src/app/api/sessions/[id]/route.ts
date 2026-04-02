import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const db = createAdminClient();

  // Only allow setting is_public (share action) on own sessions
  const { data: session, error: fetchErr } = await db
    .from('workout_sessions')
    .select('id, user_id, exercise, overall_score')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchErr || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.is_public === 'boolean') updates.is_public = body.is_public;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { error: updateErr } = await db
    .from('workout_sessions')
    .update(updates)
    .eq('id', id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // If making public, also create a community post
  if (body.is_public === true && body.caption !== undefined) {
    const clerkUser = await currentUser();
    // Prefer onboarding name from Supabase, fall back to Clerk
    const { data: profile } = await db.from('user_profiles').select('first_name, last_name, avatar_url').eq('clerk_user_id', userId).single();
    const displayName =
      (profile?.first_name ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}` : null)
      ?? clerkUser?.fullName ?? clerkUser?.firstName ?? clerkUser?.username ?? 'Anonymous';
    const avatarUrl = profile?.avatar_url ?? clerkUser?.imageUrl ?? null;

    await db.from('community_posts').upsert(
      {
        user_id: userId,
        session_id: id,
        caption: body.caption ?? null,
        display_name: displayName,
        avatar_url: avatarUrl,
        exercise: session.exercise,
        overall_score: session.overall_score,
        is_public: true,
      },
      { onConflict: 'session_id' }
    );
  }

  return NextResponse.json({ success: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createAdminClient();

  const { data, error } = await db
    .from('workout_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ session: data });
}
