"use client";

import { motion } from "framer-motion";
import { Activity, Target, ShieldAlert, Sparkles } from "lucide-react";
import { FadeInStagger, FadeInItem } from "./Interactive";

export function CoreFeatures() {
  return (
    <section id="features" className="py-32 w-full flex flex-col items-center">
      <div className="flex flex-col items-center text-center gap-4 mb-20 max-w-[60ch]">
        <h2 className="text-4xl md:text-5xl font-sans tracking-tight text-zinc-900 dark:text-white">
          What does Form Max include?
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
          Instead of just saying "good job," we break down your lifts mathematically against a perfect vector-embedded Standard.
        </p>
      </div>

      <FadeInStagger className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]">
        {/* Bento Item 1: Large Asymmetric Card */}
        <FadeInItem className="lg:col-span-2 relative rounded-[2rem] bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 overflow-hidden group shadow-sm dark:shadow-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="p-8 md:p-12 flex flex-col justify-end h-full z-10 relative">
            <Activity className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-4" />
            <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight mb-2">AI Video Form Analysis</h3>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-[45ch]">Upload up to 60 seconds of your lift. Our AI evaluates your form and provides granular, actionable feedback instantly.</p>
          </div>
          {/* Abstract background UI representing analysis */}
          <div className="absolute top-8 right-8 w-64 h-64 border-[0.5px] border-zinc-300 dark:border-zinc-800 rounded-full flex items-center justify-center opacity-30 select-none">
             <div className="w-48 h-48 border border-blue-500/20 rounded-full" />
             <div className="absolute w-full h-[1px] bg-blue-500/50 rotate-45" />
             <div className="absolute w-[1px] h-full bg-blue-500/50 rotate-45" />
          </div>
        </FadeInItem>

        {/* Bento Item 2: Tall Checkpoint Card */}
        <FadeInItem className="lg:row-span-2 relative rounded-[2rem] bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col p-8 group shadow-sm dark:shadow-none">
          <div className="flex-1 w-full flex flex-col gap-3 mt-8">
            {['Hip Hinge Initiation', 'Bar Path Alignment', 'Spine Position', 'Eccentric Control'].map((item, i) => (
              <div key={i} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 rounded-2xl flex items-center gap-4">
                <Target size={18} className="text-zinc-400 dark:text-zinc-500" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 z-10">
            <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight mb-2">Biomechanical Scoring</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">Score from 0-100 across specific checkpoints—not just generic feedback.</p>
          </div>
        </FadeInItem>

        {/* Bento Item 3: Vector Embeddings */}
        <FadeInItem className="relative rounded-[2rem] bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 overflow-hidden p-8 group shadow-sm dark:shadow-none">
           <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
           <div className="flex flex-col h-full justify-between">
              <Sparkles className="w-8 h-8 text-purple-500 dark:text-purple-400" />
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight mb-2">Gold Standard Mapping</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Your form is mathematically compared to vector-embedded perfect lifts using Gemini 2.5 Pro.</p>
              </div>
           </div>
        </FadeInItem>

        {/* Bento Item 4: Gamified Aura */}
        <FadeInItem className="relative rounded-[2rem] bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 overflow-hidden p-8 group shadow-sm dark:shadow-none">
           <div className="absolute inset-0 bg-gradient-to-bl from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
           <div className="flex flex-col h-full justify-between">
              <ShieldAlert className="w-8 h-8 text-green-500 dark:text-green-400" />
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight mb-2">Gamified "Aura"</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Turn your biomechanics into a visual radar chart. See instantly where your lift is weakest.</p>
              </div>
           </div>
        </FadeInItem>
      </FadeInStagger>
    </section>
  );
}
