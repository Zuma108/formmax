"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp, ChevronLeft, AlertTriangle, Target, ArrowUpDown, Crosshair, Dumbbell, Eye, Shield, ScanEye, Wrench } from "lucide-react";

// ── Score Circle (dynamic gradient ring) ──────────────────────────────────

function getScoreGradient(score: number): { stops: Array<{ offset: string; color: string }>; glow: string; textColors: string } {
 if (score < 40) {
  // Red zone: deep red → bright red
  return {
   stops: [
    { offset: "0%", color: "#b91c1c" },
    { offset: "50%", color: "#dc2626" },
    { offset: "100%", color: "#ef4444" },
   ],
   glow: "#ef4444",
   textColors: "from-[#b91c1c] via-[#dc2626] to-[#ef4444]",
  };
 }
 if (score < 70) {
  // Yellow zone: red → orange → amber (runs red→yellow)
  return {
   stops: [
    { offset: "0%", color: "#dc2626" },
    { offset: "40%", color: "#ff6a00" },
    { offset: "70%", color: "#ff9500" },
    { offset: "100%", color: "#ffbe00" },
   ],
   glow: "#ff9500",
   textColors: "from-[#dc2626] via-[#ff9500] to-[#ffbe00]",
  };
 }
 // Green zone: red → orange → amber → green (runs red→yellow→green)
 return {
  stops: [
   { offset: "0%", color: "#dc2626" },
   { offset: "25%", color: "#ff6a00" },
   { offset: "50%", color: "#ffbe00" },
   { offset: "75%", color: "#4ade80" },
   { offset: "100%", color: "#22c55e" },
  ],
  glow: "#22c55e",
  textColors: "from-[#ff6a00] via-[#4ade80] to-[#22c55e]",
 };
}

function ScoreCircle({ score }: { score: number }) {
 const radius = 40;
 const stroke = 8;
 const circumference = 2 * Math.PI * radius;
 const offset = circumference - (score / 100) * circumference;
 const grad = getScoreGradient(score);

 return (
  <div className="flex items-center gap-3">
   <div className="relative w-[90px] h-[90px]">
    <svg width="90" height="90" viewBox="0 0 96 96">
     <defs>
      <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
       {grad.stops.map((s, i) => (
        <stop key={i} offset={s.offset} stopColor={s.color} />
       ))}
      </linearGradient>
      <filter id="neonGlow">
       <feGaussianBlur stdDeviation="3" result="blur" />
       <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
       </feMerge>
      </filter>
     </defs>
     <circle cx="48" cy="48" r={radius} fill="none" stroke="#1a1a2e" strokeWidth={stroke} />
     <circle
      cx="48" cy="48" r={radius}
      fill="none" stroke="url(#neonGrad)" strokeWidth={stroke}
      strokeLinecap="round"
      strokeDasharray={circumference}
      strokeDashoffset={offset}
      transform="rotate(-90 48 48)"
      filter="url(#neonGlow)"
      style={{ transition: "stroke-dashoffset 0.8s ease" }}
     />
    </svg>
   </div>
   <span
    className={`text-[28px] bg-gradient-to-r ${grad.textColors} bg-clip-text text-transparent`}
    style={{ fontWeight: 650 }}
   >
    {score}%
   </span>
  </div>
 );
}

// ── Advice Card ───────────────────────────────────────────────────────────

const CHECKPOINT_ICONS: Record<string, React.ReactNode> = {
 setup: <AlertTriangle size={20} />,
 grip: <AlertTriangle size={20} />,
 hinge: <Target size={20} />,
 hip: <Target size={20} />,
 bar: <ArrowUpDown size={20} />,
 spine: <Shield size={20} />,
 lockout: <Dumbbell size={20} />,
 eccentric: <ArrowUpDown size={20} />,
 stance: <Crosshair size={20} />,
 descent: <ArrowUpDown size={20} />,
 depth: <Eye size={20} />,
 drive: <Dumbbell size={20} />,
 knee: <Target size={20} />,
 press: <Dumbbell size={20} />,
 shoulder: <Shield size={20} />,
 touch: <Crosshair size={20} />,
 arch: <Eye size={20} />,
};

function getCheckpointIcon(name: string): React.ReactNode {
 const lower = name.toLowerCase();
 for (const key in CHECKPOINT_ICONS) {
  if (lower.includes(key)) return CHECKPOINT_ICONS[key];
 }
 return <Target size={20} />;
}

