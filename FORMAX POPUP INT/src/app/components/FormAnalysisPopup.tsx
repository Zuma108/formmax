import { useState } from "react";
import { X, ChevronDown, ChevronUp, AlertTriangle, Target, ArrowUpDown } from "lucide-react";

function ScoreCircle({ score }: { score: number }) {
  const radius = 40;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[90px] h-[90px]">
        <svg width="90" height="90" viewBox="0 0 96 96"><defs><linearGradient><stop></stop><stop></stop><stop></stop></linearGradient><filter><feGaussianBlur></feGaussianBlur><feMerge><feMergeNode></feMergeNode><feMergeNode></feMergeNode></feMerge></filter></defs><circle></circle><defs>
            <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6a00" />
              <stop offset="50%" stopColor="#ff9500" />
              <stop offset="100%" stopColor="#ffbe00" />
            </linearGradient>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs><circle></circle><circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth={stroke}
          /><circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="url(#neonGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 48 48)"
            filter="url(#neonGlow)"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          /></svg>
      </div>
      <span
        className="text-[28px] bg-gradient-to-r from-[#ff6a00] via-[#ff9500] to-[#ffbe00] bg-clip-text text-transparent"
        style={{ fontWeight: 650 }}
      >
        60%
      </span>
    </div>
  );
}

interface AdviceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function AdviceCard({ icon, title, description, color }: AdviceCardProps) {
  const [expanded, setExpanded] = useState(false);

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
            {expanded ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </div>
          <p
            className={`text-[13px] text-gray-500 mt-1 leading-[1.45] ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FormAnalysisPopup({
  onClose,
}: {
  onClose?: () => void;
}) {
  const adviceItems: AdviceCardProps[] = [
    {
      icon: <AlertTriangle size={20} />,
      title: "Set Up & Grip",
      description:
        "A clear rounding of the lower back (lumbar flexion) is present in the setup, and the shoulders are slightly protracted/rounded forward. Focus on engaging your lats by pulling the slack out of the bar and setting your chest proud before initiating the lift.",
      color: "#e74c3c",
    },
    {
      icon: <ArrowUpDown size={20} />,
      title: "Eccentric Control",
      description:
        "The descent phase appears rushed with minimal braking control. Slow down the lowering portion to a 2-3 second count, maintaining tension throughout the posterior chain. This will improve muscle engagement and reduce injury risk during heavy sets.",
      color: "#f39c12",
    },
    {
      icon: <Target size={20} />,
      title: "Hip Hinge Initiation",
      description:
        "The hips elevate rapidly and significantly before the shoulders start to rise. Focus on driving your feet through the floor away from you, not just pulling the bar up. Think of the movement as a leg press against the ground while keeping your chest up.",
      color: "#3498db",
    },
  ];

  return (
    <div className="w-[393px] max-w-full bg-white rounded-t-[32px] rounded-b-[32px] shadow-2xl overflow-hidden pb-6">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-5">
          <div className="bg-[#efefef] rounded-full px-4 py-1.5">
            <span className="text-[15px] text-black" style={{ fontWeight: 510 }}>
              Form Analysis
            </span>
          </div>
          {onClose && (
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
          <ScoreCircle score={60} />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mx-6" />

      {/* Advice cards */}
      <div className="px-6 pt-4 flex flex-col gap-3">
        {adviceItems.map((item, index) => (
          <AdviceCard key={`advice-${index}`} {...item} />
        ))}
      </div>

      {/* Bottom buttons */}
      <div className="px-6 pt-6 flex gap-3">
        <button className="flex-1 h-[50px] rounded-full border border-gray-200 bg-white flex items-center justify-center gap-2 text-[15px] text-black" style={{ fontWeight: 500 }}>
          <span>✦</span> Fix Form
        </button>
        <button className="flex-1 h-[50px] rounded-full bg-black text-white text-[15px] flex items-center justify-center" style={{ fontWeight: 500 }}>
          Done
        </button>
      </div>
    </div>
  );
}