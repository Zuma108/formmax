"use client";

import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import FormaxGraph from "@/components/AuraGraph";
import { AppleStoreButton, GooglePlayButton } from "@/components/ui/StoreButtons";

export function HeroSection() {
  const dummyFormaxData = [
    { subject: 'Hip Hinge', FORMAX: 70, GoldStandard: 90, fullMark: 100 },
    { subject: 'Bar Path', FORMAX: 85, GoldStandard: 95, fullMark: 100 },
    { subject: 'Spine Pos', FORMAX: 60, GoldStandard: 100, fullMark: 100 },
    { subject: 'Lockout', FORMAX: 90, GoldStandard: 90, fullMark: 100 },
    { subject: 'Pacing', FORMAX: 80, GoldStandard: 85, fullMark: 100 },
    { subject: 'Grip', FORMAX: 95, GoldStandard: 95, fullMark: 100 },
  ];

  return (
    <section className="relative pt-0 pb-32 lg:pt-0 lg:pb-40 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-start -mt-2">
      
      {/* Left Column: Text & CTA */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-8 max-w-[65ch] lg:max-w-none"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <span className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">Don't Leave Gains On The Table</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#0A0A0B] bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                   <img src={`https://picsum.photos/seed/lifter${i}/100/100`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-orange-400 text-orange-400" />
              <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium tracking-tight ml-1">10k+ lifters</span>
            </div>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-sans tracking-tighter leading-[1.05] text-zinc-900 dark:text-white">
          Meet Form Max. <br className="hidden md:block"/>
          <span className="text-zinc-400 dark:text-zinc-500">Perfect your form</span> <br className="hidden md:block"/>
          with just a video.
        </h1>

        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal max-w-[50ch]">
          Meet Form Max, the AI-powered app for perfecting your form. Upload a video of your lift, analyze your biomechanics, and get instant coaching feedback to optimize every rep.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full justify-start">
          <AppleStoreButton />
          <GooglePlayButton />
        </div>
      </motion.div>

      {/* Right Column: Visual Payload (Asymmetric & Cinematic) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center"
      >
        {/* Glow behind graph */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-zinc-500/15 blur-[100px] pointer-events-none rounded-full" />
        
        {/* Container for the Hero Image */}
        <div className="relative w-full max-w-md p-4 flex flex-col items-center justify-center">
          <div className="relative w-full aspect-[4/5] flex items-center justify-center">
            <img 
              src="/assets/hero-section-image.webp" 
              alt="Live Form Analysis" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
