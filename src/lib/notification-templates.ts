/**
 * Curated Push Notification Templates
 *
 * Each channel has a pool of templates. The system randomly selects one per send,
 * using {{placeholders}} for dynamic data injection.
 *
 * Design principles:
 * - Concise: title ≤ 50 chars, body ≤ 120 chars (fits lock screen without truncation)
 * - Actionable: leads to a specific screen or insight
 * - Never shaming: always encouraging, data-driven, or practical
 * - No sensitive info in title (visible on lock screen per Apple HIG)
 *
 * Anti-cringe strategy for camera_confidence:
 * 1. Normalize — aggregate stats ("87% of users film every set")
 * 2. Reframe — recording = professional/elite behavior, not vanity
 * 3. Practical tips — remove friction with setup hacks
 * 4. Celebrate privately — reinforce videos stay on-device
 */

import type { NotificationChannel } from './notifications';

export interface NotificationTemplate {
  title: string;
  body: string;
  /** Deep-link target within the app */
  action?: string;
}

// ---------------------------------------------------------------------------
// Channel 1: Workout Results (immediate, post-analysis)
// ---------------------------------------------------------------------------
export const WORKOUT_RESULTS_TEMPLATES: NotificationTemplate[] = [
  {
    title: 'Analysis Ready',
    body: 'Your {{exercise}} scored {{score}}/100. Tap to see the full breakdown.',
    action: '/session/{{sessionId}}',
  },
  {
    title: 'Form Score: {{score}}/100',
    body: '{{reps}} reps analyzed. Your top cue: "{{topCue}}".',
    action: '/session/{{sessionId}}',
  },
  {
    title: 'New Insight Available',
    body: '{{exercise}}: {{positiveNote}}. See what else improved →',
    action: '/session/{{sessionId}}',
  },
  {
    title: '{{score}}/100 — {{trend}}',
    body: "That's {{scoreDelta}} points {{direction}} from last time. Keep refining.",
    action: '/session/{{sessionId}}',
  },
];

// ---------------------------------------------------------------------------
// Channel 2: Streak Reminders (max 1/day, skip if session already logged)
// ---------------------------------------------------------------------------
export const STREAK_REMINDER_TEMPLATES: NotificationTemplate[] = [
  {
    title: 'Day {{streakCount}} Streak 🔥',
    body: "You haven't missed a beat. Keep it rolling.",
    action: '/home',
  },
  {
    title: 'Your Streak Is Alive',
    body: 'Quick 15-min session keeps your {{streakCount}}-day streak going.',
    action: '/home',
  },
  {
    title: "Don't Let It Cool Off",
    body: '{{daysSince}} days since your last session. Your {{exercise}} form was peaking.',
    action: '/home',
  },
  {
    title: 'Consistency Wins',
    body: "You've trained {{weekSessions}} times this week. One more to hit your goal.",
    action: '/home',
  },
  {
    title: 'Your Body Remembers',
    body: 'Even a light session today keeps the neural pathways firing.',
    action: '/home',
  },
];

// ---------------------------------------------------------------------------
// Channel 3: Progress Milestones (event-driven)
// ---------------------------------------------------------------------------
export const PROGRESS_MILESTONE_TEMPLATES: NotificationTemplate[] = [
  {
    title: 'New Personal Best',
    body: 'Your {{bodyPart}} health score just hit "{{level}}" for the first time 💪',
    action: '/progress',
  },
  {
    title: '{{sessionCount}} Sessions Logged',
    body: "That's more than {{percentile}}% of users in their first month.",
    action: '/progress',
  },
  {
    title: 'Form Trend: Improving',
    body: 'Your {{exercise}} consistency improved {{improvementPct}}% over 30 days.',
    action: '/progress',
  },
  {
    title: 'Milestone Unlocked',
    body: "You've analyzed {{totalReps}} total reps. The grind is paying off.",
    action: '/progress',
  },
  {
    title: 'Joint Health Update',
    body: 'Your {{joint}} score moved from "{{prevLevel}}" to "{{newLevel}}". Keep it up.',
    action: '/progress',
  },
];

// ---------------------------------------------------------------------------
// Channel 4: Community (real-time, batched)
// ---------------------------------------------------------------------------
export const COMMUNITY_TEMPLATES: NotificationTemplate[] = [
  {
    title: 'New Like',
    body: "{{userName}} liked your {{exercise}} session — you're inspiring people.",
    action: '/community/feed',
  },
  {
    title: 'New Challenge',
    body: '"{{challengeName}}" just dropped — {{participantCount}} people already in.',
    action: '/community/challenges',
  },
  {
    title: 'Leaderboard Update',
    body: 'You moved up to #{{rank}} on the leaderboard this week.',
    action: '/community/leaderboard',
  },
  {
    title: 'Challenge Complete',
    body: 'You finished "{{challengeName}}"! See how you ranked.',
    action: '/community/challenges/{{challengeId}}',
  },
];

