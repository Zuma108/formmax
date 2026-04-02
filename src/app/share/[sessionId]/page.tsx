import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';

interface Props {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  const db = createAdminClient();

  const { data: session } = await db
    .from('workout_sessions')
    .select('overall_score, exercise, top_priority, injury_risk, is_public')
    .eq('id', sessionId)
    .single();

  if (!session?.is_public) {
    return { title: 'FormMax — AI Lift Coach' };
  }

  const exercise = (session.exercise ?? 'lift').replace('_', ' ');
  const score = session.overall_score ?? 0;
  const ogUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://formmax.app'}/api/og/score-card?session_id=${sessionId}`;

  return {
    title: `${score}/100 ${exercise} form score — FormMax`,
    description: `AI lift analysis: ${session.top_priority ?? 'See detailed form breakdown'}. Injury risk: ${session.injury_risk ?? 'low'}.`,
    openGraph: {
      title: `I scored ${score}/100 on my ${exercise} — FormMax AI Coach`,
      description: session.top_priority ?? 'See my full form breakdown on FormMax',
      images: [{ url: ogUrl, width: 1080, height: 1920, alt: 'FORMAX score card' }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${score}/100 ${exercise} form — FormMax`,
      description: session.top_priority ?? 'AI lift analysis',
      images: [ogUrl],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { sessionId } = await params;
  const db = createAdminClient();

  const { data: session } = await db
    .from('workout_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('is_public', true)
    .single();

  if (!session) notFound();

  const { data: profile } = await db
    .from('user_profiles')
    .select('first_name, last_name')
    .eq('clerk_user_id', session.user_id)
    .single();

  const displayName =
    profile
      ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Anonymous'
      : 'Anonymous';

  const exercise = (session.exercise ?? 'lift').replace('_', ' ');
  const score = session.overall_score ?? 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://formmax.app';
  const cardUrl = `${appUrl}/api/og/score-card?session_id=${sessionId}`;

  // Increment share_count
  await db
    .from('workout_sessions')
    .update({ share_count: (session.share_count ?? 0) + 1 })
    .eq('id', sessionId);

  return (
    <main
      style={{
        minHeight: '100dvh',
        backgroundColor: '#09090b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Score card preview */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cardUrl}
        alt={`${displayName}'s FORMAX score`}
        style={{
          width: '100%',
          maxWidth: '380px',
          borderRadius: '24px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          marginBottom: '32px',
        }}
      />

      <h1
        style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 900,
          textAlign: 'center',
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
        }}
      >
        {displayName} scored {score}/100
      </h1>
      <p style={{ color: '#71717a', fontSize: '16px', textAlign: 'center', margin: '0 0 32px' }}>
        {exercise} form analysis by FormMax AI
      </p>

      {/* Download for TikTok */}
      <a
        href={cardUrl}
        download={`formscore-${score}.png`}
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#ffffff',
          color: '#09090b',
          fontSize: '18px',
          fontWeight: 800,
          padding: '18px 0',
          borderRadius: '40px',
          textAlign: 'center',
          textDecoration: 'none',
          marginBottom: '14px',
          display: 'block',
        }}
      >
        ⬇ Download for TikTok / Reels
      </a>

      {/* CTA */}
      <a
        href={`${appUrl}/sign-up`}
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#10b981',
          color: '#ffffff',
          fontSize: '18px',
          fontWeight: 800,
          padding: '18px 0',
          borderRadius: '40px',
          textAlign: 'center',
          textDecoration: 'none',
          display: 'block',
        }}
      >
        ⚡ Get my FORMAX score — Free
      </a>

      <p style={{ color: '#3f3f46', fontSize: '13px', marginTop: '24px' }}>
        formmax.app · AI-powered lift analysis
      </p>
    </main>
  );
}
