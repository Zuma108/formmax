/**
 * Push Notification Channel Definitions & Configuration
 *
 * 6 channels mapped to Apple notification categories and Android notification channels.
 * Each channel has an importance level, description, and scheduling rules.
 *
 * Compliance:
 * - Apple 4.5.4: Notifications not required for app function; no marketing without explicit opt-in
 * - Apple 4.5.3: No spam or unsolicited messages
 * - Apple 2.5.16: All notifications related to app content/functionality
 * - Android: Channels with appropriate importance levels; no duplicate flooding
 */

export type NotificationChannel =
  | 'workout_results'
  | 'streak_reminders'
  | 'progress_milestones'
  | 'community'
  | 'camera_confidence'
  | 'weekly_recap';

export type ChannelImportance = 'high' | 'medium' | 'low';

export interface ChannelConfig {
  id: NotificationChannel;
  name: string;
  description: string;
  importance: ChannelImportance;
  /** Max notifications per day for this channel (0 = unlimited, event-driven) */
  maxPerDay: number;
  /** Whether to skip if the user already has an active session today */
  skipIfActiveToday: boolean;
  /** Quiet hours respected (no sends between 10pm–8am user local time) */
  respectQuietHours: boolean;
}

export const NOTIFICATION_CHANNELS: Record<NotificationChannel, ChannelConfig> = {
  workout_results: {
    id: 'workout_results',
    name: 'Workout Results',
    description: 'Form scores and AI analysis results after each session',
    importance: 'high',
    maxPerDay: 0, // event-driven, per-session
    skipIfActiveToday: false,
    respectQuietHours: true,
  },
  streak_reminders: {
    id: 'streak_reminders',
    name: 'Streak Reminders',
    description: 'Daily motivation to maintain your training streak',
    importance: 'medium',
    maxPerDay: 1,
    skipIfActiveToday: true, // don't nag if they already trained
    respectQuietHours: true,
  },
  progress_milestones: {
    id: 'progress_milestones',
    name: 'Progress Milestones',
    description: 'Form improvements, PRs, and health score achievements',
    importance: 'medium',
    maxPerDay: 2,
    skipIfActiveToday: false,
    respectQuietHours: true,
  },
  community: {
    id: 'community',
    name: 'Community',
    description: 'Likes on your sessions, challenge updates, and leaderboard moves',
    importance: 'low',
    maxPerDay: 5,
    skipIfActiveToday: false,
    respectQuietHours: true,
  },
  camera_confidence: {
    id: 'camera_confidence',
    name: 'Camera Tips',
    description: 'Setup tips and encouragement for recording at the gym',
    importance: 'low',
    maxPerDay: 1,
    skipIfActiveToday: false,
    respectQuietHours: true,
  },
  weekly_recap: {
    id: 'weekly_recap',
    name: 'Weekly Recap',
    description: 'Monday summary of your training week',
    importance: 'medium',
    maxPerDay: 1,
    skipIfActiveToday: false,
    respectQuietHours: false, // always Monday morning
  },
};

/**
 * Returns whether a notification should be suppressed based on quiet hours.
 * Quiet hours: 10pm – 8am in user's local time.
 */
export function isQuietHours(): boolean {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 8;
}

/**
 * Returns all channel IDs sorted by importance (high → low).
 */
export function getChannelsByImportance(): NotificationChannel[] {
  const order: Record<ChannelImportance, number> = { high: 0, medium: 1, low: 2 };
  return (Object.values(NOTIFICATION_CHANNELS) as ChannelConfig[])
    .sort((a, b) => order[a.importance] - order[b.importance])
    .map(c => c.id);
}