// ---------------------------------------------------------------------------
// Channel 5: Camera Confidence (weekly, 30-60 min before typical gym time)
//
// KEY DIFFERENTIATOR — addresses the #1 adoption barrier: social anxiety
// about recording at the gym. Every template uses one of these strategies:
// [NORMALIZE] [REFRAME] [PRACTICAL] [PRIVATE]
// ---------------------------------------------------------------------------
export const CAMERA_CONFIDENCE_TEMPLATES: NotificationTemplate[] = [
  // [PRACTICAL] — Remove friction
  {
    title: 'Quick Setup Tip',
    body: 'Prop your phone against your water bottle. Takes 3 seconds, zero awkwardness.',
    action: '/home',
  },
  // [NORMALIZE] — Aggregate social proof
  {
    title: "You're Not Alone",
    body: '87% of FormAX users record every working set. Own it.',
    action: '/home',
  },
  // [REFRAME] — Elite behavior framing
  {
    title: 'Train Like a Pro',
    body: 'Elite athletes film every rep. That\'s not cringe — that\'s commitment.',
    action: '/home',
  },
  // [PRACTICAL] — Timing hack
  {
    title: 'The Warm-Up Trick',
    body: 'Set your camera up during warm-ups. By the time you lift, nobody notices.',
    action: '/home',
  },
  // [NORMALIZE] — Reframe the social dynamic
  {
    title: 'Real Talk',
    body: "Everyone at the gym is focused on themselves, not your phone. You're good.",
    action: '/home',
  },
  // [PRIVATE] — Privacy reassurance
  {
    title: 'Your Videos, Your Eyes',
    body: 'Reminder: FormAX never uploads your footage. 100% on-device processing.',
    action: '/home',
  },
  // [REFRAME] — Investment framing
  {
    title: 'Smart Lifters Record',
    body: 'You can\'t improve what you can\'t measure. One video = dozens of data points.',
    action: '/home',
  },
  // [PRACTICAL] — Social hack
  {
    title: 'Tripod Tip',
    body: 'Small phone tripods fit in any gym bag. Set it on the floor, out of the way.',
    action: '/home',
  },
  // [NORMALIZE] — Community angle
  {
    title: 'Everyone Films Now',
    body: 'Walk into any serious gym — half the lifters are filming. Join the informed majority.',
    action: '/home',
  },
  // [REFRAME] — Future self
  {
    title: 'Future You Will Thank You',
    body: "A month of recorded sessions = visible proof you're getting better.",
    action: '/progress',
  },
];

// ---------------------------------------------------------------------------
// Channel 6: Weekly Recap (Monday morning)
// ---------------------------------------------------------------------------
export const WEEKLY_RECAP_TEMPLATES: NotificationTemplate[] = [
  {
    title: 'Your Week in Review',
    body: '{{weekSessions}} sessions, {{avgScore}}/100 avg form. {{topExercise}} improved the most (+{{topDelta}}).',
    action: '/progress',
  },
  {
    title: 'Weekly Recap Ready',
    body: '{{topImprovement}}. See your full training summary →',
    action: '/progress',
  },
  {
    title: 'Monday Motivation',
    body: "Last week's highlight: {{highlight}}. New week, new gains.",
    action: '/progress',
  },
];

// ---------------------------------------------------------------------------
// Template lookup by channel
// ---------------------------------------------------------------------------
export const TEMPLATES_BY_CHANNEL: Record<NotificationChannel, NotificationTemplate[]> = {
  workout_results: WORKOUT_RESULTS_TEMPLATES,
  streak_reminders: STREAK_REMINDER_TEMPLATES,
  progress_milestones: PROGRESS_MILESTONE_TEMPLATES,
  community: COMMUNITY_TEMPLATES,
  camera_confidence: CAMERA_CONFIDENCE_TEMPLATES,
  weekly_recap: WEEKLY_RECAP_TEMPLATES,
};

/**
 * Pick a random template from a channel's pool.
 */
export function pickTemplate(channel: NotificationChannel): NotificationTemplate {
  const pool = TEMPLATES_BY_CHANNEL[channel];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Interpolate {{placeholders}} in a template with actual values.
 */
export function renderTemplate(
  template: NotificationTemplate,
  values: Record<string, string | number>
): NotificationTemplate {
  const interpolate = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key) =>
      values[key] !== undefined ? String(values[key]) : `{{${key}}}`
    );

  return {
    title: interpolate(template.title),
    body: interpolate(template.body),
    action: template.action ? interpolate(template.action) : undefined,
  };
}
