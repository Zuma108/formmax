import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from('weight_logs')
    .select('id, weight_kg, notes, logged_at')
    .eq('clerk_user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(90);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const weight_kg = parseFloat(body.weight_kg);
  if (!weight_kg || weight_kg < 20 || weight_kg > 500) {
    return NextResponse.json({ error: 'Invalid weight' }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from('weight_logs')
    .insert({
      clerk_user_id: userId,
      weight_kg,
      notes: body.notes ?? null,
      logged_at: body.logged_at ?? new Date().toISOString(),
    })
    .select('id, weight_kg, notes, logged_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log: data });
}
