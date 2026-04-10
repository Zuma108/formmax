'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, Camera, Plus, Target,
  Flame, Scale, X, Check, ChevronRight, Trophy,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JointHealth {
  name: string;
  score: number;
  trend: 'up' | 'down' | 'neutral';
  trendValue: number;
  hasData: boolean;
}

interface WeightLog {
  id: string;
  weight_kg: number;
  notes: string | null;
  logged_at: string;
}

interface Photo {
  id: string;
  photo_data: string;
  caption: string | null;
  created_at: string;
}

interface Stats {
  totalSessions: number;
  sessionsThisWeek: number;
  avgScore7d: number | null;
  avgScore30d: number | null;
  streak: number;
  streakLast7: boolean[];
  scoreTrend: number[];
  jointHealth: JointHealth[];
}

interface Props {
  weightGoal?: number | null;
  weightUnit?: string;
  currentWeight?: number | null;
  focusAreas?: string[] | null;
  weaknesses?: string[] | null;
  injuries?: string[] | null;
  experience?: string | null;
  prefetchedStats?: Stats | null;
  prefetchedWeightLogs?: WeightLog[] | null;
  prefetchedPhotos?: Photo[] | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 75) return { text: 'text-emerald-600', ring: '#059669', glow: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-100' };
  if (score >= 50) return { text: 'text-amber-600', ring: '#d97706', glow: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-100' };
  return { text: 'text-red-500', ring: '#dc2626', glow: '#ef4444', bg: 'bg-red-50', border: 'border-red-100' };
}

function getScoreGradient(score: number) {
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
}

let ringCounter = 0;

function Ring({ score, size = 44, stroke = 4 }: { score: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const grad = getScoreGradient(score);
  const [uid] = useState(() => `prog-ring-${ringCounter++}`);
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
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1a2e" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={`url(#${gradId})`} strokeWidth={stroke} strokeLinecap="round"
        initial={{ strokeDasharray: circ, strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        filter={`url(#${glowId})`}
      />
    </svg>
  );
}

// ─── 3D Body Map ──────────────────────────────────────────────────────────────

// Joint positions on a 160×340 canvas
const JOINT_POSITIONS: Record<string, { cx: number; cy: number; label: string }> = {
  'Shoulders': { cx: 80, cy: 78,  label: 'Shoulders' },
  'Elbows':    { cx: 80, cy: 115, label: 'Elbows'    },
  'Lower Back':{ cx: 80, cy: 158, label: 'Lower Back' },
  'Hips':      { cx: 80, cy: 180, label: 'Hips'      },
  'Knees':     { cx: 80, cy: 248, label: 'Knees'     },
};

function BodyMap({
  joints,
  activeJoint,
  onSelect,
}: {
  joints: JointHealth[];
  activeJoint: string | null;
  onSelect: (name: string) => void;
}) {
  const jointMap = Object.fromEntries(joints.map(j => [j.name, j]));

  return (
    <svg viewBox="0 0 160 340" className="w-full max-w-[180px] mx-auto">
      <defs>
        {joints.map(j => {
          const c = scoreColor(j.score);
          return (
            <radialGradient key={`g-${j.name}`} id={`jg-${j.name.replace(/\s/g, '')}`} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor={c.glow} stopOpacity="1" />
              <stop offset="70%" stopColor={c.ring} stopOpacity="0.9" />
              <stop offset="100%" stopColor={c.ring} stopOpacity="0.6" />
            </radialGradient>
          );
        })}
        <filter id="joint-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
        </filter>
        {/* Body fill gradient */}
        <linearGradient id="body-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e4e4e7" />
          <stop offset="100%" stopColor="#d4d4d8" />
        </linearGradient>
      </defs>

      {/* ── Body silhouette ─────────────────────────────────── */}
      {/* Head */}
      <ellipse cx="80" cy="28" rx="18" ry="22" fill="url(#body-grad)" />
      {/* Neck */}
      <rect x="73" y="48" width="14" height="12" rx="4" fill="url(#body-grad)" />
      {/* Torso */}
      <path d="M48 60 Q34 62 32 80 L32 160 Q32 168 38 170 L122 170 Q128 168 128 160 L128 80 Q126 62 112 60 Z" fill="url(#body-grad)" />
      {/* Left arm upper */}
      <path d="M48 62 Q28 70 22 95 L24 115 Q26 120 32 118 L36 98 Q40 80 52 72 Z" fill="url(#body-grad)" />
      {/* Left arm lower */}
      <path d="M22 115 Q18 128 20 148 L28 150 Q32 140 30 125 L32 118 Z" fill="url(#body-grad)" />
      {/* Right arm upper */}
      <path d="M112 62 Q132 70 138 95 L136 115 Q134 120 128 118 L124 98 Q120 80 108 72 Z" fill="url(#body-grad)" />
      {/* Right arm lower */}
      <path d="M138 115 Q142 128 140 148 L132 150 Q128 140 130 125 L128 118 Z" fill="url(#body-grad)" />
      {/* Left leg upper */}
      <path d="M52 170 L48 250 L62 252 L68 178 Z" fill="url(#body-grad)" />
      {/* Right leg upper */}
      <path d="M108 170 L112 250 L98 252 L92 178 Z" fill="url(#body-grad)" />
      {/* Left leg lower */}
      <path d="M48 250 L46 320 L60 322 L62 252 Z" fill="url(#body-grad)" />
      {/* Right leg lower */}
      <path d="M112 250 L114 320 L100 322 L98 252 Z" fill="url(#body-grad)" />
      {/* Feet */}
      <ellipse cx="53" cy="322" rx="10" ry="6" fill="url(#body-grad)" />
      <ellipse cx="107" cy="322" rx="10" ry="6" fill="url(#body-grad)" />

      {/* ── Joint indicators ────────────────────────────────── */}
      {/* Shoulder joints (left + right) */}
      {(['Shoulders'] as const).map(name => {
        const j = jointMap[name];
        if (!j) return null;
        const c = scoreColor(j.score);
        const isActive = activeJoint === name;
        return (
          <g key={name}>
            {/* Left shoulder */}
            <circle cx="41" cy="72" r={isActive ? 11 : 9} fill={`url(#jg-${name.replace(/\s/g,'')})` } filter="url(#joint-shadow)"
              className="cursor-pointer" onClick={() => onSelect(name)} />
            <circle cx="41" cy="72" r={6} fill="white" fillOpacity="0.3" />
            {/* Right shoulder */}
            <circle cx="119" cy="72" r={isActive ? 11 : 9} fill={`url(#jg-${name.replace(/\s/g,'')})` } filter="url(#joint-shadow)"
              className="cursor-pointer" onClick={() => onSelect(name)} />
            <circle cx="119" cy="72" r={6} fill="white" fillOpacity="0.3" />
            {isActive && <circle cx="41" cy="72" r="14" fill="none" stroke={c.glow} strokeWidth="1.5" strokeOpacity="0.6" />}
            {isActive && <circle cx="119" cy="72" r="14" fill="none" stroke={c.glow} strokeWidth="1.5" strokeOpacity="0.6" />}
          </g>
        );
      })}

      {/* Elbow joints (left + right) */}
      {(['Elbows'] as const).map(name => {
        const j = jointMap[name];
        if (!j) return null;
        const c = scoreColor(j.score);
        const isActive = activeJoint === name;
        return (
          <g key={name}>
            <circle cx="22" cy="115" r={isActive ? 10 : 8} fill={`url(#jg-${name.replace(/\s/g,'')})` } filter="url(#joint-shadow)"
              className="cursor-pointer" onClick={() => onSelect(name)} />
            <circle cx="22" cy="115" r="5" fill="white" fillOpacity="0.3" />
            <circle cx="138" cy="115" r={isActive ? 10 : 8} fill={`url(#jg-${name.replace(/\s/g,'')})` } filter="url(#joint-shadow)"
              className="cursor-pointer" onClick={() => onSelect(name)} />
            <circle cx="138" cy="115" r="5" fill="white" fillOpacity="0.3" />
            {isActive && <circle cx="22" cy="115" r="13" fill="none" stroke={c.glow} strokeWidth="1.5" strokeOpacity="0.6" />}
            {isActive && <circle cx="138" cy="115" r="13" fill="none" stroke={c.glow} strokeWidth="1.5" strokeOpacity="0.6" />}
          </g>
        );
      })}

      {/* Lower Back */}
      {(['Lower Back'] as const).map(name => {
        const j = jointMap[name];
        if (!j) return null;
        const c = scoreColor(j.score);
        const isActive = activeJoint === name;
        return (
          <g key={name} className="cursor-pointer" onClick={() => onSelect(name)}>
            <circle cx="80" cy="148" r={isActive ? 13 : 11} fill={`url(#jg-${name.replace(/\s/g,'')})` } filter="url(#joint-shadow)" />
            <circle cx="80" cy="148" r="7" fill="white" fillOpacity="0.3" />
            {isActive && <circle cx="80" cy="148" r="17" fill="none" stroke={c.glow} strokeWidth="1.5" strokeOpacity="0.6" />}
          </g>
        );
      })}

      {/* Hip joints (left + right) */}
      {(['Hips'] as const).map(name => {
        const j = jointMap[name];
        if (!j) return null;
        const c = scoreColor(j.score);
        const isActive = activeJoint === name;
        return (
          <g key={name}>
            <circle cx="58" cy="173" r={isActive ? 11 : 9} fill={`url(#jg-${name.replace(/\s/g,'')})` } filter="url(#joint-shadow)"
              className="cursor-pointer" onClick={() => onSelect(name)} />
            <circle cx="58" cy="173" r="6" fill="white" fillOpacity="0.3" />
            <circle cx="102" cy="173" r={isActive ? 11 : 9} fill={`url(#jg-${name.replace(/\s/g,'')})` } filter="url(#joint-shadow)"
              className="cursor-pointer" onClick={() => onSelect(name)} />
            <circle cx="102" cy="173" r="6" fill="white" fillOpacity="0.3" />
            {isActive && <circle cx="58" cy="173" r="14" fill="none" stroke={c.glow} strokeWidth="1.5" strokeOpacity="0.6" />}
            {isActive && <circle cx="102" cy="173" r="14" fill="none" stroke={c.glow} strokeWidth="1.5" strokeOpacity="0.6" />}
          </g>
        );
      })}

      {/* Knee joints (left + right) */}
      {(['Knees'] as const).map(name => {
        const j = jointMap[name];
        if (!j) return null;
        const c = scoreColor(j.score);
        const isActive = activeJoint === name;
        return (
          <g key={name}>
            <circle cx="55" cy="252" r={isActive ? 11 : 9} fill={`url(#jg-${name.replace(/\s/g,'')})` } filter="url(#joint-shadow)"
              className="cursor-pointer" onClick={() => onSelect(name)} />
            <circle cx="55" cy="252" r="6" fill="white" fillOpacity="0.3" />
            <circle cx="105" cy="252" r={isActive ? 11 : 9} fill={`url(#jg-${name.replace(/\s/g,'')})` } filter="url(#joint-shadow)"
              className="cursor-pointer" onClick={() => onSelect(name)} />
            <circle cx="105" cy="252" r="6" fill="white" fillOpacity="0.3" />
            {isActive && <circle cx="55" cy="252" r="14" fill="none" stroke={c.glow} strokeWidth="1.5" strokeOpacity="0.6" />}
            {isActive && <circle cx="105" cy="252" r="14" fill="none" stroke={c.glow} strokeWidth="1.5" strokeOpacity="0.6" />}
          </g>
        );
      })}

      {/* Score labels on the right side */}
      {joints.map(j => {
        const pos = JOINT_POSITIONS[j.name];
        if (!pos) return null;
        const c = scoreColor(j.score);
        return (
          <g key={`label-${j.name}`} className="pointer-events-none">
            <text x="145" y={pos.cy + 4} textAnchor="end" fontSize="9" fontWeight="700"
              fill={c.ring} className="font-bold">{j.score}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Log Weight Modal ─────────────────────────────────────────────────────────

function LogWeightModal({
  unit,
  onSave,
  onClose,
}: {
  unit: string;
  onSave: (kg: number, notes: string) => Promise<void>;
  onClose: () => void;
}) {
  const [val, setVal] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const raw = parseFloat(val);
    if (!raw) return;
    const kg = unit === 'lbs' ? raw * 0.453592 : raw;
    setSaving(true);
    await onSave(kg, notes);
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="bg-white rounded-t-[2rem] w-full px-6 pt-5 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-6" />
        <h2 className="text-xl font-black text-zinc-900 mb-1">Log Weight</h2>
        <p className="text-zinc-400 text-sm mb-6">Record today&apos;s weight to track your progress</p>

        <div className="flex items-center gap-3 bg-zinc-50 rounded-2xl px-4 py-4 mb-3">
          <Scale className="w-5 h-5 text-zinc-400" />
          <input
            type="number"
            inputMode="decimal"
            placeholder={`Weight in ${unit}`}
            value={val}
            onChange={e => setVal(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-black text-zinc-900 outline-none placeholder:text-zinc-300"
          />
          <span className="text-zinc-400 font-semibold text-sm">{unit}</span>
        </div>

        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full bg-zinc-50 rounded-2xl px-4 py-3 text-sm text-zinc-700 outline-none mb-6 placeholder:text-zinc-300"
        />

        <button
          onClick={handleSave}
          disabled={saving || !val}
          className="w-full bg-zinc-900 text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {saving ? 'Saving…' : <><Check className="w-4 h-4" /> Save Weight</>}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Photo Modal ──────────────────────────────────────────────────────────────

function AddPhotoModal({
  onSave,
  onClose,
}: {
  onSave: (data: string, caption: string) => Promise<void>;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 400_000) { setErr('Image too large — please use a smaller photo (under 400KB)'); return; }
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    await onSave(preview, caption);
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="bg-white rounded-t-[2rem] w-full px-6 pt-5 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-6" />
        <h2 className="text-xl font-black text-zinc-900 mb-4">Add Progress Photo</h2>

        {err && <p className="text-red-500 text-xs mb-3 bg-red-50 px-3 py-2 rounded-xl">{err}</p>}

        {!preview ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-44 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center gap-2 mb-4"
          >
            <Camera className="w-8 h-8 text-zinc-300" />
            <span className="text-zinc-400 text-sm font-semibold">Tap to choose photo</span>
          </button>
        ) : (
          <div className="relative mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="preview" className="w-full h-52 object-cover rounded-3xl" />
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
        <input type="file" ref={fileRef} accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

        <input
          type="text"
          placeholder="Caption (optional)"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          className="w-full bg-zinc-50 rounded-2xl px-4 py-3 text-sm text-zinc-700 outline-none mb-6 placeholder:text-zinc-300"
        />

        <button
          onClick={handleSave}
          disabled={saving || !preview}
          className="w-full bg-zinc-900 text-white font-bold rounded-2xl py-4 disabled:opacity-40"
        >
          {saving ? 'Uploading…' : 'Save Photo'}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProgressSection({ weightGoal, weightUnit = 'kg', currentWeight, focusAreas, weaknesses, injuries, experience, prefetchedStats, prefetchedWeightLogs, prefetchedPhotos }: Props) {
  const hasPrefetch = prefetchedStats !== undefined;
  const [stats, setStats] = useState<Stats | null>(prefetchedStats ?? null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(prefetchedWeightLogs ?? []);
  const [photos, setPhotos] = useState<Photo[]>(prefetchedPhotos ?? []);
  const [selectedRange, setSelectedRange] = useState('90 Days');
  const [showLogWeight, setShowLogWeight] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [activeJoint, setActiveJoint] = useState<string | null>(null);
  const [loading, setLoading] = useState(!hasPrefetch);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [editingHeight, setEditingHeight] = useState(false);
  const [heightInput, setHeightInput] = useState('');
  const timeRanges = ['90 Days', '6 Months', '1 Year', 'All time'];

  // Load saved height from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('user_height_cm');
    if (stored) setHeightCm(parseFloat(stored));
  }, []);

  const saveHeight = () => {
    const h = parseFloat(heightInput);
    if (!h || h < 50 || h > 300) return;
    localStorage.setItem('user_height_cm', String(h));
    setHeightCm(h);
    setEditingHeight(false);
    setHeightInput('');
  };

  useEffect(() => {
    if (hasPrefetch) return;
    let cancelled = false;
    const load = async () => {
      const [sRes, wRes, pRes] = await Promise.all([
        fetch('/api/progress/stats'),
        fetch('/api/progress/weight'),
        fetch('/api/progress/photos'),
      ]);
      if (cancelled) return;
      if (sRes.ok) { const d = await sRes.json(); setStats(d); }
      if (wRes.ok) { const d = await wRes.json(); setWeightLogs(d.logs ?? []); }
      if (pRes.ok) { const d = await pRes.json(); setPhotos(d.photos ?? []); }
      setLoading(false);
    };
    load().catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [hasPrefetch]);

  const handleLogWeight = useCallback(async (kg: number, notes: string) => {
    const res = await fetch('/api/progress/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight_kg: kg, notes }),
    });
    if (res.ok) {
      const { log } = await res.json();
      setWeightLogs(prev => [log, ...prev]);
    }
  }, []);

  const handleAddPhoto = useCallback(async (photo_data: string, caption: string) => {
    const res = await fetch('/api/progress/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_data, caption }),
    });
    if (res.ok) {
      const { photo } = await res.json();
      setPhotos(prev => [photo, ...prev]);
    }
  }, []);

  // Derived values
  const latestWeight = weightLogs[0]?.weight_kg ?? currentWeight ?? null;
  const displayWeight = latestWeight
    ? weightUnit === 'lbs'
      ? (latestWeight * 2.20462).toFixed(1)
      : latestWeight.toFixed(1)
    : '—';
  const goalDisplay = weightGoal
    ? weightUnit === 'lbs'
      ? (weightGoal * 2.20462).toFixed(0)
      : weightGoal.toFixed(0)
    : null;

  // Build weight chart data (last 10 logs, oldest first)
  const weightChartData = weightLogs.slice(0, 10).reverse();
  const wMin = weightChartData.length
    ? Math.min(...weightChartData.map(l => l.weight_kg)) - 2
    : 60;
  const wMax = weightChartData.length
    ? Math.max(...weightChartData.map(l => l.weight_kg)) + 2
    : 100;

  // Score trend chart
  const scoreTrend = stats?.scoreTrend ?? [];
  const sMin = scoreTrend.length ? Math.max(0, Math.min(...scoreTrend) - 10) : 0;
  const sMax = scoreTrend.length ? Math.min(100, Math.max(...scoreTrend) + 10) : 100;

  const toChartY = (val: number, min: number, max: number, h: number) =>
    h - ((val - min) / (max - min || 1)) * h;

  const CHART_W = 280;
  const CHART_H = 100;

  const scorePoints = scoreTrend.map((v, i) => {
    const x = scoreTrend.length > 1 ? (i / (scoreTrend.length - 1)) * CHART_W : CHART_W / 2;
    const y = toChartY(v, sMin, sMax, CHART_H);
    return `${x},${y}`;
  });

  const weightPoints = weightChartData.map((l, i) => {
    const x = weightChartData.length > 1 ? (i / (weightChartData.length - 1)) * CHART_W : CHART_W / 2;
    const y = toChartY(l.weight_kg, wMin, wMax, CHART_H);
    return `${x},${y}`;
  });

  const selectedJointData = stats?.jointHealth.find(j => j.name === activeJoint);

  if (loading) {
    return (
      <div className="absolute inset-0 z-20 bg-[#fafafa] flex items-center justify-center pb-28">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm font-semibold">Loading progress…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        key="progress"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-20 bg-[#fafafa] flex flex-col overflow-y-auto pb-28"
      >
        {/* Header */}
        <div className="px-6 pt-14 pb-4">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">Progress</h1>
          {experience && (
            <p className="text-zinc-400 text-sm font-semibold mt-0.5">{experience} Athlete</p>
          )}
        </div>

        {/* Athlete Focus */}
        {((focusAreas && focusAreas.length > 0) || (weaknesses && weaknesses.length > 0) || (injuries && injuries.length > 0 && !injuries.includes('None'))) && (
          <div className="px-6 mb-4 flex flex-wrap gap-2">
            {focusAreas?.map(a => (
              <span key={a} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                <Target className="w-3 h-3" /> {a}
              </span>
            ))}
            {weaknesses?.map(w => (
              <span key={w} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100">
                ⚠️ {w}
              </span>
            ))}
            {injuries?.filter(i => i !== 'None').map(i => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-100">
                🩹 {i}
              </span>
            ))}
          </div>
        )}

        {/* ── Top cards ── */}
        <div className="px-6 flex gap-3 mb-4">
          {/* Weight card */}
          <div className="flex-1 bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden flex flex-col">
            <div className="p-5 pb-4 flex-1">
              <p className="text-zinc-400 text-xs font-semibold mb-1">My Weight</p>
              <div className="flex items-end gap-1 mb-3">
                <span className="text-4xl font-black text-zinc-900 leading-none">{displayWeight}</span>
                <span className="text-zinc-400 text-sm font-semibold mb-0.5">{weightUnit}</span>
              </div>
              {goalDisplay && (
                <div className="mb-1">
                  <div className="h-[3px] bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: latestWeight && weightGoal
                          ? `${Math.min(100, (latestWeight / weightGoal) * 100)}%`
                          : '0%',
                      }}
                      transition={{ duration: 1 }}
                      className="h-full bg-zinc-300 rounded-full"
                    />
                  </div>
                  <p className="text-zinc-400 text-xs mt-2">Goal <span className="text-zinc-600 font-semibold">{goalDisplay} {weightUnit}</span></p>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowLogWeight(true)}
              className="w-full bg-zinc-900 text-white text-sm font-bold py-3.5 flex items-center justify-center gap-2"
            >
              Log Weight <span className="text-base leading-none">→</span>
            </button>
          </div>

          {/* Streak card */}
          <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-zinc-100 flex flex-col items-center justify-between">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center mb-1">
                <span className="absolute -top-2 -left-3 text-[10px] text-orange-300">✦</span>
                <span className="text-[42px] leading-none">🔥</span>
                <span className="absolute -top-2 -right-3 text-[10px] text-orange-300">✦</span>
                <span className="absolute bottom-0 -right-2 text-[8px] text-orange-200">✦</span>
              </div>
              <span className="text-4xl font-black text-orange-500 leading-none mt-2">
                {stats?.streak ?? 0}
              </span>
              <p className="text-orange-500 text-xs font-bold mt-1 mb-3">Day streak</p>
            </div>
            <div className="flex gap-1.5">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] text-zinc-400 font-semibold">{d}</span>
                  <div className={`w-4 h-4 rounded-full ${(stats?.streakLast7 ?? [])[i] ? 'bg-orange-400' : 'bg-zinc-200'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="px-6 flex gap-3 mb-4">
          {[
            { label: 'Sessions', value: stats?.totalSessions ?? 0, suffix: '' },
            { label: 'This week', value: stats?.sessionsThisWeek ?? 0, suffix: '' },
            { label: '7-day avg', value: stats?.avgScore7d ?? '—', suffix: stats?.avgScore7d ? '' : '' },
          ].map(s => (
            <div key={s.label} className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-zinc-100 text-center">
              <span className="text-xl font-black text-zinc-900">{s.value}</span>
              <p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── BMI Card ── */}
        {(() => {
          const bmi = latestWeight && heightCm ? latestWeight / ((heightCm / 100) ** 2) : null;
          const bmiCategory = bmi
            ? bmi < 18.5 ? { label: 'Underweight', color: 'bg-blue-400', textColor: 'text-blue-600', pct: (bmi / 40) * 100 }
            : bmi < 25   ? { label: 'Healthy',     color: 'bg-green-400', textColor: 'text-green-600', pct: (bmi / 40) * 100 }
            : bmi < 30   ? { label: 'Overweight',  color: 'bg-amber-400', textColor: 'text-amber-600', pct: (bmi / 40) * 100 }
            :               { label: 'Obese',      color: 'bg-red-500',   textColor: 'text-red-600',   pct: Math.min(99, (bmi / 40) * 100) }
            : null;
          return (
            <div className="mx-6 bg-white rounded-3xl p-5 shadow-sm border border-zinc-100 mb-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-base text-zinc-900">Your BMI</h2>
                <button
                  onClick={() => setEditingHeight(true)}
                  className="text-[10px] text-zinc-400 font-semibold bg-zinc-50 rounded-full px-2.5 py-1"
                >
                  {heightCm ? `${heightCm} cm ✎` : 'Set height'}
                </button>
              </div>

              {editingHeight && (
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Height in cm"
                    value={heightInput}
                    onChange={e => setHeightInput(e.target.value)}
                    className="flex-1 bg-zinc-50 rounded-xl px-3 py-2 text-sm text-zinc-900 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={saveHeight}
                    className="bg-zinc-900 text-white text-xs font-bold rounded-xl px-4 py-2"
                  >
                    Save
                  </button>
                </div>
              )}

              {bmi && bmiCategory ? (
                <>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl font-black text-zinc-900 leading-none">{bmi.toFixed(2)}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${bmiCategory.color} text-white`}>
                      {bmiCategory.label}
                    </span>
                    <button
                      onClick={() => {}}
                      className="w-5 h-5 rounded-full border border-zinc-200 flex items-center justify-center ml-auto shrink-0"
                    >
                      <span className="text-zinc-400 text-[10px] font-bold">?</span>
                    </button>
                  </div>
                  {/* Gradient bar */}
                  <div className="relative h-2.5 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 via-green-400 via-50% via-amber-400 to-red-500 mb-2">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-zinc-900 rounded-full shadow"
                      style={{ left: `${Math.min(98, Math.max(1, bmiCategory.pct))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-400 font-semibold">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />Underweight</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Healthy</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />Overweight</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Obese</span>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-zinc-400 text-sm font-semibold">
                    {latestWeight ? 'Tap "Set height" above to calculate your BMI' : 'Log your weight and set height to calculate BMI'}
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Time range selector ── */}
        <div className="px-6 flex gap-2 mb-4 overflow-x-auto">
          {timeRanges.map(r => (
            <button
              key={r}
              onClick={() => setSelectedRange(r)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedRange === r ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* ── FORMAX Trend ── */}
        <div className="mx-6 bg-white rounded-3xl p-5 shadow-sm border border-zinc-100 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-base text-zinc-900">FORMAX Trend</h2>
            {stats?.avgScore7d != null && stats?.avgScore30d != null && (
              <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
                stats.avgScore7d >= stats.avgScore30d ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}>
                {stats.avgScore7d >= stats.avgScore30d
                  ? <TrendingUp className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />}
                {Math.abs(stats.avgScore7d - stats.avgScore30d)}pts vs 30d
              </div>
            )}
          </div>

          {scoreTrend.length > 0 ? (
            <svg viewBox={`0 0 ${CHART_W} ${CHART_H + 20}`} className="w-full h-28 mt-2">
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 25, 50, 75, 100].map(v => {
                const y = toChartY(v, sMin, sMax, CHART_H);
                return (
                  <g key={v}>
                    <line x1="0" y1={y} x2={CHART_W} y2={y} stroke="#f4f4f5" strokeDasharray="4 4" />
                    <text x="0" y={y - 2} fontSize="7" fill="#a1a1aa">{v}</text>
                  </g>
                );
              })}
              {scorePoints.length > 1 && (
                <path
                  d={`M${scorePoints[0]} ${scorePoints.slice(1).map(p => `L${p}`).join(' ')} L${CHART_W},${CHART_H} L0,${CHART_H} Z`}
                  fill="url(#scoreGrad)"
                />
              )}
              <polyline
                fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                points={scorePoints.join(' ')}
              />
              {scoreTrend.map((v, i) => {
                const x = scoreTrend.length > 1 ? (i / (scoreTrend.length - 1)) * CHART_W : CHART_W / 2;
                const y = toChartY(v, sMin, sMax, CHART_H);
                return (
                  <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke="#059669" strokeWidth="2" />
                );
              })}
            </svg>
          ) : (
            <div className="h-28 flex items-center justify-center text-center">
              <p className="text-zinc-300 text-sm font-semibold">Record your first session<br/>to see your trend</p>
            </div>
          )}
        </div>

        {/* ── Joint Body Map + List ── */}
        <div className="mx-6 bg-white rounded-3xl p-5 shadow-sm border border-zinc-100 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-zinc-900">Joint Health</h2>
            <span className="text-xs text-zinc-400 font-medium">Tap a joint to inspect</span>
          </div>

          <div className="flex gap-4 items-start">
            {/* Body Map */}
            <div className="w-[130px] shrink-0">
              {stats?.jointHealth && stats.jointHealth.length > 0 ? (
                <BodyMap
                  joints={stats.jointHealth}
                  activeJoint={activeJoint}
                  onSelect={name => setActiveJoint(prev => prev === name ? null : name)}
                />
              ) : (
                <div className="w-[130px] h-[220px] rounded-2xl bg-zinc-50 flex items-center justify-center">
                  <p className="text-zinc-300 text-xs text-center font-semibold px-3">No session data yet</p>
                </div>
              )}
            </div>

            {/* Joint list */}
            <div className="flex-1 flex flex-col gap-2.5">
              {(stats?.jointHealth ?? []).map(joint => {
                const c = scoreColor(joint.score);
                const isActive = activeJoint === joint.name;
                return (
                  <motion.button
                    key={joint.name}
                    onClick={() => setActiveJoint(prev => prev === joint.name ? null : joint.name)}
                    animate={{ scale: isActive ? 1.02 : 1 }}
                    className={`w-full text-left rounded-2xl px-3 py-2.5 border transition-all ${
                      isActive ? `${c.bg} ${c.border}` : 'bg-zinc-50 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-zinc-700">{joint.name}</span>
                      <div className="flex items-center gap-1">
                        {joint.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                        {joint.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
                        {joint.trend === 'neutral' && <Minus className="w-3 h-3 text-zinc-400" />}
                        <span className={`text-xs font-black ${c.text}`}>{joint.score}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${joint.score}%` }}
                        transition={{ duration: 1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: c.ring }}
                      />
                    </div>
                  </motion.button>
                );
              })}
              {!stats?.jointHealth?.length && (
                <p className="text-zinc-300 text-xs font-semibold text-center py-4">
                  Record sets to see<br/>joint health data
                </p>
              )}
            </div>
          </div>

          {/* Active joint detail */}
          <AnimatePresence>
            {selectedJointData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={`mt-4 rounded-2xl p-4 ${scoreColor(selectedJointData.score).bg} ${scoreColor(selectedJointData.score).border} border`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-black text-zinc-900 text-sm">{selectedJointData.name}</span>
                    <span className={`font-black text-xs ${scoreColor(selectedJointData.score).text}`}>
                      {selectedJointData.score}/100
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    {selectedJointData.score >= 75
                      ? `Your ${selectedJointData.name.toLowerCase()} are performing well — keep reinforcing good form cues.`
                      : selectedJointData.score >= 50
                      ? `Some form issues affecting your ${selectedJointData.name.toLowerCase()}. Focus on your coach's cues during warm-up sets.`
                      : `High injury risk detected in your ${selectedJointData.name.toLowerCase()}. Reduce load and prioritise technique before progressing.`}
                  </p>
                  {selectedJointData.trend !== 'neutral' && (
                    <p className={`text-xs font-bold mt-2 ${selectedJointData.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {selectedJointData.trend === 'up'
                        ? `↑ Improving — up ${selectedJointData.trendValue} pts from last period`
                        : `↓ Declining — down ${selectedJointData.trendValue} pts from last period`}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Goal Progress Chart ── */}
        <div className="mx-6 bg-white rounded-3xl p-5 shadow-sm border border-zinc-100 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-base text-zinc-900">Goal Progress</h2>
            <button
              onClick={() => setShowLogWeight(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 bg-zinc-100 rounded-full px-3 py-1.5"
            >
              <Target className="w-3 h-3" />
              {latestWeight && weightGoal
                ? `${Math.round((latestWeight / weightGoal) * 100)}% of goal`
                : '0% of goal'}
              <span className="text-[10px]">✏️</span>
            </button>
          </div>

          {weightChartData.length > 0 ? (
            <svg viewBox={`0 0 ${CHART_W} ${CHART_H + 20}`} className="w-full h-28 mt-2">
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Dashed grid */}
              {[0, 25, 50, 75, 100].map(pct => {
                const v = wMin + (pct / 100) * (wMax - wMin);
                const y = toChartY(v, wMin, wMax, CHART_H);
                return (
                  <g key={pct}>
                    <line x1="0" y1={y} x2={CHART_W} y2={y} stroke="#f4f4f5" strokeDasharray="4 4" />
                    <text x="0" y={y - 2} fontSize="7" fill="#a1a1aa">{v.toFixed(0)}</text>
                  </g>
                );
              })}
              {/* Goal line */}
              {weightGoal != null && (
                <line
                  x1="0" y1={toChartY(weightGoal, wMin, wMax, CHART_H)}
                  x2={CHART_W} y2={toChartY(weightGoal, wMin, wMax, CHART_H)}
                  stroke="#d97706" strokeDasharray="5 3" strokeWidth="1.5"
                />
              )}
              {/* Area fill */}
              {weightPoints.length > 1 && (
                <path
                  d={`M${weightPoints[0]} ${weightPoints.slice(1).map(p => `L${p}`).join(' ')} L${CHART_W},${CHART_H} L0,${CHART_H} Z`}
                  fill="url(#weightGrad)"
                />
              )}
              <polyline
                fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                points={weightPoints.join(' ')}
              />
              {weightChartData.map((l, i) => {
                const x = weightChartData.length > 1 ? (i / (weightChartData.length - 1)) * CHART_W : CHART_W / 2;
                const y = toChartY(l.weight_kg, wMin, wMax, CHART_H);
                return <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke="#2563eb" strokeWidth="2" />;
              })}
            </svg>
          ) : (
            <div className="h-28 flex items-center justify-center">
              <p className="text-zinc-300 text-sm font-semibold text-center">Log your weight to track progress</p>
            </div>
          )}

          {goalDisplay && latestWeight && (
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-blue-500 rounded" />
                <span className="text-zinc-400 font-medium">Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 border-t border-dashed border-amber-500" />
                <span className="text-zinc-400 font-medium">Goal: {goalDisplay} {weightUnit}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Progress Photos ── */}
        <div className="mb-4">
          <div className="px-6 flex items-center justify-between mb-3">
            <h2 className="font-bold text-base text-zinc-900">Progress Photos</h2>
            <button
              onClick={() => setShowAddPhoto(true)}
              className="flex items-center gap-1 text-xs font-bold text-zinc-500 bg-zinc-50 rounded-full px-3 py-1.5"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="pl-6 flex gap-3 overflow-x-auto pb-2 pr-6">
            {/* Add button thumbnail */}
            <button
              onClick={() => setShowAddPhoto(true)}
              className="shrink-0 w-24 h-32 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-1"
            >
              <Camera className="w-6 h-6 text-zinc-300" />
              <span className="text-[10px] text-zinc-300 font-semibold">New</span>
            </button>
            {photos.map(photo => (
              <div key={photo.id} className="shrink-0 w-24 h-32 rounded-2xl overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.photo_data} alt={photo.caption ?? 'Progress'} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-1.5 pb-1.5 pt-4">
                  <p className="text-white text-[8px] font-semibold truncate">
                    {new Date(photo.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
            {photos.length === 0 && (
              <div className="flex items-center gap-3 text-zinc-300">
                <p className="text-xs font-semibold whitespace-nowrap">No photos yet — add your first progress pic</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Motivational Banner ── */}
        <div className="mx-6 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 mb-4">
          <p className="text-emerald-700 text-sm font-semibold text-center">
            {(stats?.streak ?? 0) > 0
              ? `🔥 ${stats!.streak}-day streak! Keep showing up — consistency beats perfection.`
              : `🏋️ Getting started is the hardest part. You're ready for this!`}
          </p>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showLogWeight && (
          <LogWeightModal
            unit={weightUnit}
            onSave={handleLogWeight}
            onClose={() => setShowLogWeight(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddPhoto && (
          <AddPhotoModal
            onSave={handleAddPhoto}
            onClose={() => setShowAddPhoto(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
