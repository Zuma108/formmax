import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export const runtime = 'nodejs';

const EXERCISE_LABELS: Record<string, string> = {
  deadlift: 'DEADLIFT',
  squat: 'SQUAT',
  bench_press: 'BENCH PRESS',
  generic: 'LIFT',
};

const EXERCISE_EMOJIS: Record<string, string> = {
  deadlift: '🏋️',
  squat: '🦵',
  bench_press: '💪',
  generic: '🔄',
};

const HASHTAGS: Record<string, string> = {
  deadlift: '#DeadliftForm  #HipHinge  #PowerLifting  #FormMax',
  squat: '#SquatForm  #LegDay  #SquatDepth  #FormMax',
  bench_press: '#BenchPress  #ChestDay  #PushDay  #FormMax',
  generic: '#FormCheck  #GymTok  #LiftingTips  #FormMax',
};

const RISK_CONFIG = {
  low: { color: '#10b981', bg: '#064e3b', label: 'LOW RISK' },
  medium: { color: '#f59e0b', bg: '#78350f', label: 'MED RISK' },
  high: { color: '#ef4444', bg: '#7f1d1d', label: 'HIGH RISK' },
};

function scoreGrade(score: number) {
  if (score >= 90) return { letter: 'S', color: '#fbbf24' };
  if (score >= 80) return { letter: 'A', color: '#10b981' };
  if (score >= 65) return { letter: 'B', color: '#60a5fa' };
  if (score >= 50) return { letter: 'C', color: '#f59e0b' };
  return { letter: 'D', color: '#ef4444' };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  let score = parseInt(searchParams.get('score') ?? '0', 10);
  let exercise = searchParams.get('exercise') ?? 'generic';
  let name = searchParams.get('name') ?? 'Athlete';
  let topPriority = searchParams.get('top_priority') ?? '';
  let risk = (searchParams.get('risk') ?? 'low') as keyof typeof RISK_CONFIG;
  const format = searchParams.get('format') ?? 'story'; // 'story' | 'square'
  const sessionId = searchParams.get('session_id');

  // If session_id is provided, load data from DB
  if (sessionId) {
    const db = createAdminClient();
    const { data: session } = await db
      .from('workout_sessions')
      .select('overall_score, exercise, top_priority, injury_risk, user_id')
      .eq('id', sessionId)
      .single();

    if (session) {
      score = session.overall_score ?? 0;
      exercise = session.exercise ?? 'generic';
      topPriority = session.top_priority ?? '';
      risk = (session.injury_risk as keyof typeof RISK_CONFIG) ?? 'low';

      // Fetch user name
      const { data: profile } = await db
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('clerk_user_id', session.user_id)
        .single();
      if (profile) {
        name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Athlete';
      }
    }
  }

  const isSquare = format === 'square';
  const width = 1080;
  const height = isSquare ? 1080 : 1920;

  const grade = scoreGrade(score);
  const riskCfg = RISK_CONFIG[risk] ?? RISK_CONFIG.low;
  const exLabel = EXERCISE_LABELS[exercise] ?? 'LIFT';
  const exEmoji = EXERCISE_EMOJIS[exercise] ?? '🔄';
  const hashtags = HASHTAGS[exercise] ?? HASHTAGS.generic;
  const circumference = 2 * Math.PI * 140;
  const offset = circumference - (score / 100) * circumference;

  return new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          backgroundColor: '#09090b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'sans-serif',
          padding: isSquare ? '60px 60px' : '100px 60px 80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: isSquare ? '-100px' : '-200px',
            left: '50%',
            width: '800px',
            height: '800px',
            background:
              'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
            transform: 'translateX(-50%)',
            display: 'flex',
          }}
        />

        {/* Top: branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#18181b',
              border: '2px solid #27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            ⚡
          </div>
          <span style={{ color: '#ffffff', fontSize: '36px', fontWeight: 900, letterSpacing: '-1px' }}>
            FormMax
          </span>
          <span
            style={{
              color: '#71717a',
              fontSize: '22px',
              fontWeight: 600,
              marginLeft: '4px',
              marginTop: '6px',
            }}
          >
            AI Lift Coach
          </span>
        </div>

        {/* Center: ring + score */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isSquare ? '24px' : '36px',
            zIndex: 1,
          }}
        >
          {/* SVG score ring */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="320" height="320" viewBox="0 0 320 320">
              <circle cx="160" cy="160" r="140" fill="none" stroke="#27272a" strokeWidth="16" />
              <circle
                cx="160"
                cy="160"
                r="140"
                fill="none"
                stroke={grade.color}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${offset}`}
                transform="rotate(-90 160 160)"
              />
            </svg>
            {/* Score inside ring */}
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '100px',
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-4px',
                }}
              >
                {score}
              </span>
              <span style={{ color: '#71717a', fontSize: '26px', fontWeight: 700, letterSpacing: '3px' }}>
                FORMAX SCORE
              </span>
              <div
                style={{
                  marginTop: '10px',
                  backgroundColor: grade.color + '22',
                  border: `2px solid ${grade.color}44`,
                  borderRadius: '12px',
                  padding: '4px 20px',
                  display: 'flex',
                }}
              >
                <span style={{ color: grade.color, fontSize: '24px', fontWeight: 900 }}>
                  GRADE {grade.letter}
                </span>
              </div>
            </div>
          </div>

          {/* Exercise + name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#18181b',
                border: '2px solid #27272a',
                borderRadius: '40px',
                padding: '12px 28px',
              }}
            >
              <span style={{ fontSize: '28px' }}>{exEmoji}</span>
              <span style={{ color: '#d4d4d8', fontSize: '28px', fontWeight: 800, letterSpacing: '2px' }}>
                {exLabel}
              </span>
            </div>
            <span style={{ color: '#52525b', fontSize: '24px', fontWeight: 600 }}>
              {name}&apos;s form analysis
            </span>
          </div>

          {/* Top fix + injury risk */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              width: '100%',
              maxWidth: '900px',
            }}
          >
            {topPriority && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '20px',
                  padding: '20px 28px',
                }}
              >
                <span style={{ fontSize: '28px' }}>🎯</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#71717a', fontSize: '18px', fontWeight: 700, letterSpacing: '2px' }}>
                    TOP PRIORITY
                  </span>
                  <span style={{ color: '#e4e4e7', fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
                    {topPriority.length > 60 ? topPriority.slice(0, 60) + '…' : topPriority}
                  </span>
                </div>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: riskCfg.bg + 'aa',
                border: `1px solid ${riskCfg.color}44`,
                borderRadius: '16px',
                padding: '14px 24px',
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: riskCfg.color,
                  display: 'flex',
                }}
              />
              <span style={{ color: riskCfg.color, fontSize: '22px', fontWeight: 800, letterSpacing: '2px' }}>
                INJURY RISK: {riskCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: hashtags + CTA */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            zIndex: 1,
          }}
        >
          <span style={{ color: '#3f3f46', fontSize: '20px', fontWeight: 600, textAlign: 'center' }}>
            {hashtags}  #FormCheck  #GymTok
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#18181b',
              borderRadius: '40px',
              padding: '14px 32px',
              border: '1px solid #27272a',
            }}
          >
            <span style={{ color: '#71717a', fontSize: '22px' }}>Get your score at</span>
            <span style={{ color: '#10b981', fontSize: '22px', fontWeight: 800 }}>formmax.app</span>
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
    }
  );
}
