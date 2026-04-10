"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '@/components/LoadingScreen';
import { 
 X, Zap, Image as ImageIcon, HelpCircle, 
 Activity, CheckCircle2, ChevronRight, 
 Video, History, User, Heart, Mic, Camera,
 Home, BarChart3, Users, Plus, Flame,
 Bell, UserPlus, Settings, Globe, Palette,
 Target, TrendingUp, Award, Shield, Edit, Share2,
 LogOut, Trash2, Mail, FileText, ShieldCheck,
 MessageSquare, Crosshair, Dumbbell, Eye,
 Smartphone, Scan, BarChart
} from 'lucide-react';
import Webcam from 'react-webcam';
import { useUser, UserButton, SignInButton, useClerk } from '@clerk/nextjs';
import ProgressSection from '@/components/ProgressSection';
import FormAnalysisPopup from '@/components/FormAnalysisPopup';

const MOCK_GRAPH_DATA = [
 { subject: 'Power', FORMAX: 88, GoldStandard: 95, fullMark: 100 },
 { subject: 'Grace', FORMAX: 76, GoldStandard: 90, fullMark: 100 },
 { subject: 'Consistency', FORMAX: 92, GoldStandard: 98, fullMark: 100 },
];

// ── Stable module-level component (must not be defined inside the page) ───
const ModalShell = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
 <motion.div
  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
  className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
  onClick={onClose}
 >
  <motion.div
   initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
   transition={{ type: 'spring', damping: 28, stiffness: 260 }}
   className="bg-white rounded-t-[2rem] w-full max-w-md max-h-[85vh] overflow-y-auto px-6 pt-5 pb-10"
   onClick={e => e.stopPropagation()}
  >
   <div className="flex items-center justify-between mb-5">
    <h2 className="font-bold text-xl text-zinc-900">{title}</h2>
    <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
     <X className="w-4 h-4 text-zinc-500" />
    </button>
   </div>
   {children}
  </motion.div>
 </motion.div>
);