function getCheckpointColor(score: number): string {
 if (score >= 70) return "#22c55e";
 if (score >= 40) return "#f59e0b";
 return "#e74c3c";
}

// ── Parse structured feedback ─────────────────────────────────────────────

function parseFeedback(feedback: string): { observation: string; comparison: string; tip: string } {
 let observation = '';
 let comparison = '';
 let tip = feedback;

 // Extract OBSERVED section
 const obsMatch = feedback.match(/OBSERVED:\s*(.+?)(?=\s*COMPARED:|$)/i);
 if (obsMatch) {
  observation = obsMatch[1].replace(/\.\s*$/, '').trim();
  tip = tip.replace(/OBSERVED:\s*.+?(?=\s*COMPARED:|$)/i, '').trim();
 }

 // Extract COMPARED section
 const cmpMatch = feedback.match(/COMPARED:\s*(.+?)(?=\.|$)/i);
 if (cmpMatch) {
  comparison = cmpMatch[1].replace(/\.\s*$/, '').trim();
  tip = tip.replace(/COMPARED:\s*.+?(?=\.|$)/i, '').trim();
 }

 // Clean up leftover punctuation/whitespace
 tip = tip.replace(/^[\.\s]+/, '').trim();

 return { observation, comparison, tip: tip || feedback };
}

interface AdviceCardProps {
 icon: React.ReactNode;
 title: string;
 description: string;
 color: string;
 score: number;
 mode?: 'observation' | 'tip';
}

function AdviceCard({ icon, title, description, color, score, mode = 'observation' }: AdviceCardProps) {
 const [expanded, setExpanded] = useState(false);
 const parsed = parseFeedback(description);

 const previewText = mode === 'tip' ? parsed.tip : (parsed.observation || parsed.tip);

 return (
  <div
   className="bg-[#f7f7f7] rounded-2xl p-4 cursor-pointer active:bg-[#eeeeee] transition-colors"
   onClick={() => setExpanded(!expanded)}
  >
   <div className="flex items-start gap-3">
    <div
     className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
     style={{ backgroundColor: color + "18" }}
    >
     <div style={{ color }}>{icon}</div>
    </div>
    <div className="flex-1 min-w-0">
     <div className="flex items-center justify-between">
      <span className="text-[15px] text-black" style={{ fontWeight: 600 }}>
       {title}
      </span>
      <div className="flex items-center gap-2">
       <span className="text-xs font-bold" style={{ color }}>{score}/100</span>
       {expanded ? (
        <ChevronUp size={18} className="text-gray-400" />
       ) : (
        <ChevronDown size={18} className="text-gray-400" />
       )}
      </div>
     </div>

     {!expanded ? (
      <p className="text-[13px] text-gray-500 mt-1 leading-[1.45] line-clamp-2">
       {previewText}
      </p>
     ) : mode === 'observation' ? (
      /* Analysis view — observation only, no fix tips */
      <div className="mt-2">
       {parsed.observation && (
        <div className="flex items-start gap-2 bg-white rounded-xl p-2.5">
         <ScanEye size={14} className="text-gray-400 mt-0.5 shrink-0" />
         <div>
          <span className="text-[11px] uppercase tracking-wide text-gray-400" style={{ fontWeight: 600 }}>What we saw</span>
          <p className="text-[12.5px] text-gray-600 leading-[1.4] mt-0.5">{parsed.observation}</p>
         </div>
        </div>
       )}
       {!parsed.observation && (
        <p className="text-[13px] text-gray-500 leading-[1.45]">{description}</p>
       )}
      </div>
     ) : (
      /* Fix Form view — tip only */
      <div className="mt-2">
       <div className="flex items-start gap-2 bg-white rounded-xl p-2.5">
        <Wrench size={14} className="mt-0.5 shrink-0" style={{ color }} />
        <div>
         <span className="text-[11px] uppercase tracking-wide" style={{ fontWeight: 600, color }}>How to fix</span>
         <p className="text-[12.5px] text-gray-600 leading-[1.4] mt-0.5 italic">{parsed.tip}</p>
        </div>
       </div>
      </div>
     )}
    </div>
   </div>
  </div>
 );
}

// ── Error Popup ───────────────────────────────────────────────────────────

