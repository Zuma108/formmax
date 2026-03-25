"use client";

import { motion } from "framer-motion";

export function SocialProof() {
  const influencers = [
    { name: "Jeremiah Jones", handle: "@jeremiah.lifts", quote: "Insane precision." },
    { name: "Kadin Kerns", handle: "@kadin_strength", quote: "Fixed my squat wink." },
    { name: "Dawson Gibbs", handle: "@dawson.power", quote: "Literally a coach in your pocket." },
    { name: "Hussein Farhat", handle: "@hussein_athletics", quote: "The Aura tree is addicting." },
    { name: "Alex Eubank", handle: "@alex_eubank", quote: "Must-have for serious lifters." },
  ];

  return (
    <section className="w-full py-12 border-t border-b border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col gap-6">
      <div className="flex w-full items-center justify-center gap-2 text-zinc-500 text-sm font-mono tracking-widest uppercase">
        <span className="w-12 h-px bg-zinc-300 dark:bg-zinc-800"></span>
        Used by Elite Powerlifters & Coaches 👀
        <span className="w-12 h-px bg-zinc-300 dark:bg-zinc-800"></span>
      </div>

      <div className="relative w-full flex overflow-x-hidden">
        {/* Cinematic fade on edges */}
        <div className="absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r from-zinc-50 dark:from-[#0A0A0B] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-zinc-50 dark:from-[#0A0A0B] to-transparent z-10 pointer-events-none" />

        <motion.div 
          className="flex whitespace-nowrap gap-8 items-center py-4"
          animate={{ x: [0, -1000] }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            duration: 30,
            ease: "linear",
          }}
        >
          {/* Double array for seamless looping */}
          {[...influencers, ...influencers, ...influencers].map((influencer, i) => (
            <div key={i} className="flex items-center gap-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 px-6 py-3 rounded-full shrink-0 shadow-sm dark:shadow-none">
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden border border-white dark:border-white/10 shrink-0">
                 <img src={`https://picsum.photos/seed/${influencer.handle}/100/100`} alt={influencer.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-900 dark:text-white text-sm font-medium leading-none">{influencer.name}</span>
                <span className="text-zinc-500 text-xs mt-1">"{influencer.quote}"</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