export default function MobileApp() {
 const [view, setView] = useState<'HOME' | 'CAMERA' | 'PROCESSING' | 'RESULT' | 'FIX_FORM' | 'FEEDBACK'>('HOME');
 const [showResultPopup, setShowResultPopup] = useState(false);
 const [feedbackType, setFeedbackType] = useState<'feature_request' | 'support'>('feature_request');
 const [activeTab, setActiveTab] = useState<'Home' | 'Progress' | 'Community' | 'Profile'>('Home');
 const { user, isSignedIn } = useUser();
 const [processingStep, setProcessingStep] = useState(0);
 const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
 const [result, setResult] = useState<any>(null);
 const webcamRef = useRef<Webcam>(null);
 const mediaRecorderRef = useRef<MediaRecorder | null>(null);
 const [isRecording, setIsRecording] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [selectedRange, setSelectedRange] = useState('90 Days');
 const [recordingTime, setRecordingTime] = useState(0);
 const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
 const recordingStartRef = useRef<number>(0);
 const MAX_RECORDING_SECONDS = 15;
 const [selectedExercise, setSelectedExercise] = useState<'deadlift' | 'squat' | 'bench_press' | 'generic'>('deadlift');
 const [analysisError, setAnalysisError] = useState<string | null>(null);
 const [sessionId, setSessionId] = useState<string | null>(null);
 const [shareLoading, setShareLoading] = useState(false);
 const [postedToCommunity, setPostedToCommunity] = useState(false);
 // Community tab state
 const [challenges, setChallenges] = useState<any[]>([]);
 const [leaderboard, setLeaderboard] = useState<any[]>([]);
 const [feedPosts, setFeedPosts] = useState<any[]>([]);
 const [communityLoaded, setCommunityLoaded] = useState(false);

 // User profile from Supabase (onboarding data)
 const [userProfile, setUserProfile] = useState<{
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  gender: string | null;
  body_weight: number | null;
  weight_unit: string | null;
  experience: string | null;
  focus_areas: string[] | null;
  weaknesses: string[] | null;
  injuries: string[] | null;
  primary_goal: string | null;
  strictness: string | null;
  language: string | null;
  form_score_targets: Record<string, number> | null;
  joint_thresholds: Record<string, number> | null;
  session_replay_autoplay: boolean | null;
  session_replay_quality: string | null;
  audio_feedback: boolean | null;
  notifications_allowed: boolean | null;
 } | null>(null);

 // Profile modals
 const [profileModal, setProfileModal] = useState<null | 'personal' | 'preferences' | 'language' | 'targets' | 'focus' | 'joints' | 'exercises' | 'replay' | 'history' | 'historyDetail' | 'deleteConfirm' | 'widgetHelp'>(null);
 const [activeWidgetIndex, setActiveWidgetIndex] = useState(0);
 const widgetScrollRef = useRef<HTMLDivElement>(null);
 const [profileSaving, setProfileSaving] = useState(false);
 const [profileToast, setProfileToast] = useState<string | null>(null);
 const [feedbackMessage, setFeedbackMessage] = useState('');
 // Session history
 const [sessions, setSessions] = useState<any[]>([]);
 const [sessionsLoaded, setSessionsLoaded] = useState(false);
 const [selectedSession, setSelectedSession] = useState<any | null>(null);
 const [deleteLoading, setDeleteLoading] = useState(false);
 const [profileLoaded, setProfileLoaded] = useState(false);

 // Prefetched progress data
 const [prefetchedStats, setPrefetchedStats] = useState<any>(undefined);
 const [prefetchedWeightLogs, setPrefetchedWeightLogs] = useState<any[] | undefined>(undefined);
 const [prefetchedPhotos, setPrefetchedPhotos] = useState<any[] | undefined>(undefined);

 const EXERCISE_OPTIONS = [
  { key: 'deadlift' as const, label: 'Deadlift', emoji: '🏋️' },
  { key: 'squat' as const, label: 'Squat', emoji: '🦵' },
  { key: 'bench_press' as const, label: 'Bench Press', emoji: '💪' },
  { key: 'generic' as const, label: 'Other', emoji: '🔄' },
 ];

 // Prefetch progress data alongside profile so the Progress tab is instant
 const prefetchProgress = useCallback(() => {
   Promise.all([
    fetch('/api/progress/stats').then(r => r.ok ? r.json() : null),
    fetch('/api/progress/weight').then(r => r.ok ? r.json() : null),
    fetch('/api/progress/photos').then(r => r.ok ? r.json() : null),
   ])
    .then(([stats, weight, photos]) => {
     setPrefetchedStats(stats);
     setPrefetchedWeightLogs(weight?.logs ?? []);
     setPrefetchedPhotos(photos?.photos ?? []);
    })
    .catch(console.error);
 }, []);

 // Load user profile from Supabase (onboarding data)
 useEffect(() => {
  if (!isSignedIn) return;

  // Start prefetching progress data immediately
  prefetchProgress();

  // Check if there's pending onboarding data saved before Clerk sign-up
  const pending = localStorage.getItem('pending_onboarding_profile');
  if (pending) {
   try {
    const answers = JSON.parse(pending);
    fetch('/api/user/profile', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(answers),
    })
     .then(r => r.ok ? r.json() : null)
     .then(() => {
      localStorage.removeItem('pending_onboarding_profile');
      // Refresh profile state after saving
      return fetch('/api/user/profile');
     })
     .then(r => r && r.ok ? r.json() : null)
     .then(d => { if (d?.profile) setUserProfile(d.profile); })
     .catch(console.error)
     .finally(() => setProfileLoaded(true));
   } catch (e) {
    console.error('[pending onboarding]', e);
    localStorage.removeItem('pending_onboarding_profile');
    setProfileLoaded(true);
   }
  } else {
   fetch('/api/user/profile')
    .then(r => r.ok ? r.json() : null)
    .then(d => { if (d?.profile) setUserProfile(d.profile); })
    .catch(console.error)
    .finally(() => setProfileLoaded(true));
  }
 }, [isSignedIn, prefetchProgress]);

 // Load community data when tab activates
 useEffect(() => {
  if (activeTab !== 'Community' || communityLoaded) return;
  let cancelled = false;
  const load = async () => {
   const [cRes, lRes, fRes] = await Promise.all([
    fetch('/api/community/challenges'),
    fetch('/api/community/leaderboard'),
    fetch('/api/community/feed'),
   ]);
   if (cancelled) return;
   if (cRes.ok) { const d = await cRes.json(); setChallenges(d.challenges ?? []); }
   if (lRes.ok) { const d = await lRes.json(); setLeaderboard(d.leaderboard ?? []); }
   if (fRes.ok) { const d = await fRes.json(); setFeedPosts(d.posts ?? []); }
   setCommunityLoaded(true);
  };
  load().catch(console.error);
  return () => { cancelled = true; };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [activeTab]);

 // --- Handlers ---

 const handleStartCapture = useCallback(() => {
 setIsRecording(true);
 setRecordingTime(0);
 recordingStartRef.current = Date.now();
 if (webcamRef.current && webcamRef.current.stream) {
 const vp9 = "video/webm;codecs=vp9";
 const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(vp9) ? vp9 : "video/webm";
 mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
 mimeType,
 videoBitsPerSecond: 2_000_000,
 });
 const chunks: Blob[] = [];
 mediaRecorderRef.current.ondataavailable = (e) => {
 if (e.data.size > 0) chunks.push(e.data);
 };
 mediaRecorderRef.current.onstop = () => {
 const blob = new Blob(chunks, { type: "video/webm" });
 const url = URL.createObjectURL(blob);
 const duration = (Date.now() - recordingStartRef.current) / 1000;
 setMediaBlobUrl(url);
 processMedia(blob, duration);
 };
 mediaRecorderRef.current.start();

 // Countdown timer (updates every 100ms)
 recordingTimerRef.current = setInterval(() => {
 const elapsed = (Date.now() - recordingStartRef.current) / 1000;
 setRecordingTime(elapsed);
 if (elapsed >= MAX_RECORDING_SECONDS) {
 if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
 mediaRecorderRef.current.stop();
 setIsRecording(false);
 }
 if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
 }
 }, 100);
 }
 }, [webcamRef]);

 const handleStopCaptureClick = useCallback(() => {
 if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
 mediaRecorderRef.current.stop();
 setIsRecording(false);
 }
 if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
 }, []);

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files.length > 0) {
 const file = e.target.files[0];
 const url = URL.createObjectURL(file);
 setMediaBlobUrl(url);
 processMedia(file);
 }
 };

 const processMedia = async (blob: Blob, duration?: number) => {
 setView('PROCESSING');
 setProcessingStep(1);

 setTimeout(() => setProcessingStep(2), 2000);
 setTimeout(() => setProcessingStep(3), 4000);
 
 try {
 setAnalysisError(null);
 const formData = new FormData();
 formData.append('video', blob, 'workout.webm');
 formData.append('exercise', selectedExercise);
 formData.append('pro_reference_id', selectedExercise);
 if (duration) formData.append('duration', String(duration.toFixed(1)));

 // Netlify hard limit: 6MB request payload (4.5MB binary after base64 overhead)
 const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;
 if (blob.size > MAX_UPLOAD_BYTES) {
 throw new Error(`Video is too large (${(blob.size / 1024 / 1024).toFixed(1)}MB). Record a shorter clip or use a lower quality camera setting.`);
 }
 
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(), 55_000);
 const response = await fetch('/api/compare_workout', {
 method: 'POST',
 body: formData,
 signal: controller.signal,
 });
 clearTimeout(timeout);

 const contentType = response.headers.get('content-type') || '';
 if (!contentType.includes('application/json')) {
 throw new Error(
 response.status === 413
 ? 'Video file is too large for the server. Try a shorter clip.'
 : `Server error (${response.status}). Please try again.`
 );
 }

 const data = await response.json();
 if (!response.ok) throw new Error(data?.error || `API failed (${response.status})`);

 if (data.rejected) {
 setAnalysisError(data.rejection_reason || 'No exercise detected. Record yourself performing the full movement.');
 setResult(null);
 setTimeout(() => { setView('HOME'); setShowResultPopup(true); }, 500);
 return;
 }
 
 setResult(data);
 // Fire-and-forget: save session to Supabase
 fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ exercise: selectedExercise, result: data }),
 }).then(r => r.json()).then(json => {
  if (json?.id) setSessionId(json.id);
 }).catch(console.error);
 setTimeout(() => { setView('HOME'); setShowResultPopup(true); }, 1000);
 
 } catch (e) {
 console.error(e);
 let msg: string;
 if (e instanceof DOMException && e.name === 'AbortError') {
  msg = 'Analysis timed out. Try a shorter clip or better connection.';
 } else if (e instanceof Error) {
  // Sanitize: don't show raw JSON or overly long API errors to the user
  const raw = e.message;
  if (raw.length > 200 || raw.startsWith('{') || raw.includes('RESOURCE_EXHAUSTED') || raw.includes('quota')) {
   msg = 'Our AI service is temporarily at capacity. Please try again in a minute.';
  } else {
   msg = raw;
  }
 } else {
  msg = 'Analysis failed. Please try again.';
 }
 setAnalysisError(msg);
 setResult(null);
 setTimeout(() => { setView('HOME'); setShowResultPopup(true); }, 1000);
 }
 };

 // --- Share score card ---
 const handleShareScore = async () => {
  if (!result) return;
  setShareLoading(true);
  try {
   const name = user?.firstName ?? 'Athlete';
   const score = result.final_score ?? result.overall_score ?? 0;
   const params = new URLSearchParams({
    score: String(score),
    exercise: selectedExercise,
    name,
    top_priority: result.critique?.grace ?? result.top_priority ?? '',
    risk: result.injury_risk ?? 'low',
    ...(sessionId ? { session_id: sessionId } : {}),
   });
   const imageUrl = `/api/og/score-card?${params.toString()}`;
   const response = await fetch(imageUrl);
   const blob = await response.blob();
   const file = new File([blob], 'my-formax-score.png', { type: 'image/png' });
   const hashtags: Record<string, string> = {
    deadlift: '#DeadliftForm #FormCheck #PowerLifting #FormMax',
    squat: '#SquatForm #LegDay #FormCheck #FormMax',
    bench_press: '#BenchPress #ChestDay #FormCheck #FormMax',
    generic: '#FormCheck #GymTok #FormMax',
   };
   const text = `My AI coach just rated my ${selectedExercise.replace(/_/g, ' ')} ${score}/100 💪 Can you beat my FORMAX score? ${hashtags[selectedExercise] ?? hashtags.generic}`;
   if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text });
   } else {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'my-formax-score.png';
    link.click();
   }
  } catch (e) {
   if (e instanceof Error && e.name !== 'AbortError') console.error(e);
  } finally {
   setShareLoading(false);
  }
 };

 const handlePostToCommunity = async () => {
  if (!sessionId) return;
  try {
   await fetch(`/api/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_public: true, caption: null }),
   });
   setPostedToCommunity(true);
  } catch (e) {
   console.error(e);
  }
 };

 // --- Screens ---

 // --- Helper: color from score ---
 const scoreColor = (score: number) => {
 if (score >= 70) return { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', ring: '#059669' };
 if (score >= 40) return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', ring: '#d97706' };
 return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', ring: '#dc2626' };
 };

 // Calculate starting FormAX score from onboarding profile
 const formaxScore = useMemo(() => {
  if (!userProfile) return 75; // default before profile loads

  // Base score by experience level
  let score = 75;
  if (userProfile.experience === 'Beginner') score = 62;
  else if (userProfile.experience === 'Intermediate') score = 75;
  else if (userProfile.experience === 'Advanced') score = 86;

  // Weaknesses: each known weakness lowers the score
  const weaknesses = userProfile.weaknesses ?? [];
  score -= weaknesses.length * 3;

  // Injuries: each injury area lowers the score, "None" gives a bonus
  const injuries = userProfile.injuries ?? [];
  if (injuries.includes('None') || injuries.length === 0) {
   score += 4;
  } else {
   score -= injuries.filter(i => i !== 'None').length * 4;
  }

  // Strictness: strict grading starts you lower, hype man starts higher
  if (userProfile.strictness === 'Strict') score -= 5;
  else if (userProfile.strictness === 'Hype Man') score += 4;

  // Goal-based adjustment
  if (userProfile.primary_goal === 'PRs') score += 2;
  else if (userProfile.primary_goal === 'Injuries') score -= 2;

  // Clamp to 30-98 range
  return Math.max(30, Math.min(98, Math.round(score)));
 }, [userProfile]);

 const jointData = [
 { name: 'Knees', score: 72, icon: '🦵' },
 { name: 'Shoulders', score: 45, icon: '💪' },
 { name: 'Lower Back', score: 28, icon: '🔻' },
 ];
 const weekDays = useMemo(() => {
 const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
 const today = new Date();
 return days.map((d, i) => {
 const diff = i - today.getDay();
 const date = new Date(today);
 date.setDate(today.getDate() + diff);
 return { day: d, date: date.getDate(), isToday: diff === 0 };
 });
 }, []);
 const [activeDay, setActiveDay] = useState(() => new Date().getDay());
 const [heroSlide, setHeroSlide] = useState(0);
 const heroSliderRef = useRef<HTMLDivElement>(null);

 // SVG ring helper — matches FormAnalysisPopup gradient style
 const getScoreGradient = (score: number) => {
 if (score < 40) return {
  stops: [{ offset: "0%", color: "#b91c1c" }, { offset: "50%", color: "#dc2626" }, { offset: "100%", color: "#ef4444" }],
  glow: "#ef4444",
 };
 if (score < 70) return {
  stops: [{ offset: "0%", color: "#dc2626" }, { offset: "40%", color: "#ff6a00" }, { offset: "70%", color: "#ff9500" }, { offset: "100%", color: "#ffbe00" }],
  glow: "#ff9500",
 };
 return {
  stops: [{ offset: "0%", color: "#dc2626" }, { offset: "25%", color: "#ff6a00" }, { offset: "50%", color: "#ffbe00" }, { offset: "75%", color: "#4ade80" }, { offset: "100%", color: "#22c55e" }],
  glow: "#22c55e",
 };
 };

 const ringCounterRef = useRef(0);

 const Ring = ({ score, size = 56, stroke = 5 }: { score: number; size?: number; stroke?: number }) => {
 const [uid] = useState(() => `p2-ring-${ringCounterRef.current++}`);
 const r = (size - stroke) / 2;
 const circ = 2 * Math.PI * r;
 const offset = circ - (score / 100) * circ;
 const grad = getScoreGradient(score);
 const gradId = `grad-${uid}`;
 const glowId = `glow-${uid}`;
 return (
 <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
 <defs>
  <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
  {grad.stops.map((s, i) => <stop key={i} offset={s.offset} stopColor={s.color} />)}
  </linearGradient>
  <filter id={glowId}>
  <feGaussianBlur stdDeviation="2" result="blur" />
  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
  </filter>
 </defs>
 <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a2e" strokeWidth={stroke} />
 <motion.circle
 cx={size/2} cy={size/2} r={r} fill="none"
 stroke={`url(#${gradId})`} strokeWidth={stroke}
 strokeLinecap="round"
 initial={{ strokeDasharray: circ, strokeDashoffset: circ }}
 animate={{ strokeDashoffset: offset }}
 transition={{ duration: 1.2, ease: 'easeOut' }}
 transform={`rotate(-90 ${size/2} ${size/2})`}
 filter={`url(#${glowId})`}
 />
 </svg>
 );
 };

 const renderHome = () => (
 <motion.div
 key="home"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 z-20 bg-[#fafafa] flex flex-col overflow-y-auto pb-28"
 >
 {/* Header */}
 <div className="px-6 pt-14 pb-2 flex items-center justify-between">
 <div>
 <img src="/logo/Formax logo horizontal.png" alt="FORMAX" className="h-[45px] object-contain" />
 {isSignedIn && (
 <p className="text-zinc-500 text-sm font-medium mt-0.5">
 Welcome back, {userProfile?.first_name || user?.firstName || 'Athlete'}
 </p>
 )}
 </div>
 <div className="flex items-center gap-1 bg-zinc-100 rounded-full px-3 py-1.5">
 <Flame className="w-4 h-4 text-orange-500" />
 <span className="font-bold text-sm text-zinc-700">7</span>
 </div>
 </div>

 {/* Week Day Selector */}
 <div className="px-4 py-3 flex justify-between">
 {weekDays.map((d, i) => (
 <button
 key={d.day}
 onClick={() => setActiveDay(i)}
 className={`flex flex-col items-center gap-1 py-2 px-2.5 rounded-2xl transition-all ${
 activeDay === i
 ? 'bg-zinc-900 text-white shadow-md'
 : 'text-zinc-500'
 }`}
 >
 <span className="text-[11px] font-semibold">{d.day}</span>
 <span className={`text-sm font-bold ${activeDay === i ? '' : 'text-zinc-800'}`}>{String(d.date).padStart(2, '0')}</span>
 </button>
 ))}
 </div>

 {/* Hero Card + Joint Health Slider */}
 <div
 ref={heroSliderRef}
 className="mt-2 flex overflow-x-auto snap-x snap-mandatory"
 style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
 onScroll={(e) => {
 const el = e.currentTarget;
 const idx = Math.round(el.scrollLeft / el.offsetWidth);
 setHeroSlide(idx);
 }}
 >
 {/* Slide 1 – FORMAX Score */}
 <div className="flex-none w-full snap-start px-6">
 <div className="bg-white rounded-[2rem] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-zinc-100">
 <div className="flex items-center justify-between">
 <div>
 <motion.span
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="text-6xl font-black text-zinc-900 leading-none"
 >
 {formaxScore}
 </motion.span>
 <p className="text-zinc-500 font-semibold mt-1">FORMAX Score</p>
 </div>
 <Ring score={formaxScore} size={72} stroke={6} />
 </div>
 </div>
 </div>

 {/* Slide 2 – Joint Health Body Map */}
 <div className="flex-none w-full snap-start px-6">
 <div className="bg-white rounded-[2rem] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-zinc-100">
 <div className="flex items-center gap-2 mb-3">
 <Activity className="w-4 h-4 text-zinc-400" />
 <span className="text-zinc-500 font-semibold text-xs uppercase tracking-wide">Joint Health</span>
 </div>
 <div className="flex items-center gap-4">
 {/* SVG Body Silhouette with joint indicators */}
 <div className="relative shrink-0" style={{ width: 120, height: 180 }}>
 <svg viewBox="0 0 120 180" width={120} height={180} fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
  {jointData.map((j, i) => {
   const jc = scoreColor(j.score);
   return (
   <radialGradient key={`jglow-${i}`} id={`jglow-${i}`}>
    <stop offset="0%" stopColor={jc.ring} stopOpacity="0.5" />
    <stop offset="100%" stopColor={jc.ring} stopOpacity="0" />
   </radialGradient>
   );
  })}
  </defs>
  {/* Body silhouette */}
  <path
  d="M60 12 C60 12 52 12 52 20 C52 28 56 30 56 30 L54 36 C48 38 38 42 34 50 L26 70 C24 74 22 78 24 80 C26 82 30 80 32 78 L38 66 L36 90 L34 120 C34 124 36 126 38 126 L42 126 C44 126 46 124 46 120 L50 96 L54 96 L54 120 C54 124 56 126 58 126 L62 126 C64 126 66 124 66 120 L66 96 L70 96 L74 120 C74 124 76 126 78 126 L82 126 C84 126 86 124 86 120 L84 90 L82 66 L88 78 C90 80 94 82 96 80 C98 78 96 74 94 70 L86 50 C82 42 72 38 66 36 L64 30 C64 30 68 28 68 20 C68 12 60 12 60 12 Z"
  fill="#f4f4f5"
  stroke="#d4d4d8"
  strokeWidth="1"
  />
  {/* Head circle */}
  <circle cx="60" cy="14" r="10" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="1" />

  {/* Joint indicators with glow + pulse */}
  {/* Shoulders - left */}
  <motion.circle cx="38" cy="44" r="10" fill={`url(#jglow-1)`}
  animate={{ r: [10, 14, 10] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
  <motion.circle cx="38" cy="44" r="5" fill={scoreColor(jointData[1].score).ring}
  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }} />
  {/* Shoulders - right */}
  <motion.circle cx="82" cy="44" r="10" fill={`url(#jglow-1)`}
  animate={{ r: [10, 14, 10] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} />
  <motion.circle cx="82" cy="44" r="5" fill={scoreColor(jointData[1].score).ring}
  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }} />

  {/* Lower Back */}
  <motion.circle cx="60" cy="82" r="10" fill={`url(#jglow-2)`}
  animate={{ r: [10, 14, 10] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }} />
  <motion.circle cx="60" cy="82" r="5" fill={scoreColor(jointData[2].score).ring}
  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} />

  {/* Knees - left */}
  <motion.circle cx="44" cy="108" r="10" fill={`url(#jglow-0)`}
  animate={{ r: [10, 14, 10] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }} />
  <motion.circle cx="44" cy="108" r="5" fill={scoreColor(jointData[0].score).ring}
  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }} />
  {/* Knees - right */}
  <motion.circle cx="76" cy="108" r="10" fill={`url(#jglow-0)`}
  animate={{ r: [10, 14, 10] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }} />
  <motion.circle cx="76" cy="108" r="5" fill={scoreColor(jointData[0].score).ring}
  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: 'spring' }} />
 </svg>
 </div>

 {/* Joint score list */}
 <div className="flex-1 flex flex-col gap-3">
 {jointData.map((j) => {
  const jc = scoreColor(j.score);
  const pct = j.score;
  return (
  <div key={j.name}>
  <div className="flex items-center justify-between mb-1">
   <div className="flex items-center gap-2">
   <span className="text-base">{j.icon}</span>
   <span className="font-semibold text-zinc-800 text-[13px]">{j.name}</span>
   </div>
   <span className={`font-black text-base tabular-nums ${jc.text}`}>{j.score}</span>
  </div>
  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
   <motion.div
   className="h-full rounded-full"
   style={{ backgroundColor: jc.ring }}
   initial={{ width: 0 }}
   animate={{ width: `${pct}%` }}
   transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
   />
  </div>
  </div>
  );
 })}
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Pagination dots */}
 <div className="flex justify-center gap-1.5 mt-2">
 {[0, 1].map((i) => (
 <button
 key={i}
 onClick={() => {
 heroSliderRef.current?.scrollTo({ left: i * heroSliderRef.current.offsetWidth, behavior: 'smooth' });
 }}
 className={`h-1.5 rounded-full transition-all duration-300 ${
 heroSlide === i ? 'w-5 bg-zinc-800' : 'w-1.5 bg-zinc-300'
 }`}
 />
 ))}
 </div>

 {/* Recent Sessions */}
 <div className="px-6 mt-6">
 <h2 className="font-bold text-lg text-zinc-900 mb-3">Recent sessions</h2>
 <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-5 flex flex-col items-center">
 <div className="w-full flex items-center gap-4 mb-3">
 <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
 <Camera className="w-6 h-6 text-zinc-400" />
 </div>
 <div className="flex-1">
 <div className="h-3 bg-zinc-100 rounded-full w-3/4 mb-2" />
 <div className="h-2 bg-zinc-50 rounded-full w-1/2" />
 </div>
 </div>
 <p className="text-zinc-400 text-sm italic">Tap + to record your first set of the day</p>
 </div>
 </div>

 {renderBottomNav()}
 </motion.div>
 );

 // --- Shared Bottom Nav ---
 const renderBottomNav = () => (
 <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-4">
 <div className="flex items-center w-full max-w-md bg-white rounded-[2rem] px-3 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.10),0_1.5px_6px_rgba(0,0,0,0.06)]">
 <div className="flex-1 flex justify-around">
 {([
 { icon: Home, label: 'Home' as const },
 { icon: BarChart3, label: 'Progress' as const },
 { icon: Users, label: 'Groups' as const },
 { icon: User, label: 'Profile' as const },
 ] as const).map((item) => (
 <button key={item.label} className="flex flex-col items-center gap-0.5 py-1 px-2 relative"
 onClick={() => { setActiveTab(item.label === 'Groups' ? 'Community' : item.label); setView('HOME'); }}
 >
 {activeTab === (item.label === 'Groups' ? 'Community' : item.label) ? (
 <div className="w-8 h-8 rounded-full bg-cyan-400/80 flex items-center justify-center">
 <item.icon className="w-[18px] h-[18px] text-white" />
 </div>
 ) : (
 <item.icon className="w-6 h-6 text-zinc-400" />
 )}
 <span className={`text-[10px] font-semibold ${activeTab === (item.label === 'Groups' ? 'Community' : item.label) ? 'text-zinc-900' : 'text-zinc-400'}`}>{item.label}</span>
 </button>
 ))}
 </div>
 <button
 onClick={() => setView('CAMERA')}
 className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.25)] ml-1 shrink-0"
 >
 <Plus className="w-6 h-6 text-white" />
 </button>
 </div>
 </div>
 );

 // --- Progress Page ---
 const renderProgress = () => (
 <>
 <ProgressSection
 weightGoal={null}
 weightUnit={userProfile?.weight_unit ?? 'kg'}
 currentWeight={userProfile?.body_weight ?? null}
 focusAreas={userProfile?.focus_areas ?? null}
 weaknesses={userProfile?.weaknesses ?? null}
 injuries={userProfile?.injuries ?? null}
 experience={userProfile?.experience ?? null}
 prefetchedStats={prefetchedStats}
 prefetchedWeightLogs={prefetchedWeightLogs}
 prefetchedPhotos={prefetchedPhotos}
 />
 {renderBottomNav()}
 </>
 );

 // --- Community Page ---
 const renderCommunity = () => (
 <motion.div key="community" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="absolute inset-0 z-20 bg-[#fafafa] flex flex-col overflow-y-auto pb-28"
 >
 <div className="px-6 pt-14 pb-2 flex items-center justify-between">
 <h1 className="text-3xl font-black tracking-tight text-zinc-900">Community</h1>
 <button className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
 <Bell className="w-5 h-5 text-zinc-600" />
 </button>
 </div>

 <div className="px-6 flex items-center justify-between mb-4 mt-2">
 <h2 className="font-bold text-lg text-zinc-900">Discover Groups</h2>
 <button className="flex items-center gap-1 text-sm font-semibold text-zinc-500">
 <Plus className="w-4 h-4" /> Private Group
 </button>
 </div>

 {/* Challenge Cards */}
 <div className="px-6 space-y-3 mb-6">
 {[
 { title: 'Squat Form Challenge', members: 128, img: '/assets/squat.svg', alt: 'Squat', color: 'bg-amber-50 border-amber-100' },
 { title: 'Deadlift Academy', members: 87, img: '/assets/deadlift.svg', alt: 'Deadlift', color: 'bg-red-50 border-red-100' },
 { title: 'Perfect Press Club', members: 54, img: '/assets/benchpress.svg', alt: 'Bench press', color: 'bg-blue-50 border-blue-100' },
 ].map((group) => (
 <div key={group.title} className={`${group.color} border rounded-3xl p-5 flex items-center gap-4`}>
 <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center overflow-hidden">
   <img src={group.img} alt={group.alt} className="w-10 h-10 object-contain" />
 </div>
 <div className="flex-1">
 <h3 className="font-bold text-zinc-900">{group.title}</h3>
 <p className="text-xs text-zinc-500 font-medium">{group.members} members • Active</p>
 </div>
 <ChevronRight className="w-5 h-5 text-zinc-400" />
 </div>
 ))}
 </div>

 {/* Leaderboard Preview */}
 <div className="mx-6 bg-white rounded-3xl p-5 shadow-sm border border-zinc-100 mb-4">
 <div className="flex items-center justify-between mb-4">
 <h2 className="font-bold text-lg text-zinc-900">Leaderboard</h2>
 <Award className="w-5 h-5 text-amber-500" />
 </div>
 {[
 { name: 'Alex K.', score: 96, rank: 1 },
 { name: 'Jordan M.', score: 94, rank: 2 },
 { name: 'You', score: formaxScore, rank: 5 },
 ].map((entry) => (
 <div key={entry.name} className={`flex items-center gap-3 py-3 border-b border-zinc-50 last:border-0 ${entry.name === 'You' ? 'bg-emerald-50/50 -mx-2 px-2 rounded-xl' : ''}`}>
 <span className="w-6 text-center font-black text-zinc-400 text-sm">#{entry.rank}</span>
 <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center">
 <User className="w-4 h-4 text-zinc-500" />
 </div>
 <span className={`flex-1 font-semibold ${entry.name === 'You' ? 'text-emerald-700' : 'text-zinc-800'}`}>{entry.name}</span>
 <span className="font-bold text-zinc-600">{entry.score}</span>
 </div>
 ))}
 </div>

 {/* Invite Friends */}
 <div className="mx-6 bg-zinc-900 rounded-3xl p-5 flex items-center gap-4 mb-4">
 <UserPlus className="w-8 h-8 text-white shrink-0" />
 <div>
 <h3 className="font-bold text-white">Invite Gym Bros</h3>
 <p className="text-zinc-400 text-xs">Challenge friends to beat your FORMAX score</p>
 </div>
 </div>

 {renderBottomNav()}
 </motion.div>
 );

 // --- Coming Soon placeholder (for unbuilt tabs) ---
 const renderComingSoon = (label: string) => (
 <motion.div key={`coming-soon-${label}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="absolute inset-0 z-20 bg-[#fafafa] flex flex-col items-center justify-center pb-28"
 >
 <div className="flex flex-col items-center gap-4 px-8 text-center">
 <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center">
 <BarChart3 className="w-8 h-8 text-zinc-400" />
 </div>
 <h2 className="text-2xl font-black text-zinc-900">{label}</h2>
 <p className="text-zinc-400 font-medium text-sm">
 This feature is coming soon.
 </p>
 </div>
 {renderBottomNav()}
 </motion.div>
 );

 // --- Profile Page ---
 const { signOut } = useClerk();
 const renderProfile = () => (
 <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="absolute inset-0 z-20 bg-[#fafafa] flex flex-col overflow-y-auto pb-28"
 >
 {/* Header */}
 <div className="px-6 pt-14 pb-2">
 <h1 className="text-3xl font-black tracking-tight text-zinc-900">Profile</h1>
 </div>

 {/* User Card */}
 <div className="mx-6 bg-white rounded-3xl p-5 shadow-sm border border-zinc-100 flex items-center gap-4 mb-6">
 <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden border-2 border-zinc-200">
 {isSignedIn ? (
 <UserButton appearance={{ elements: { avatarBox: 'w-16 h-16' } }} />
 ) : (
 <User className="w-8 h-8 text-zinc-400" />
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <h2 className="font-bold text-lg text-zinc-900 truncate">
 {isSignedIn
  ? (userProfile?.first_name
   ? `${userProfile.first_name}${userProfile.last_name ? ' ' + userProfile.last_name : ''}`
   : (user?.fullName || user?.firstName || 'Enter your name'))
  : 'Enter your name'}
 </h2>
 <Edit className="w-3.5 h-3.5 text-zinc-400 shrink-0 cursor-pointer" onClick={() => setProfileModal('personal')} />
 </div>
 <p className="text-zinc-400 text-sm">
 {isSignedIn ? (userProfile?.email || user?.primaryEmailAddress?.emailAddress || 'FORMAX Member') : 'FORMAX Member'}
 </p>
 </div>
 {!isSignedIn && (
 <SignInButton>
 <button className="px-4 py-2 rounded-full bg-zinc-900 text-white text-xs font-bold shrink-0">
 Sign In
 </button>
 </SignInButton>
 )}
 </div>

 {/* Athlete Stats */}
 {userProfile && (userProfile.body_weight || userProfile.experience || userProfile.primary_goal) && (
 <div className="mx-6 mb-6">
 <p className="text-zinc-400 text-xs font-bold uppercase tracking-wide mb-2.5">Athlete Stats</p>
 <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 flex divide-x divide-zinc-100 overflow-hidden">
 {userProfile.body_weight && (
 <div className="flex-1 p-4 flex flex-col items-center">
 <span className="text-2xl font-black text-zinc-900">
 {userProfile.body_weight}
 <span className="text-sm font-semibold text-zinc-400 ml-0.5">{userProfile.weight_unit ?? 'kg'}</span>
 </span>
 <span className="text-zinc-400 text-xs font-semibold mt-0.5">Body Weight</span>
 </div>
 )}
 {userProfile.experience && (
 <div className="flex-1 p-4 flex flex-col items-center">
 <span className="text-lg font-black text-zinc-900 leading-tight text-center">{userProfile.experience}</span>
 <span className="text-zinc-400 text-xs font-semibold mt-0.5">Level</span>
 </div>
 )}
 {userProfile.primary_goal && (
 <div className="flex-1 p-4 flex flex-col items-center">
 <span className="text-sm font-black text-zinc-900 leading-tight text-center">{userProfile.primary_goal}</span>
 <span className="text-zinc-400 text-xs font-semibold mt-0.5">Goal</span>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Invite Friends */}
 <div className="mx-6 mb-6" onClick={handleInviteFriends}>
 <p className="text-zinc-400 text-xs font-bold uppercase tracking-wide mb-2.5">Invite friends</p>
 <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-100 flex items-start gap-4 cursor-pointer active:bg-zinc-50 transition-colors">
 <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
 <UserPlus className="w-5 h-5 text-zinc-500" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-bold text-zinc-900 text-[15px] mb-0.5">Refer a friend & earn rewards</p>
 <p className="text-zinc-400 text-xs leading-relaxed">Get 1 free month for every friend that signs up with your invite link.</p>
 </div>
 <ChevronRight className="w-5 h-5 text-zinc-300 shrink-0 mt-1" />
 </div>
 </div>

 {/* Account Section */}
 <div className="mx-6 mb-6">
 <p className="text-zinc-400 text-xs font-bold uppercase tracking-wide mb-2.5">Account</p>
 <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
 {[
 { icon: User, label: 'Personal details', modal: 'personal' as const },
 { icon: Settings, label: 'Preferences', modal: 'preferences' as const },
 { icon: Globe, label: 'Language', modal: 'language' as const },
 ].map((item) => (
 <button key={item.label} onClick={() => setProfileModal(item.modal)} className="w-full px-5 py-4 flex items-center gap-4 border-b border-zinc-100/60 last:border-0 active:bg-zinc-50 transition-colors">
 <item.icon className="w-5 h-5 text-zinc-500" />
 <span className="font-semibold text-zinc-800 flex-1 text-left text-[15px]">{item.label}</span>
 <ChevronRight className="w-5 h-5 text-zinc-300" />
 </button>
 ))}
 </div>
 </div>

 {/* Goals & Tracking Section */}
 <div className="mx-6 mb-6">
 <p className="text-zinc-400 text-xs font-bold uppercase tracking-wide mb-2.5">Goals & Tracking</p>
 <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
 {[
 { icon: Target, label: 'Form score targets', modal: 'targets' as const },
 { icon: Crosshair, label: 'Focus areas & weaknesses', modal: 'focus' as const },
 { icon: Activity, label: 'Joint health thresholds', modal: 'joints' as const },
 { icon: Dumbbell, label: 'Exercise library', modal: 'exercises' as const },
 { icon: Eye, label: 'Session replay settings', modal: 'replay' as const },
 { icon: History, label: 'Session history', modal: 'history' as const },
 ].map((item) => (
 <button key={item.label} onClick={() => { if (item.modal === 'history') { setSessionsLoaded(false); } setProfileModal(item.modal); }} className="w-full px-5 py-4 flex items-center gap-4 border-b border-zinc-100/60 last:border-0 active:bg-zinc-50 transition-colors">
 <item.icon className="w-5 h-5 text-zinc-500" />
 <span className="font-semibold text-zinc-800 flex-1 text-left text-[15px]">{item.label}</span>
 <ChevronRight className="w-5 h-5 text-zinc-300" />
 </button>
 ))}
 </div>
 </div>

 {/* Widgets Section */}
 <div className="mx-6 mb-6">
 <div className="flex items-center justify-between mb-2.5">
 <p className="text-zinc-400 text-xs font-bold uppercase tracking-wide">Widgets</p>
 <button onClick={() => setProfileModal('widgetHelp')} className="text-zinc-400 text-xs font-bold hover:text-zinc-600 transition-colors">
 How to add?
 </button>
 </div>

 {/* Horizontal swipeable widget carousel */}
 <div
 ref={widgetScrollRef}
 className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-1 px-1 hide-scrollbar"
 onScroll={(e) => {
 const el = e.currentTarget;
 const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 16 : 1;
 const idx = Math.round(el.scrollLeft / cardWidth);
 setActiveWidgetIndex(Math.min(idx, 3));
 }}
 >
 {/* Widget 1: Form Score (Small) */}
 <div className="snap-center shrink-0 w-[260px] bg-white rounded-3xl shadow-sm border border-zinc-100 p-5 flex flex-col items-center gap-3">
 <div className="relative flex items-center justify-center">
 <Ring score={formaxScore} size={120} stroke={10} />
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-3xl font-black text-zinc-900 leading-none">{formaxScore}</span>
 <span className="text-zinc-400 text-[11px] font-semibold mt-0.5">Form score</span>
 </div>
 </div>
 <button
 onClick={() => setView('CAMERA')}
 className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white rounded-full py-3 px-5 font-bold text-sm active:scale-[0.97] transition-transform"
 >
 <Plus className="w-4 h-4" />
 Start session
 </button>
 </div>

 {/* Widget 2: Form Score + Joint Health (Medium) */}
 <div className="snap-center shrink-0 w-[320px] bg-white rounded-3xl shadow-sm border border-zinc-100 p-5 flex flex-col gap-4">
 <div className="flex items-center gap-2 mb-1">
 <Activity className="w-4 h-4 text-zinc-400" />
 <span className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wide">Joint Health</span>
 </div>
 <div className="flex flex-col gap-3">
 {jointData.map((j) => {
 const jc = scoreColor(j.score);
 return (
 <div key={j.name} className="flex items-center gap-3">
  <div className={`w-9 h-9 rounded-xl ${jc.bg} border ${jc.border} flex items-center justify-center shrink-0`}>
  <span className="text-sm">{j.icon}</span>
  </div>
  <div className="flex-1 min-w-0">
  <div className="flex items-center justify-between mb-1">
   <span className="font-semibold text-zinc-800 text-[13px]">{j.name}</span>
   <span className={`font-black text-sm tabular-nums ${jc.text}`}>{j.score}</span>
  </div>
  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
   <motion.div
   className="h-full rounded-full"
   style={{ backgroundColor: jc.ring }}
   initial={{ width: 0 }}
   animate={{ width: `${j.score}%` }}
   transition={{ duration: 0.8, ease: 'easeOut' }}
   />
  </div>
  </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Widget 3: Streak & Quick Actions (Medium) */}
 <div className="snap-center shrink-0 w-[320px] bg-white rounded-3xl shadow-sm border border-zinc-100 p-5 flex items-center gap-4">
 {/* Quick actions */}
 <div className="flex flex-col gap-3 shrink-0">
 <button
 onClick={() => setView('CAMERA')}
 className="flex flex-col items-center gap-1.5 bg-zinc-50 rounded-2xl px-5 py-3 border border-zinc-100 active:bg-zinc-100 transition-colors"
 >
 <Scan className="w-5 h-5 text-zinc-600" />
 <span className="text-zinc-700 text-[11px] font-bold">Record</span>
 </button>
 <button
 onClick={() => setActiveTab('Progress')}
 className="flex flex-col items-center gap-1.5 bg-zinc-50 rounded-2xl px-5 py-3 border border-zinc-100 active:bg-zinc-100 transition-colors"
 >
 <BarChart className="w-5 h-5 text-zinc-600" />
 <span className="text-zinc-700 text-[11px] font-bold">Progress</span>
 </button>
 </div>
 {/* Streak fire */}
 <div className="flex-1 flex flex-col items-center justify-center">
 <div className="relative">
 <motion.div
 animate={{ scale: [1, 1.08, 1] }}
 transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
 className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 flex items-center justify-center"
 >
 <Flame className="w-10 h-10 text-orange-500" />
 </motion.div>
 <motion.div
 animate={{ opacity: [0.3, 0.7, 0.3] }}
 transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
 className="absolute -top-1 -right-1 w-4 h-4 text-amber-400"
 >
 <Zap className="w-4 h-4" />
 </motion.div>
 </div>
 <span className="text-3xl font-black text-zinc-900 mt-2 leading-none">0</span>
 <span className="text-zinc-400 text-[11px] font-semibold">Day streak</span>
 </div>
 </div>

 {/* Widget 4: Weekly Stats (Small) */}
 <div className="snap-center shrink-0 w-[260px] bg-white rounded-3xl shadow-sm border border-zinc-100 p-5 flex flex-col gap-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
 <BarChart3 className="w-5 h-5 text-blue-600" />
 </div>
 <div>
 <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wide">This Week</p>
 <p className="text-2xl font-black text-zinc-900 leading-none">0</p>
 </div>
 </div>
 <div className="h-px bg-zinc-100" />
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
 <TrendingUp className="w-5 h-5 text-emerald-600" />
 </div>
 <div>
 <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wide">7-Day Average</p>
 <p className="text-2xl font-black text-zinc-900 leading-none">—</p>
 </div>
 </div>
 </div>
 </div>

 {/* Dot indicators */}
 <div className="flex items-center justify-center gap-2 mb-2">
 {[0, 1, 2, 3].map((i) => (
 <button
 key={i}
 onClick={() => {
 const el = widgetScrollRef.current;
 if (!el || !el.firstElementChild) return;
 const cardWidth = (el.firstElementChild as HTMLElement).offsetWidth + 16;
 el.scrollTo({ left: cardWidth * i, behavior: 'smooth' });
 }}
 className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
 activeWidgetIndex === i ? 'bg-zinc-900 w-4' : 'bg-zinc-300'
 }`}
 />
 ))}
 </div>
 </div>

 {/* Support & Legal */}
 <div className="mx-6 mb-6">
 <p className="text-zinc-400 text-xs font-bold uppercase tracking-wide mb-2.5">Support & Legal</p>
 <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
 {[
 { icon: MessageSquare, label: 'Request a Feature', action: () => { setFeedbackType('feature_request'); setView('FEEDBACK'); } },
 { icon: Mail, label: 'Support', action: () => { setFeedbackType('support'); setView('FEEDBACK'); } },
 { icon: FileText, label: 'Terms and Conditions', action: undefined },
 { icon: ShieldCheck, label: 'Privacy Policy', action: () => window.open('/privacy', '_blank') },
 ].map((item) => (
 <button key={item.label} onClick={item.action} className="w-full px-5 py-4 flex items-center gap-4 border-b border-zinc-100/60 last:border-0 active:bg-zinc-50 transition-colors">
 <item.icon className="w-5 h-5 text-zinc-500" />
 <span className="font-semibold text-zinc-800 flex-1 text-left text-[15px]">{item.label}</span>
 <ChevronRight className="w-5 h-5 text-zinc-300" />
 </button>
 ))}
 </div>
 </div>

 {/* Account Actions */}
 <div className="mx-6 mb-6">
 <p className="text-zinc-400 text-xs font-bold uppercase tracking-wide mb-2.5">Account Actions</p>
 <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
 <button
 onClick={() => { if (isSignedIn) signOut(); }}
 className="w-full px-5 py-4 flex items-center gap-4 border-b border-zinc-100/60 active:bg-zinc-50 transition-colors"
 >
 <LogOut className="w-5 h-5 text-zinc-500" />
 <span className="font-semibold text-zinc-800 flex-1 text-left text-[15px]">Logout</span>
 </button>
 <button onClick={() => setProfileModal('deleteConfirm')} className="w-full px-5 py-4 flex items-center gap-4 active:bg-red-50 transition-colors">
 <Trash2 className="w-5 h-5 text-red-400" />
 <span className="font-semibold text-red-500 flex-1 text-left text-[15px]">Delete Account</span>
 </button>
 </div>
 </div>

 {/* Version */}
 <p className="text-center text-zinc-300 text-xs font-semibold tracking-wider uppercase mb-6">
 VERSION 1.0.0
 </p>

 {renderBottomNav()}
 </motion.div>
 );

 const renderCamera = () => (
 <motion.div 
 key="camera"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 z-30 bg-black flex flex-col"
 >
 <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
 <Webcam 
 audio={false} 
 ref={webcamRef} 
 videoConstraints={{
  facingMode: 'environment',
  width: { min: 640, ideal: 1280 },
  height: { min: 480, ideal: 720 },
  frameRate: { ideal: 30, max: 30 },
 }}
 className="w-full h-full object-cover" 
 />
 
 {/* Overlay Scanner Frame */}
 <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
 <div className="w-[70vw] h-[70vw] max-w-sm max-h-sm relative">
 <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white/80 rounded-tl-3xl" />
 <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white/80 rounded-tr-3xl" />
 <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white/80 rounded-bl-3xl" />
 <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white/80 rounded-br-3xl" />
 {/* Scanning Line Animation */}
 {isRecording && (
 <motion.div 
 initial={{ top: '10%' }}
 animate={{ top: '90%' }}
 transition={{ repeat: Infinity, duration: 1.5, ease: "linear", repeatType: "reverse" }}
 className="absolute left-[5%] right-[5%] h-[2px] bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
 />
 )}
 </div>
 </div>
 </div>

 <header className="relative z-30 w-full pt-14 pb-2 px-6 flex items-center justify-between text-white bg-gradient-to-b from-black/60 to-transparent">
 <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer"
 onClick={() => setView('HOME')}
 >
 <X className="w-6 h-6" />
 </div>
 {isRecording ? (
 <div className="flex items-center gap-2">
 <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
 <span className="font-bold text-lg tabular-nums">
 {Math.floor(recordingTime / 60)}:{String(Math.floor(recordingTime % 60)).padStart(2, '0')}
 <span className="text-white/50 text-sm"> / 0:15</span>
 </span>
 </div>
 ) : (
 <h1 className="font-bold text-lg tracking-wide">Record Your Form</h1>
 )}
 <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
 <Zap className="w-5 h-5 text-white" fill="white" />
 </div>
 </header>

 {/* Exercise Selector */}
 {!isRecording && (
 <div className="relative z-30 flex justify-center gap-2 px-4 pb-2">
 {EXERCISE_OPTIONS.map((opt) => (
 <button
 key={opt.key}
 onClick={() => setSelectedExercise(opt.key)}
 className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
 selectedExercise === opt.key
 ? 'bg-white text-zinc-900 shadow-md'
 : 'bg-white/20 text-white/80 backdrop-blur-sm'
 }`}
 >
 <span>{opt.emoji}</span>
 <span>{opt.label}</span>
 </button>
 ))}
 </div>
 )}

 <div className="mt-auto mb-10 relative z-30 px-10 flex items-center justify-between w-full">
 <div className="w-12 h-12 flex items-center justify-center">
 <HelpCircle className="w-8 h-8 text-white drop-shadow-md" />
 </div>
 
 {/* Big Capture Button */}
 <div 
 onClick={isRecording ? handleStopCaptureClick : handleStartCapture}
 className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform"
 >
 <AnimatePresence>
 {isRecording && (
 <motion.svg 
 initial={{ rotate: -90, strokeDasharray: "0 250" }}
 animate={{ strokeDasharray: "250 250" }}
 transition={{ duration: MAX_RECORDING_SECONDS, ease: "linear" }}
 className="absolute inset-0 w-full h-full text-red-500 z-10 scale-110" 
 viewBox="0 0 100 100"
 >
 <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" />
 </motion.svg>
 )}
 </AnimatePresence>
 <motion.div 
 animate={isRecording ? { scale: 0.6, borderRadius: '8px', backgroundColor: '#ef4444' } : { scale: 1, borderRadius: '99px', backgroundColor: 'white' }}
 className="w-[66px] h-[66px]"
 />
 </div>
 
 <div 
 className="w-12 h-12 flex items-center justify-center cursor-pointer"
 onClick={() => fileInputRef.current?.click()}
 >
 <ImageIcon className="w-8 h-8 text-white drop-shadow-md" />
 <input 
 type="file" 
 ref={fileInputRef} 
 className="hidden" 
 accept="video/*"
 onChange={handleFileUpload}
 />
 </div>
 </div>
 </motion.div>
 );

 const renderProcessing = () => (
 <motion.div 
 key="processing"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="absolute inset-0 z-40 bg-black text-white flex flex-col pt-14 px-6 overflow-hidden"
 >
 <header className="relative z-10 flex items-center justify-between mb-8">
 <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center cursor-pointer"
 onClick={() => setView('HOME')}
 >
 <X className="w-6 h-6" />
 </div>
 </header>
 
 <div className="relative z-10 flex flex-col items-center flex-1 w-full max-w-sm mx-auto">
 <motion.div 
 initial={{ scale: 0.9, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 transition={{ delay: 0.2, type: "spring" }}
 className="w-full aspect-[4/3] rounded-[2rem] overflow-hidden relative shadow-2xl mb-10 border border-white/20"
 >
 {mediaBlobUrl && (
 <video src={mediaBlobUrl} autoPlay loop muted className="w-full h-full object-cover" />
 )}
 {/* Faint scanner UI overlay */}
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
 <div className="w-[60%] h-[60%] border-t-2 border-l-2 border-white/40 absolute top-[20%] left-[20%] rounded-tl-2xl" />
 <div className="w-[60%] h-[60%] border-b-2 border-r-2 border-white/40 absolute bottom-[20%] right-[20%] rounded-br-2xl" />
 </div>
 </motion.div>

 <div className="w-full space-y-5 px-2">
 <div className="flex items-center gap-4">
 <div className="w-6 flex justify-center">
 {processingStep >= 1 ? <CheckCircle2 className="w-6 h-6 text-white" /> : <div className="w-4 h-4 rounded-full border-2 border-white/30" />}
 </div>
 <span className={`font-semibold text-lg ${processingStep >= 1 ? 'text-white' : 'text-white/50'}`}>Media Processed</span>
 </div>
 
 <div className="flex items-start gap-4">
 <div className="w-6 flex justify-center mt-1">
 {processingStep >= 2 ? <CheckCircle2 className="w-6 h-6 text-white" /> : (processingStep === 1 ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-white/30" />)}
 </div>
 <div className="flex flex-col">
 <span className={`font-semibold text-lg ${processingStep >= 2 ? 'text-white' : (processingStep === 1 ? 'text-white' : 'text-white/50')}`}>Extracting Vectors</span>
 <span className="text-white/50 text-sm font-medium">Matching with Pro Reference Database</span>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="w-6 flex justify-center">
 {processingStep >= 3 ? <CheckCircle2 className="w-6 h-6 text-white" /> : (processingStep === 2 ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-white/30" />)}
 </div>
 <span className={`font-semibold text-lg ${processingStep >= 3 ? 'text-white' : (processingStep === 2 ? 'text-white' : 'text-white/50')}`}>Estimating Form Score</span>
 </div>
 
 <div className="flex items-center gap-4">
 <div className="w-6 flex justify-center">
 {processingStep >= 4 ? <CheckCircle2 className="w-6 h-6 text-white" /> : (processingStep === 3 ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-white/30" />)}
 </div>
 <span className={`font-semibold text-lg ${processingStep >= 4 ? 'text-white' : (processingStep === 3 ? 'text-white' : 'text-white/50')}`}>Building Form Summary</span>
 </div>
 </div>
 </div>
 </motion.div>
 );

 const renderFixForm = () => {
 if (!result) return null;

 const finalScore = result?.final_score ?? 0;
 const checkpoints: Array<{ name: string; score: number; feedback: string; observed_details?: string }> = result?.checkpoints ?? [];
 const badFormFlags: string[] = result?.bad_form_flags ?? [];
 const injuryRisk: string = result?.injury_risk ?? 'unknown';
 const qualityGate = result?.quality_gate;
 const repAnalysis = result?.rep_analysis;
 const exerciseMismatch: boolean = result?.exercise_mismatch ?? false;

 const injuryBadge = (risk: string) => {
 if (risk === 'low') return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Low Risk' };
 if (risk === 'moderate') return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Moderate Risk' };
 return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'High Risk' };
 };
 const ib = injuryBadge(injuryRisk);

 return (
 <motion.div
 key="fix-form"
 initial={{ x: "100%" }}
 animate={{ x: 0 }}
 exit={{ x: "100%" }}
 transition={{ type: 'spring', damping: 28, stiffness: 260 }}
 className="absolute inset-0 z-50 bg-[#fafafa] flex flex-col pt-14 pb-8 px-6 text-zinc-900 overflow-y-auto"
 >
 <header className="flex items-center gap-3 mb-6">
 <button
  className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0"
  onClick={() => { setView('HOME'); setShowResultPopup(true); }}
 >
  <ChevronRight className="w-5 h-5 text-zinc-600 rotate-180" />
 </button>
 <h1 className="font-black text-xl tracking-tight">How to Improve</h1>
 </header>

 {/* Exercise Mismatch Warning */}
 {exerciseMismatch && (
 <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
 <span className="text-xl">⚠️</span>
 <p className="text-amber-700 text-sm font-medium">This video may not match the selected exercise. Please check you recorded the right movement.</p>
 </div>
 )}

 {/* Injury Risk Badge */}
 <div className={`${ib.bg} ${ib.border} border rounded-2xl px-4 py-3 mb-4 flex items-center gap-2`}>
 <Shield className="w-4 h-4" />
 <span className={`text-sm font-bold ${ib.text}`}>{ib.label}</span>
 </div>

 {/* Bad Form Flags */}
 {badFormFlags.length > 0 && (
 <div className="mb-4">
 <h2 className="font-bold text-lg ml-1 mb-2 flex items-center gap-2">
 <span className="text-red-500">⛔</span> Form Issues Detected
 </h2>
 <div className="space-y-2">
 {badFormFlags.map((flag, i) => (
 <div key={i} className="bg-red-50 border border-red-100 rounded-2xl p-4">
 <p className="text-red-700 text-sm font-medium">{flag}</p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Checkpoint Breakdown — full detail */}
 {checkpoints.length > 0 && (
 <div className="mb-4">
 <h2 className="font-bold text-lg ml-1 mb-3">Checkpoint Scores</h2>
 <div className="space-y-2">
 {checkpoints.map((cp, i) => {
 const cpColor = scoreColor(cp.score);
 return (
 <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
 <div className="flex items-center justify-between mb-1">
 <span className="font-semibold text-zinc-800 text-sm">{cp.name}</span>
 <span className={`font-bold text-sm ${cpColor.text}`}>{cp.score}/100</span>
 </div>
 <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden mb-2">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${cp.score}%` }}
 transition={{ duration: 0.8, delay: i * 0.1 }}
 className="h-full rounded-full"
 style={{ backgroundColor: cpColor.ring }}
 />
 </div>
 <p className="text-zinc-500 text-xs leading-relaxed">{cp.feedback}</p>
 {cp.observed_details && (
 <p className="text-zinc-400 text-xs mt-1 italic">{cp.observed_details}</p>
 )}
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* Quality Gate */}
 {qualityGate && (
 <div className="mb-4">
 <h2 className="font-bold text-lg ml-1 mb-2">Video Quality</h2>
 <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
 <div className="flex items-center gap-3 mb-3">
 <div className={`px-3 py-1 rounded-full text-xs font-bold ${
 qualityGate.confidence_label === 'high' ? 'bg-emerald-50 text-emerald-700' :
 qualityGate.confidence_label === 'medium' ? 'bg-amber-50 text-amber-700' :
 'bg-red-50 text-red-700'
 }`}>
 {qualityGate.confidence_label} confidence
 </div>
 <span className="text-zinc-400 text-xs">Score: {qualityGate.confidence_score}/100</span>
 </div>
 <div className="flex gap-3 mb-3">
 <div className="flex-1">
 <p className="text-[10px] text-zinc-400 uppercase font-bold mb-0.5">Camera Angle</p>
 <p className="text-sm font-semibold text-zinc-700">{qualityGate.camera_angle_quality}/100</p>
 </div>
 <div className="flex-1">
 <p className="text-[10px] text-zinc-400 uppercase font-bold mb-0.5">Body Visibility</p>
 <p className="text-sm font-semibold text-zinc-700">{qualityGate.body_visibility_quality}/100</p>
 </div>
 </div>
 {qualityGate.warnings?.length > 0 && (
 <div className="space-y-1">
 {qualityGate.warnings.map((w: string, i: number) => (
 <p key={i} className="text-amber-600 text-xs font-medium">⚠ {w}</p>
 ))}
 </div>
 )}
 {qualityGate.retake_guidance && qualityGate.confidence_label !== 'high' && (
 <p className="text-zinc-500 text-xs mt-2 italic">{qualityGate.retake_guidance}</p>
 )}
 </div>
 </div>
 )}

 {/* Rep Analysis */}
 {repAnalysis && repAnalysis.rep_scores?.length > 0 && (
 <div className="mb-4">
 <h2 className="font-bold text-lg ml-1 mb-2">Rep Breakdown</h2>
 <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
 <div className="flex gap-2 mb-3">
 {repAnalysis.rep_scores.map((rep: unknown, i: number) => {
 const repScore = typeof rep === "number" ? rep : typeof rep === "object" && rep !== null && "score" in rep ? (rep as { score: number }).score : 0;
 const rc = scoreColor(repScore);
 return (
 <div key={i} className={`flex-1 ${rc.bg} rounded-xl p-2 flex flex-col items-center border ${rc.border}`}>
 <span className="text-[10px] text-zinc-400 font-bold">Rep {i + 1}</span>
 <span className={`font-bold text-sm ${rc.text}`}>{repScore}</span>
 </div>
 );
 })}
 </div>
 {repAnalysis.consistency_summary && (
 <p className="text-zinc-500 text-xs">{repAnalysis.consistency_summary}</p>
 )}
 </div>
 </div>
 )}

 {/* Critique (positive + top priority) */}
 {result?.critique && (
 <div className="mb-4">
 <h2 className="font-bold text-lg ml-1 mb-2">Summary</h2>
 <div className="space-y-3">
 <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
 <span className="text-emerald-700 font-bold text-xs uppercase tracking-wide block mb-1">What You Did Well</span>
 <p className="text-emerald-800 text-sm font-medium leading-relaxed">{result.critique.power}</p>
 </div>
 <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
 <span className="text-amber-700 font-bold text-xs uppercase tracking-wide block mb-1">Top Priority Fix</span>
 <p className="text-amber-800 text-sm font-medium leading-relaxed">{result.critique.grace}</p>
 </div>
 </div>
 </div>
 )}

 {/* Share Score Card */}
 {result && (
  <button
   onClick={handleShareScore}
   disabled={shareLoading}
   style={{ touchAction: 'manipulation' }}
   className="w-full mt-4 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-lg active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-60"
  >
   <Share2 className="w-5 h-5" />
   {shareLoading ? 'Preparing share card…' : 'Share Your Score'}
  </button>
 )}
 {sessionId && !postedToCommunity && (
  <button
   onClick={handlePostToCommunity}
   style={{ touchAction: 'manipulation' }}
   className="w-full mt-2 py-3 rounded-2xl bg-zinc-100 text-zinc-700 font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
  >
   <Users className="w-4 h-4" /> Post to Community
  </button>
 )}
 {postedToCommunity && (
  <div className="w-full mt-2 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center gap-2">
   <CheckCircle2 className="w-4 h-4" /> Posted to Community!
  </div>
 )}
 <button
 className="w-full mt-4 py-4 rounded-2xl bg-black text-white font-bold text-lg active:scale-95 transition-transform"
 onClick={() => { setView('CAMERA'); setPostedToCommunity(false); setShowResultPopup(false); }}
 >
 Record Again
 </button>
 <button
 className="w-full mt-2 py-3 rounded-2xl bg-zinc-100 text-zinc-600 font-bold text-sm active:scale-95 transition-transform"
 onClick={() => { setView('HOME'); setPostedToCommunity(false); setShowResultPopup(false); }}
 >
 Back to Home
 </button>
 <p className="text-zinc-400 text-[10px] text-center mt-4 leading-relaxed px-2">
 For general fitness guidance only. Not a substitute for professional medical advice. Consult a qualified professional before starting any exercise program.
 </p>
 </motion.div>
 );
 };

 // ── Profile helper: save partial update ───────────────────────────────────

 const patchProfile = async (fields: Record<string, unknown>) => {
  setProfileSaving(true);
  try {
   const res = await fetch('/api/user/profile/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
   });
   if (!res.ok) throw new Error('Save failed');
   // Refresh profile
   const r = await fetch('/api/user/profile');
   if (r.ok) {
    const d = await r.json();
    if (d?.profile) setUserProfile(d.profile);
   }
   setProfileToast('Saved');
   setTimeout(() => setProfileToast(null), 2000);
   return true;
  } catch {
   setProfileToast('Failed to save');
   setTimeout(() => setProfileToast(null), 2500);
   return false;
  } finally {
   setProfileSaving(false);
  }
 };

 // ── Invite handler ────────────────────────────────────────────────────────

 const handleInviteFriends = async () => {
  const url = typeof window !== 'undefined' ? window.location.origin : 'https://formax.app';
  const text = `Check out FORMAX — your AI form coach! 💪 ${url}`;
  try {
   if (typeof navigator !== 'undefined' && navigator.share) {
    await navigator.share({ title: 'FORMAX', text, url });
   } else {
    await navigator.clipboard.writeText(text);
    setProfileToast('Link copied!');
    setTimeout(() => setProfileToast(null), 2000);
   }
  } catch (e) {
   if (e instanceof Error && e.name !== 'AbortError') {
    await navigator.clipboard.writeText(text);
    setProfileToast('Link copied!');
    setTimeout(() => setProfileToast(null), 2000);
   }
  }
 };

 // ── Delete account handler ────────────────────────────────────────────────

 const handleDeleteAccount = async () => {
  setDeleteLoading(true);
  try {
   await fetch('/api/user/profile', { method: 'DELETE' });
   signOut();
  } catch {
   setProfileToast('Delete failed');
   setTimeout(() => setProfileToast(null), 2500);
  } finally {
   setDeleteLoading(false);
   setProfileModal(null);
  }
 };

 // ── Load sessions for history ─────────────────────────────────────────────

 useEffect(() => {
  if (profileModal !== 'history' || sessionsLoaded) return;
  fetch('/api/sessions')
   .then(r => r.ok ? r.json() : null)
   .then(d => { if (d?.sessions) setSessions(d.sessions); setSessionsLoaded(true); })
   .catch(console.error);
 }, [profileModal, sessionsLoaded]);

 // ── Exercise library data ─────────────────────────────────────────────────

 const EXERCISE_LIBRARY = [
  { key: 'deadlift', label: 'Deadlift', emoji: '🏋️', checkpoints: ['Setup & Stance', 'Hip Hinge Pattern', 'Bar Path', 'Spine Position', 'Lockout', 'Eccentric Control'] },
  { key: 'squat', label: 'Squat', emoji: '🦵', checkpoints: ['Stance & Setup', 'Descent Control', 'Depth & Bottom Position', 'Drive Pattern', 'Knee Tracking', 'Lockout'] },
  { key: 'bench_press', label: 'Bench Press', emoji: '💪', checkpoints: ['Setup & Arch', 'Unrack & Start', 'Bar Path', 'Touch Point', 'Press Drive', 'Shoulder Safety'] },
  { key: 'generic', label: 'Other / Generic', emoji: '🔄', checkpoints: ['Movement quality assessed dynamically based on detected exercise'] },
 ];

 // ── Modal shell ───────────────────────────────────────────────────────────

 // ── Toggle component ──────────────────────────────────────────────────────

 const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
  <div className="flex items-center justify-between py-3">
   <span className="font-semibold text-zinc-800 text-[15px]">{label}</span>
   <button
    onClick={() => onChange(!value)}
    className={`w-12 h-7 rounded-full transition-colors relative ${value ? 'bg-emerald-500' : 'bg-zinc-200'}`}
   >
    <motion.div
     animate={{ x: value ? 22 : 2 }}
     className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm"
    />
   </button>
  </div>
 );

 // ── Chip select component ─────────────────────────────────────────────────

 const ChipSelect = ({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) => (
  <div className="flex flex-wrap gap-2">
   {options.map(opt => (
    <button
     key={opt}
     onClick={() => onToggle(opt)}
     className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
      selected.includes(opt)
       ? 'bg-zinc-900 text-white'
       : 'bg-zinc-100 text-zinc-600'
     }`}
    >
     {opt}
    </button>
   ))}
  </div>
 );

 // ── Personal Details Modal ────────────────────────────────────────────────

 const PersonalDetailsModal = () => {
  const [fn, setFn] = useState(userProfile?.first_name ?? '');
  const [ln, setLn] = useState(userProfile?.last_name ?? '');
  const [em, setEm] = useState(userProfile?.email ?? '');
  const [gn, setGn] = useState(userProfile?.gender ?? '');
  const [bw, setBw] = useState(String(userProfile?.body_weight ?? ''));
  const [wu, setWu] = useState(userProfile?.weight_unit ?? 'kg');

  const save = async () => {
   const ok = await patchProfile({
    first_name: fn || null,
    last_name: ln || null,
    email: em || null,
    gender: gn || null,
    body_weight: bw ? parseFloat(bw) : null,
    weight_unit: wu,
   });
   if (ok) setProfileModal(null);
  };

  return (
   <ModalShell title="Personal Details" onClose={() => setProfileModal(null)}>
    <div className="space-y-4">
     <div>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">First Name</label>
      <input value={fn} onChange={e => setFn(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900" />
     </div>
     <div>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Last Name</label>
      <input value={ln} onChange={e => setLn(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900" />
     </div>
     <div>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Email</label>
      <input type="email" value={em} onChange={e => setEm(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900" />
     </div>
     <div>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2 block">Gender</label>
      <div className="flex gap-2">
       {['Male', 'Female', 'Other'].map(g => (
        <button key={g} onClick={() => setGn(g)} className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all ${gn === g ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}>{g}</button>
       ))}
      </div>
     </div>
     <div>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Body Weight</label>
      <div className="flex gap-2 mt-1">
       <input type="number" value={bw} onChange={e => setBw(e.target.value)} placeholder="0" className="flex-1 px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900" />
       <div className="flex rounded-2xl overflow-hidden border border-zinc-200">
        {['kg', 'lbs'].map(u => (
         <button key={u} onClick={() => setWu(u)} className={`px-4 py-3 text-sm font-bold transition-all ${wu === u ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-600'}`}>{u}</button>
        ))}
       </div>
      </div>
     </div>
     <button onClick={save} disabled={profileSaving} className="w-full mt-2 py-3.5 rounded-2xl bg-zinc-900 text-white font-bold active:scale-[0.98] transition-transform disabled:opacity-50">
      {profileSaving ? 'Saving…' : 'Save Changes'}
     </button>
    </div>
   </ModalShell>
  );
 };

 // ── Preferences Modal ─────────────────────────────────────────────────────

 const PreferencesModal = () => {
  const [strict, setStrict] = useState(userProfile?.strictness ?? 'Balanced');
  const [audio, setAudio] = useState(userProfile?.audio_feedback ?? false);
  const [notifs, setNotifs] = useState(userProfile?.notifications_allowed ?? false);

  const save = async () => {
   const ok = await patchProfile({
    strictness: strict,
    audio_feedback: audio,
    notifications_allowed: notifs,
   });
   if (ok) setProfileModal(null);
  };

  return (
   <ModalShell title="Preferences" onClose={() => setProfileModal(null)}>
    <div className="space-y-4">
     <div>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2 block">Coaching Strictness</label>
      <div className="flex gap-2">
       {['Strict', 'Balanced', 'Hype Man'].map(s => (
        <button key={s} onClick={() => setStrict(s)} className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all ${strict === s ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}>{s}</button>
       ))}
      </div>
     </div>
     <Toggle value={audio} onChange={setAudio} label="Audio Feedback" />
     <Toggle value={notifs} onChange={setNotifs} label="Push Notifications" />
     <button onClick={save} disabled={profileSaving} className="w-full mt-2 py-3.5 rounded-2xl bg-zinc-900 text-white font-bold active:scale-[0.98] transition-transform disabled:opacity-50">
      {profileSaving ? 'Saving…' : 'Save Changes'}
     </button>
    </div>
   </ModalShell>
  );
 };

 // ── Language Modal ─────────────────────────────────────────────────────────

 const LanguageModal = () => {
  const [lang, setLang] = useState(userProfile?.language ?? 'en');
  const languages = [
   { code: 'en', label: 'English', flag: '🇬🇧' },
   { code: 'es', label: 'Español', flag: '🇪🇸' },
   { code: 'fr', label: 'Français', flag: '🇫🇷' },
   { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
   { code: 'ar', label: 'العربية', flag: '🇸🇦' },
   { code: 'pt', label: 'Português', flag: '🇧🇷' },
  ];

  const save = async () => {
   const ok = await patchProfile({ language: lang });
   if (ok) setProfileModal(null);
  };

  return (
   <ModalShell title="Language" onClose={() => setProfileModal(null)}>
    <div className="space-y-1 mb-4">
     {languages.map(l => (
      <button key={l.code} onClick={() => setLang(l.code)}
       className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${lang === l.code ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-800 hover:bg-zinc-100'}`}
      >
       <span className="text-xl">{l.flag}</span>
       <span className="font-semibold flex-1 text-left">{l.label}</span>
       {lang === l.code && <CheckCircle2 className="w-5 h-5" />}
      </button>
     ))}
    </div>
    <button onClick={save} disabled={profileSaving} className="w-full py-3.5 rounded-2xl bg-zinc-900 text-white font-bold active:scale-[0.98] transition-transform disabled:opacity-50">
     {profileSaving ? 'Saving…' : 'Save'}
    </button>
   </ModalShell>
  );
 };

 // ── Form Score Targets Modal ──────────────────────────────────────────────

 const ScoreTargetsModal = () => {
  const defaults = userProfile?.form_score_targets ?? {};
  const [targets, setTargets] = useState<Record<string, number>>({
   deadlift: defaults.deadlift ?? 80,
   squat: defaults.squat ?? 80,
   bench_press: defaults.bench_press ?? 80,
   generic: defaults.generic ?? 80,
  });

  const save = async () => {
   const ok = await patchProfile({ form_score_targets: targets });
   if (ok) setProfileModal(null);
  };

  return (
   <ModalShell title="Form Score Targets" onClose={() => setProfileModal(null)}>
    <p className="text-zinc-400 text-sm mb-4">Set your target score for each exercise. You'll be notified when you hit your goals.</p>
    <div className="space-y-5 mb-6">
     {EXERCISE_LIBRARY.filter(e => e.key !== 'generic').concat(EXERCISE_LIBRARY.filter(e => e.key === 'generic')).map(ex => (
      <div key={ex.key}>
       <div className="flex items-center justify-between mb-1.5">
        <span className="font-semibold text-zinc-800 text-[15px]">{ex.emoji} {ex.label}</span>
        <span className="font-bold text-zinc-900 text-lg tabular-nums">{targets[ex.key]}</span>
       </div>
       <input
        type="range" min={0} max={100} value={targets[ex.key]}
        onChange={e => setTargets(prev => ({ ...prev, [ex.key]: Number(e.target.value) }))}
        className="w-full h-2 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-zinc-900"
       />
       <div className="flex justify-between text-[10px] text-zinc-400 font-semibold mt-0.5">
        <span>0</span><span>50</span><span>100</span>
       </div>
      </div>
     ))}
    </div>
    <button onClick={save} disabled={profileSaving} className="w-full py-3.5 rounded-2xl bg-zinc-900 text-white font-bold active:scale-[0.98] transition-transform disabled:opacity-50">
     {profileSaving ? 'Saving…' : 'Save Targets'}
    </button>
   </ModalShell>
  );
 };

 // ── Focus Areas & Weaknesses Modal ────────────────────────────────────────

 const FocusModal = () => {
  const [fa, setFa] = useState<string[]>(userProfile?.focus_areas ?? []);
  const [wk, setWk] = useState<string[]>(userProfile?.weaknesses ?? []);
  const [inj, setInj] = useState<string[]>(userProfile?.injuries ?? []);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
   setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const save = async () => {
   const ok = await patchProfile({ focus_areas: fa, weaknesses: wk, injuries: inj });
   if (ok) setProfileModal(null);
  };

  return (
   <ModalShell title="Focus & Weaknesses" onClose={() => setProfileModal(null)}>
    <div className="space-y-5 mb-6">
     <div>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2 block">Focus Areas</label>
      <ChipSelect options={['Squat Depth', 'Deadlift', 'Bench Press', 'Overhead Press']} selected={fa} onToggle={v => toggle(fa, setFa, v)} />
     </div>
     <div>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2 block">Weaknesses</label>
      <ChipSelect options={['Butt Wink', 'Knee Cave', 'Lower Back Rounding', 'Bar Path Drift']} selected={wk} onToggle={v => toggle(wk, setWk, v)} />
     </div>
     <div>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2 block">Injuries</label>
      <ChipSelect options={['Lower Back', 'Knees', 'Shoulders', 'Hips', 'None']} selected={inj} onToggle={v => {
       if (v === 'None') { setInj(['None']); } else { setInj(inj.filter(x => x !== 'None').includes(v) ? inj.filter(x => x !== v) : [...inj.filter(x => x !== 'None'), v]); }
      }} />
     </div>
    </div>
    <button onClick={save} disabled={profileSaving} className="w-full py-3.5 rounded-2xl bg-zinc-900 text-white font-bold active:scale-[0.98] transition-transform disabled:opacity-50">
     {profileSaving ? 'Saving…' : 'Save Changes'}
    </button>
   </ModalShell>
  );
 };

 // ── Joint Health Thresholds Modal ─────────────────────────────────────────

 const JointThresholdsModal = () => {
  const defaults = userProfile?.joint_thresholds ?? {};
  const [thresholds, setThresholds] = useState<Record<string, number>>({
   'Lower Back': defaults['Lower Back'] ?? 50,
   'Hips': defaults['Hips'] ?? 50,
   'Knees': defaults['Knees'] ?? 50,
   'Shoulders': defaults['Shoulders'] ?? 50,
   'Elbows': defaults['Elbows'] ?? 50,
  });

  const save = async () => {
   const ok = await patchProfile({ joint_thresholds: thresholds });
   if (ok) setProfileModal(null);
  };

  return (
   <ModalShell title="Joint Health Thresholds" onClose={() => setProfileModal(null)}>
    <p className="text-zinc-400 text-sm mb-4">Set alert thresholds for each joint. Scores below these will be flagged in your reports.</p>
    <div className="space-y-5 mb-6">
     {Object.entries(thresholds).map(([joint, val]) => (
      <div key={joint}>
       <div className="flex items-center justify-between mb-1.5">
        <span className="font-semibold text-zinc-800 text-[15px]">{joint}</span>
        <span className={`font-bold text-lg tabular-nums ${val >= 60 ? 'text-emerald-600' : val >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{val}</span>
       </div>
       <input
        type="range" min={0} max={100} value={val}
        onChange={e => setThresholds(prev => ({ ...prev, [joint]: Number(e.target.value) }))}
        className="w-full h-2 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-zinc-900"
       />
      </div>
     ))}
    </div>
    <button onClick={save} disabled={profileSaving} className="w-full py-3.5 rounded-2xl bg-zinc-900 text-white font-bold active:scale-[0.98] transition-transform disabled:opacity-50">
     {profileSaving ? 'Saving…' : 'Save Thresholds'}
    </button>
   </ModalShell>
  );
 };

 // ── Exercise Library Modal ────────────────────────────────────────────────

 const ExerciseLibraryModal = () => (
  <ModalShell title="Exercise Library" onClose={() => setProfileModal(null)}>
   <div className="space-y-3">
    {EXERCISE_LIBRARY.map(ex => (
     <div key={ex.key} className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
      <div className="flex items-center gap-3 mb-2">
       <span className="text-2xl">{ex.emoji}</span>
       <div>
        <h3 className="font-bold text-zinc-900">{ex.label}</h3>
        <p className="text-zinc-400 text-xs">{ex.checkpoints.length} checkpoint{ex.checkpoints.length !== 1 ? 's' : ''}</p>
       </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
       {ex.checkpoints.map(cp => (
        <span key={cp} className="text-xs bg-white border border-zinc-200 rounded-full px-2.5 py-1 text-zinc-600 font-medium">{cp}</span>
       ))}
      </div>
     </div>
    ))}
   </div>
  </ModalShell>
 );

 // ── Session Replay Settings Modal ─────────────────────────────────────────

 const ReplaySettingsModal = () => {
  const [autoplay, setAutoplay] = useState(userProfile?.session_replay_autoplay ?? true);
  const [quality, setQuality] = useState(userProfile?.session_replay_quality ?? 'auto');

  const save = async () => {
   const ok = await patchProfile({ session_replay_autoplay: autoplay, session_replay_quality: quality });
   if (ok) setProfileModal(null);
  };

  return (
   <ModalShell title="Session Replay" onClose={() => setProfileModal(null)}>
    <div className="space-y-4 mb-6">
     <Toggle value={autoplay} onChange={setAutoplay} label="Autoplay Replays" />
     <div>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2 block">Video Quality</label>
      <div className="flex gap-2">
       {['auto', 'low', 'high'].map(q => (
        <button key={q} onClick={() => setQuality(q)} className={`flex-1 py-2.5 rounded-2xl text-sm font-bold capitalize transition-all ${quality === q ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}>{q}</button>
       ))}
      </div>
     </div>
    </div>
    <button onClick={save} disabled={profileSaving} className="w-full py-3.5 rounded-2xl bg-zinc-900 text-white font-bold active:scale-[0.98] transition-transform disabled:opacity-50">
     {profileSaving ? 'Saving…' : 'Save'}
    </button>
   </ModalShell>
  );
 };

 // ── Session History Modal ─────────────────────────────────────────────────

 const exerciseEmoji: Record<string, string> = { deadlift: '🏋️', squat: '🦵', bench_press: '💪', generic: '🔄' };

 const SessionHistoryModal = () => {
  // Detail view of a single session
  if (selectedSession) {
   const s = selectedSession;
   const fs = s.overall_score ?? 0;
   const sc2 = scoreColor(fs);
   const cps: Array<{ name: string; score: number; feedback: string; observed_details?: string }> = s.checkpoints ?? [];
   const bff: string[] = s.bad_form_flags ?? [];
   const ir = s.injury_risk ?? 'unknown';
   const ib2 = ir === 'low'
    ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Low Risk' }
    : ir === 'moderate'
    ? { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Moderate Risk' }
    : { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'High Risk' };

   return (
    <motion.div
     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
     className="fixed inset-0 z-[60] bg-[#fafafa] flex flex-col pt-14 pb-8 px-6 overflow-y-auto"
    >
     <header className="flex items-center gap-3 mb-5">
      <button onClick={() => setSelectedSession(null)} className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
       <ChevronRight className="w-5 h-5 text-zinc-500 rotate-180" />
      </button>
      <div className="flex-1">
       <h2 className="font-bold text-lg text-zinc-900">{exerciseEmoji[s.exercise] ?? '🔄'} {s.exercise?.replace(/_/g, ' ')}</h2>
       <p className="text-zinc-400 text-xs">{new Date(s.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      <button onClick={() => { setSelectedSession(null); setProfileModal(null); }} className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
       <X className="w-5 h-5 text-zinc-600" />
      </button>
     </header>

     {/* Score card */}
     <div className="flex flex-col items-center mb-5 bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100">
      <div className="relative mb-3">
       <Ring score={fs} size={100} stroke={8} />
       <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-black text-zinc-800">{fs}</span>
       </div>
      </div>
      <span className="font-semibold text-zinc-400 text-xs tracking-widest uppercase mb-3">Overall Score</span>
      <div className={`${ib2.bg} ${ib2.border} border rounded-full px-4 py-1.5`}>
       <span className={`text-xs font-bold ${ib2.text}`}><Shield className="w-3 h-3 inline mr-1" />{ib2.label}</span>
      </div>
     </div>

     {/* Bad form flags */}
     {bff.length > 0 && (
      <div className="mb-4">
       <h3 className="font-bold text-lg ml-1 mb-2 flex items-center gap-2"><span className="text-red-500">⛔</span> Form Issues</h3>
       <div className="space-y-2">
        {bff.map((f, i) => (
         <div key={i} className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-red-700 text-sm font-medium">{f}</p>
         </div>
        ))}
       </div>
      </div>
     )}

     {/* Checkpoints */}
     {cps.length > 0 && (
      <div className="mb-4">
       <h3 className="font-bold text-lg ml-1 mb-3">Checkpoints</h3>
       <div className="space-y-2">
        {cps.map((cp, i) => {
         const cpC = scoreColor(cp.score);
         return (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
           <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-zinc-800 text-sm">{cp.name}</span>
            <span className={`font-bold text-sm ${cpC.text}`}>{cp.score}/100</span>
           </div>
           <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden mb-2">
            <motion.div initial={{ width: 0 }} animate={{ width: `${cp.score}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="h-full rounded-full" style={{ backgroundColor: cpC.ring }} />
           </div>
           <p className="text-zinc-500 text-xs leading-relaxed">{cp.feedback}</p>
           {cp.observed_details && <p className="text-zinc-400 text-xs mt-1 italic">{cp.observed_details}</p>}
          </div>
         );
        })}
       </div>
      </div>
     )}

     {/* Top priority & positive */}
     {(s.top_priority || s.positive) && (
      <div className="mb-4 space-y-3">
       <h3 className="font-bold text-lg ml-1">Summary</h3>
       {s.positive && (
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
         <span className="text-emerald-700 font-bold text-xs uppercase tracking-wide block mb-1">What You Did Well</span>
         <p className="text-emerald-800 text-sm font-medium leading-relaxed">{s.positive}</p>
        </div>
       )}
       {s.top_priority && (
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
         <span className="text-amber-700 font-bold text-xs uppercase tracking-wide block mb-1">Top Priority Fix</span>
         <p className="text-amber-800 text-sm font-medium leading-relaxed">{s.top_priority}</p>
        </div>
       )}
      </div>
     )}

     {s.consistency_summary && (
      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 mb-4">
       <span className="text-zinc-500 font-bold text-xs uppercase tracking-wide block mb-1">Consistency</span>
       <p className="text-zinc-700 text-sm">{s.consistency_summary}</p>
      </div>
     )}
    </motion.div>
   );
  }

  // List view
  return (
   <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[60] bg-[#fafafa] flex flex-col pt-14 pb-8 px-6 overflow-y-auto"
   >
    <header className="flex items-center justify-between mb-5">
     <h2 className="font-bold text-xl text-zinc-900">Session History</h2>
     <button onClick={() => setProfileModal(null)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
      <X className="w-4 h-4 text-zinc-500" />
     </button>
    </header>
    {!sessionsLoaded ? (
     <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin" />
     </div>
    ) : sessions.length === 0 ? (
     <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <History className="w-12 h-12 text-zinc-300 mb-3" />
      <p className="text-zinc-400 font-medium">No sessions yet</p>
      <p className="text-zinc-300 text-sm mt-1">Record your first workout to see it here</p>
     </div>
    ) : (
     <div className="space-y-2">
      {sessions.map(s => {
       const sc2 = scoreColor(s.overall_score ?? 0);
       return (
        <button
         key={s.id}
         onClick={async () => {
          try {
           const r = await fetch(`/api/sessions/${s.id}`);
           if (r.ok) { const d = await r.json(); setSelectedSession(d.session); }
          } catch { /* ignore */ }
         }}
         className="w-full bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 flex items-center gap-3 active:bg-zinc-50 transition-colors text-left"
        >
         <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center text-xl shrink-0">
          {exerciseEmoji[s.exercise] ?? '🔄'}
         </div>
         <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-800 text-sm capitalize truncate">{s.exercise?.replace(/_/g, ' ')}</p>
          <p className="text-zinc-400 text-xs">{new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
         </div>
         <div className="flex items-center gap-2 shrink-0">
          <Ring score={s.overall_score ?? 0} size={36} stroke={3} />
          <span className={`font-bold text-sm ${sc2.text}`}>{s.overall_score ?? '—'}</span>
         </div>
         <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />
        </button>
       );
      })}
     </div>
    )}
   </motion.div>
  );
 };

 // ── Delete Confirmation Modal ─────────────────────────────────────────────

 const DeleteConfirmModal = () => (
  <ModalShell title="Delete Account" onClose={() => setProfileModal(null)}>
   <div className="text-center">
    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
     <Trash2 className="w-8 h-8 text-red-400" />
    </div>
    <h3 className="font-bold text-lg text-zinc-900 mb-2">Are you sure?</h3>
    <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
     This will permanently delete all your data including workout sessions, progress photos, weight logs, and community posts. This action cannot be undone.
    </p>
    <button
     onClick={handleDeleteAccount}
     disabled={deleteLoading}
     className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold active:scale-[0.98] transition-transform disabled:opacity-50 mb-2"
    >
     {deleteLoading ? 'Deleting…' : 'Delete Everything'}
    </button>
    <button onClick={() => setProfileModal(null)} className="w-full py-3 rounded-2xl bg-zinc-100 text-zinc-600 font-bold active:scale-[0.98] transition-transform">
     Cancel
    </button>
   </div>
  </ModalShell>
 );

 // ── Feedback modal (shared for feature request & support) ──────────────

 // ── Render feedback page ──────────────────────────────────────────────────

 const renderFeedback = () => {
  const isFeature = feedbackType === 'feature_request';
  const title = isFeature ? 'Request a Feature' : 'Support';
  const placeholder = isFeature ? "I'd love it if FORMAX could..." : 'Describe your issue...';
  const description = isFeature
   ? 'Tell us what feature you\'d like to see in FORMAX. We read every suggestion.'
   : 'Describe the issue you\'re experiencing and we\'ll get back to you.';

  const submit = async () => {
   if (!feedbackMessage.trim()) return;
   setProfileSaving(true);
   try {
    const res = await fetch('/api/feedback', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ type: feedbackType, message: feedbackMessage, email: userProfile?.email ?? user?.primaryEmailAddress?.emailAddress }),
    });
    if (res.ok) {
     setFeedbackMessage('');
     setView('HOME');
     setActiveTab('Profile');
     setProfileToast(isFeature ? 'Feature request sent!' : 'Support message sent!');
     setTimeout(() => setProfileToast(null), 2200);
    }
   } finally { setProfileSaving(false); }
  };

  return (
   <motion.div
    key="feedback"
    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
    transition={{ type: 'spring', damping: 28, stiffness: 260 }}
    className="absolute inset-0 bg-[#fafafa] flex flex-col"
   >
    {/* Header */}
    <div className="flex items-center gap-3 px-5 pt-14 pb-4">
     <button
      onClick={() => { setFeedbackMessage(''); setView('HOME'); setActiveTab('Profile'); }}
      className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0"
     >
      <ChevronRight className="w-5 h-5 text-zinc-600 rotate-180" />
     </button>
     <h1 className="font-bold text-xl text-zinc-900">{title}</h1>
    </div>

    {/* Body */}
    <div className="flex-1 overflow-y-auto px-5 pb-8">
     <p className="text-zinc-500 text-sm mb-5 leading-relaxed">{description}</p>
     <textarea
      value={feedbackMessage}
      onChange={e => setFeedbackMessage(e.target.value)}
      maxLength={5000}
      rows={8}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none mb-1 shadow-sm"
     />
     <p className="text-right text-xs text-zinc-400 mb-6">{feedbackMessage.length}/5000</p>
     <button
      onClick={submit}
      disabled={profileSaving || !feedbackMessage.trim()}
      className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-base active:scale-[0.98] transition-transform disabled:opacity-50"
     >
      {profileSaving ? 'Sending…' : 'Submit'}
     </button>
    </div>
   </motion.div>
  );
 };

 // ── Render profile modals ─────────────────────────────────────────────────

 const renderProfileModals = () => (
  <AnimatePresence>
   {profileModal === 'personal' && <PersonalDetailsModal key="m-personal" />}
   {profileModal === 'preferences' && <PreferencesModal key="m-preferences" />}
   {profileModal === 'language' && <LanguageModal key="m-language" />}
   {profileModal === 'targets' && <ScoreTargetsModal key="m-targets" />}
   {profileModal === 'focus' && <FocusModal key="m-focus" />}
   {profileModal === 'joints' && <JointThresholdsModal key="m-joints" />}
   {profileModal === 'exercises' && <ExerciseLibraryModal key="m-exercises" />}
   {profileModal === 'replay' && <ReplaySettingsModal key="m-replay" />}
   {(profileModal === 'history' || profileModal === 'historyDetail') && <SessionHistoryModal key="m-history" />}
   {profileModal === 'deleteConfirm' && <DeleteConfirmModal key="m-delete" />}
   {profileModal === 'widgetHelp' && (
    <motion.div
     key="m-widgetHelp"
     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
     className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
     onClick={() => setProfileModal(null)}
    >
     <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="bg-white rounded-t-[2rem] w-full max-w-md max-h-[85vh] overflow-y-auto px-6 pt-5 pb-10"
      onClick={e => e.stopPropagation()}
     >
      <div className="flex items-center justify-between mb-5">
       <h2 className="font-bold text-xl text-zinc-900">Add Widgets</h2>
       <button onClick={() => setProfileModal(null)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
        <X className="w-4 h-4 text-zinc-500" />
       </button>
      </div>

      <p className="text-zinc-500 text-sm mb-6">
       Add FORMAX widgets to your home screen to track your form score, streak, and stats at a glance.
      </p>

      {/* iOS Instructions */}
      <div className="mb-6">
       <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center">
         <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        </div>
        <h3 className="font-bold text-zinc-900 text-[15px]">iPhone & iPad</h3>
       </div>
       <div className="space-y-3 pl-9">
        {[
         'Long-press any empty area on your Home Screen',
         'Tap the + button in the top-left corner',
         'Search for "FORMAX" in the widget gallery',
         'Choose your preferred widget size (Small or Medium)',
         'Tap "Add Widget" and position it on your Home Screen',
        ].map((step, i) => (
         <div key={i} className="flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 text-[11px] font-bold text-zinc-500">{i + 1}</span>
          <p className="text-zinc-600 text-sm leading-snug">{step}</p>
         </div>
        ))}
       </div>
      </div>

      {/* Android Instructions */}
      <div className="mb-4">
       <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
         <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.463 11.463 0 00-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 002 18h20a10.78 10.78 0 00-4.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"/></svg>
        </div>
        <h3 className="font-bold text-zinc-900 text-[15px]">Android</h3>
       </div>
       <div className="space-y-3 pl-9">
        {[
         'Long-press any empty area on your Home Screen',
         'Tap "Widgets" from the menu that appears',
         'Scroll or search for "FORMAX"',
         'Long-press the widget and drag it to your Home Screen',
         'Resize by long-pressing the placed widget and dragging corners',
        ].map((step, i) => (
         <div key={i} className="flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 text-[11px] font-bold text-zinc-500">{i + 1}</span>
          <p className="text-zinc-600 text-sm leading-snug">{step}</p>
         </div>
        ))}
       </div>
      </div>

      {/* Widget sizes info */}
      <div className="mt-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
       <div className="flex items-center gap-2 mb-2">
        <Smartphone className="w-4 h-4 text-zinc-500" />
        <p className="text-zinc-700 text-sm font-bold">Available Sizes</p>
       </div>
       <div className="flex gap-3">
        <div className="flex-1 flex flex-col items-center gap-1">
         <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 shadow-sm" />
         <span className="text-zinc-400 text-[10px] font-semibold">Small</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
         <div className="w-20 h-12 rounded-xl bg-white border border-zinc-200 shadow-sm" />
         <span className="text-zinc-400 text-[10px] font-semibold">Medium</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
         <div className="w-20 h-20 rounded-xl bg-white border border-zinc-200 shadow-sm" />
         <span className="text-zinc-400 text-[10px] font-semibold">Large</span>
        </div>
       </div>
      </div>
     </motion.div>
    </motion.div>
   )}
  </AnimatePresence>
 );

 if (!profileLoaded) return <LoadingScreen />;

 return (
 <main className="relative w-full h-[100dvh] overflow-hidden bg-[#fafafa] font-sans antialiased text-black">

 <AnimatePresence mode="wait">
 {view === 'HOME' && activeTab === 'Home' && renderHome()}
 {view === 'HOME' && activeTab === 'Progress' && renderProgress()}
 {view === 'HOME' && activeTab === 'Community' && renderCommunity()}
 {view === 'HOME' && activeTab === 'Profile' && renderProfile()}
 {view === 'CAMERA' && renderCamera()}
 {view === 'PROCESSING' && renderProcessing()}
 {view === 'FIX_FORM' && renderFixForm()}
 {view === 'FEEDBACK' && renderFeedback()}
 </AnimatePresence>

 {/* Form Analysis Popup (overlays on HOME after processing completes) */}
 <AnimatePresence>
 {showResultPopup && (
  <FormAnalysisPopup
   result={result}
   analysisError={analysisError}
   mediaBlobUrl={mediaBlobUrl}
   onClose={() => { setShowResultPopup(false); setAnalysisError(null); prefetchProgress(); }}
   onFixForm={() => {}}
   onRetry={() => { setShowResultPopup(false); setAnalysisError(null); setView('CAMERA'); }}
  />
 )}
 </AnimatePresence>

 {/* Profile modals */}
 {renderProfileModals()}

 {/* Toast notification */}
 <AnimatePresence>
 {profileToast && (
  <motion.div
   initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
   className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-zinc-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg"
  >
   {profileToast}
  </motion.div>
 )}
 </AnimatePresence>
 </main>
 );
}