function ErrorPopup({ error, onClose, onRetry }: { error: string; onClose: () => void; onRetry: () => void }) {
 const isRejection = error.toLowerCase().includes('no exercise')
  || error.toLowerCase().includes('no human')
  || error.toLowerCase().includes('not visible')
  || error.toLowerCase().includes('no recognizable');

 return (
  <div className="w-[393px] max-w-full bg-white rounded-t-[32px] rounded-b-[32px] shadow-2xl overflow-hidden pb-6">
   <div className="px-6 pt-6 pb-2">
    <div className="flex items-center justify-between mb-5">
     <div className="bg-[#efefef] rounded-full px-4 py-1.5">
      <span className="text-[15px] text-black" style={{ fontWeight: 510 }}>
       {isRejection ? 'Detection Issue' : 'Analysis Error'}
      </span>
     </div>
     <button
      onClick={onClose}
      className="w-8 h-8 rounded-full bg-[#f0f0f0] flex items-center justify-center"
     >
      <X size={16} className="text-gray-500" />
     </button>
    </div>
   </div>

   <div className="px-6 py-4">
    <div className={`${isRejection ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'} border rounded-2xl p-6 text-center`}>
     <div className="text-4xl mb-3">{isRejection ? '🎥' : '⚠️'}</div>
     <h2 className={`font-bold text-lg ${isRejection ? 'text-amber-800' : 'text-red-700'} mb-2`}>
      {isRejection ? 'No Exercise Detected' : 'Analysis Failed'}
     </h2>
     <p className={`${isRejection ? 'text-amber-700' : 'text-red-600'} text-sm mb-2`}>{error}</p>
     {isRejection && (
      <div className="text-zinc-500 text-xs space-y-1 mt-3">
       <p>Make sure your recording shows:</p>
       <p>Full body visible performing the movement</p>
       <p>Good lighting &amp; a clear side-angle view</p>
      </div>
     )}
    </div>
   </div>

   <div className="px-6 pt-4 flex gap-3">
    <button
     onClick={onClose}
     className="flex-1 h-[50px] rounded-full border border-gray-200 bg-white flex items-center justify-center text-[15px] text-black"
     style={{ fontWeight: 500 }}
    >
     Dismiss
    </button>
    <button
     onClick={onRetry}
     className="flex-1 h-[50px] rounded-full bg-black text-white text-[15px] flex items-center justify-center"
     style={{ fontWeight: 500 }}
    >
     {isRejection ? 'Record Again' : 'Try Again'}
    </button>
   </div>
  </div>
 );
}

// ── Main Popup ────────────────────────────────────────────────────────────

export interface FormAnalysisPopupProps {
 result: any;
 analysisError: string | null;
 mediaBlobUrl: string | null;
 onClose: () => void;
 onFixForm: () => void;
 onRetry: () => void;
}

