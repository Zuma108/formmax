import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const type = body.type;
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!['feature_request', 'support'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (!message || message.length > 5000) {
    return NextResponse.json({ error: 'Message required (max 5000 chars)' }, { status: 400 });
  }

  const db = createAdminClient();

  const { error } = await db.from('feedback_messages').insert({
    clerk_user_id: userId,
    type,
    message,
    email: typeof body.email === 'string' ? body.email.trim() : null,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
