"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Zap, Bone } from "lucide-react";
import { AppleStoreButton, GooglePlayButton } from "@/components/ui/StoreButtons";

export function ValueProp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.95]);

  return (
    <section ref={containerRef} className="py-32 w-full flex flex-col gap-32">
      {/* 50/50 Split Screen Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        <div className="flex flex-col gap-8 pr-0 lg:pr-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-full w-fit">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-zinc-600 dark:text-zinc-300 uppercase">Live Queue</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-sans tracking-tight text-zinc-900 dark:text-white leading-tight">
            Stop guessing. <br/>
            <span className="text-zinc-500 dark:text-zinc-600">Start progressing.</span>
          </h2>
          
          <div className="flex flex-col gap-6">
            <FeatureRow 
              icon={<ShieldIcon />}
              title="Bulletproof Your Joints" 
              desc="We specifically flag common faults like lumbar flexion and butt wink, assigning an instant Injury Risk metric."
            />
            <FeatureRow 
              icon={<ZapIcon />}
              title="Top Priority Cues" 
              desc="Forget overwhelming data. Get one actionable cue to focus on for your very next set."
            />
          </div>
        </div>

        <motion.div 
          style={{ y: y1 }}
          className="relative w-full aspect-square bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-[2.5rem] p-4 lg:p-8 overflow-hidden flex flex-col pt-12"
        >
          {/* Mock UI window */}
          <div className="w-full flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl relative overflow-hidden flex flex-col">
            <div className="h-10 border-b border-zinc-200 dark:border-white/5 w-full flex items-center px-4 gap-2 bg-zinc-50 dark:bg-[#0A0A0B]">
               <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-800" />
               <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-800" />
               <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-800" />
            </div>
            <div className="flex-1 p-6 flex flex-col gap-4">
               <div className="h-8 bg-zinc-100 dark:bg-zinc-900 rounded-md w-1/3" />
               <div className="w-full h-32 bg-red-50 dark:bg-red-500/5 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex flex-col gap-2">
                 <span className="font-bold text-sm tracking-tight text-red-600 dark:text-red-400">HIGH INJURY RISK</span>
                 <p className="text-xs opacity-80 leading-relaxed text-zinc-900 dark:text-red-400">Lumbar spine entered 15° of flexion during initial pull. Drop weight by 10% and focus on lat tension.</p>
               </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent" />
          </div>
        </motion.div>
      </div>

      {/* Dark Mode / Premium Vibe Feature Spotlight - Full width banner */}
      <motion.div 
        style={{ scale }}
        className="w-full bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-[3rem] p-12 lg:p-24 flex flex-col items-center justify-center text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#d4d4d8_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,#1E1A24_0%,transparent_70%)]" />
        
        <h3 className="text-3xl md:text-5xl font-sans tracking-tighter text-zinc-900 dark:text-white mb-6 relative z-10">
          Ready to lift smarter? <br/>Get the app today.
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-[50ch] text-lg relative z-10 mb-10">
          Form Max is exclusively available on mobile. Carry an elite strength coach in your pocket, right on the gym floor.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <AppleStoreButton />
          <GooglePlayButton />
        </div>
      </motion.div>
    </section>
  );
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-zinc-900 dark:text-white font-medium tracking-tight text-lg">{title}</span>
        <span className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{desc}</span>
      </div>
    </div>
  )
}

function ShieldIcon() {
  return <Bone className="text-zinc-500 dark:text-zinc-400" size={20} />
}
function ZapIcon() {
  return <Zap className="text-blue-500 dark:text-blue-400" size={20} />
}