export default function FormAnalysisPopup({
 result,
 analysisError,
 mediaBlobUrl,
 onClose,
 onFixForm,
 onRetry,
}: FormAnalysisPopupProps) {
 const [showImprove, setShowImprove] = useState(false);

 // Error state → show error popup instead
 if (analysisError && !result) {
  return (
   <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
    onClick={onClose}
   >
    <motion.div
     initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
     transition={{ type: 'spring', damping: 28, stiffness: 260 }}
     onClick={e => e.stopPropagation()}
    >
     <ErrorPopup error={analysisError} onClose={onClose} onRetry={onRetry} />
    </motion.div>
   </motion.div>
  );
 }

 if (!result) return null;

 const finalScore = result.final_score ?? 0;
 const checkpoints: Array<{ name: string; score: number; feedback: string }> = result.checkpoints ?? [];

 // All checkpoints sorted by score (worst first)
 const allCheckpoints = [...checkpoints].sort((a, b) => a.score - b.score);

 return (
  <motion.div
   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
   className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
   onClick={onClose}
  >
   <motion.div
    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
    transition={{ type: 'spring', damping: 28, stiffness: 260 }}
    onClick={e => e.stopPropagation()}
    className="w-full max-w-md"
   >
    <div className="bg-white shadow-2xl overflow-hidden pb-6">
     {/* Video preview header */}
     {mediaBlobUrl && (
      <div className="relative w-full h-44 overflow-hidden">
       <video
        src={mediaBlobUrl}
        autoPlay loop muted playsInline
        className="w-full h-full object-cover"
       />
       <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />
       <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
        <button
         onClick={showImprove ? () => setShowImprove(false) : onClose}
         className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
        >
         {showImprove ? <ChevronLeft size={16} className="text-white" /> : <X size={16} className="text-white" />}
        </button>
        <span className="text-white text-[15px]" style={{ fontWeight: 600 }}>
         {showImprove ? 'How to Improve' : 'Record Your Form'}
        </span>
        <div className="w-8 h-8" />
       </div>
       {/* Corner scan marks */}
       {!showImprove && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
         <div className="w-[50%] h-[60%] relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/60 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/60 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/60 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/60 rounded-br-xl" />
         </div>
        </div>
       )}
      </div>
     )}

     <AnimatePresence mode="wait">
      {!showImprove ? (
       <motion.div
        key="analysis"
        initial={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.2 }}
       >
        {/* Header */}
        <div className="px-6 pt-5 pb-2">
         <div className="flex items-center justify-between mb-5">
          <div className="bg-[#efefef] rounded-full px-4 py-1.5">
           <span className="text-[15px] text-black" style={{ fontWeight: 510 }}>
            Form Analysis
           </span>
          </div>
          {!mediaBlobUrl && (
           <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0f0f0] flex items-center justify-center"
           >
            <X size={16} className="text-gray-500" />
           </button>
          )}
         </div>

         {/* Score section */}
         <div className="flex items-center justify-between mb-6">
          <h1
           className="text-[24px] text-black tracking-tight"
           style={{ fontWeight: 700 }}
          >
           FORMAX
           <br />
           SCORE
          </h1>
          <ScoreCircle score={Math.round(finalScore)} />
         </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-6" />

        {/* Advice cards — all checkpoints */}
        <div className="px-6 pt-4 flex flex-col gap-3 max-h-[40vh] overflow-y-auto">
         {allCheckpoints.map((cp, i) => (
          <AdviceCard
           key={`advice-${i}`}
           icon={getCheckpointIcon(cp.name)}
           title={cp.name}
           description={cp.feedback}
           color={getCheckpointColor(cp.score)}
           score={cp.score}
          />
         ))}
        </div>

        {/* Bottom buttons */}
        <div className="px-6 pt-6 flex gap-3">
         <button
          onClick={() => setShowImprove(true)}
          className="flex-1 h-[50px] rounded-full border border-gray-200 bg-white flex items-center justify-center gap-2 text-[15px] text-black active:scale-[0.97] transition-transform"
          style={{ fontWeight: 500 }}
         >
          <span>✦</span> Fix Form
         </button>
         <button
          onClick={onClose}
          className="flex-1 h-[50px] rounded-full bg-black text-white text-[15px] flex items-center justify-center active:scale-[0.97] transition-transform"
          style={{ fontWeight: 500 }}
         >
          Done
         </button>
        </div>
       </motion.div>
      ) : (
       <motion.div
        key="improve"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 30 }}
        transition={{ duration: 0.2 }}
       >
        {/* Improve Header */}
        <div className="px-6 pt-5 pb-2">
         <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
           {!mediaBlobUrl && (
            <button
             onClick={() => setShowImprove(false)}
             className="w-8 h-8 rounded-full bg-[#f0f0f0] flex items-center justify-center"
            >
             <ChevronLeft size={16} className="text-gray-500" />
            </button>
           )}
           <div className="bg-[#efefef] rounded-full px-4 py-1.5">
            <span className="text-[15px] text-black" style={{ fontWeight: 510 }}>
             How to Improve
            </span>
           </div>
          </div>
          {!mediaBlobUrl && (
           <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0f0f0] flex items-center justify-center"
           >
            <X size={16} className="text-gray-500" />
           </button>
          )}
         </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-6" />

        {/* Improvement tips — all checkpoints, only actionable tips */}
        <div className="px-6 pt-4 flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
         {allCheckpoints.map((cp, i) => (
          <AdviceCard
           key={`improve-${i}`}
           icon={getCheckpointIcon(cp.name)}
           title={cp.name}
           description={cp.feedback}
           color={getCheckpointColor(cp.score)}
           score={cp.score}
           mode="tip"
          />
         ))}
        </div>

        {/* Bottom button */}
        <div className="px-6 pt-6 flex gap-3">
         <button
          onClick={() => setShowImprove(false)}
          className="flex-1 h-[50px] rounded-full border border-gray-200 bg-white flex items-center justify-center gap-2 text-[15px] text-black active:scale-[0.97] transition-transform"
          style={{ fontWeight: 500 }}
         >
          <ChevronLeft size={14} /> Back
         </button>
         <button
          onClick={onClose}
          className="flex-1 h-[50px] rounded-full bg-black text-white text-[15px] flex items-center justify-center active:scale-[0.97] transition-transform"
          style={{ fontWeight: 500 }}
         >
          Done
         </button>
        </div>
       </motion.div>
      )}
     </AnimatePresence>
    </div>
   </motion.div>
  </motion.div>
 );
}
