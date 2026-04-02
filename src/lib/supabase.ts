import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser-safe singleton client (anon key, use in client components)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-only admin client — Do NOT import in client components
// Uses service_role key in production; falls back to anon (works while RLS is disabled)
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey;
  return createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---- Shared DB types ----

export type UserProfile = {
  id: string;
  clerk_user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  gender: string | null;
  body_weight: number | null;
  weight_unit: string;
  experience: string | null;
  setup: string | null;
  focus_areas: string[];
  weaknesses: string[];
  injuries: string[];
  primary_goal: string | null;
  strictness: string | null;
  audio_feedback: boolean | null;
  notifications_allowed: boolean | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
  language: string | null;
  form_score_targets: Record<string, number> | null;
  joint_thresholds: Record<string, number> | null;
  session_replay_autoplay: boolean | null;
  session_replay_quality: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutSession = {
  id: string;
  user_id: string;
  exercise: string;
  overall_score: number | null;
  checkpoints: unknown;
  injury_risk: string | null;
  detected_rep_count: number | null;
  rep_scores: unknown;
  top_priority: string | null;
  positive: string | null;
  bad_form_detected: boolean;
  bad_form_flags: string[];
  camera_angle_quality: number | null;
  body_visibility_quality: number | null;
  consistency_summary: string | null;
  is_public: boolean;
  share_count: number;
  created_at: string;
};

export type CommunityPost = {
  id: string;
  user_id: string;
  session_id: string | null;
  caption: string | null;
  display_name: string | null;
  avatar_url: string | null;
  exercise: string | null;
  overall_score: number | null;
  likes_count: number;
  share_count: number;
  is_public: boolean;
  created_at: string;
};

export type Challenge = {
  id: string;
  title: string;
  description: string | null;
  exercise: string | null;
  emoji: string | null;
  color_class: string | null;
  is_active: boolean;
  participant_count?: number;
  is_joined?: boolean;
};
