"use client";

import { Star } from "lucide-react";
import { FadeInStagger, FadeInItem } from "./Interactive";

export function Testimonials() {
  const reviews = [
    {
      name: "Paul R.",
      handle: "@power_paul",
      text: "I've been deadlifting wrong for 2 years. Form Max fixed my hip hinge in one session. My lower back has never felt better.",
      avatar: "paul.jpg"
    },
    {
      name: "Sarah Jenkins",
      handle: "@gym_girl_sarah",
      text: "The FORMAX graph is so addicting. Trying to get my squat to a 99% match! Finally a form checker that doesn't just say 'good'.",
      avatar: "sarah.jpg"
    },
    {
      name: "Marcus T.",
      handle: "@marcus_lifts",
      text: "Literally a lifesaver. Gemini caught a weird elbow flare on my bench press that my trainer missed.",
      avatar: "marcus.jpg"
    },
    {
      name: "Elena V.",
      handle: "@elena_fit",
      text: "10/10 app. The dark mode is super clean and the UI actually feels like it belongs in 2026. Perfect for tracking my prep.",
      avatar: "elena.jpg"
    },
    {
      name: "David Chen",
      handle: "@davidc_strong",
      text: "Best $0 I ever spent. Uploaded my 405lb squat, got roasted by the AI on my depth, hit it purely out of spite next set. W.",
      avatar: "david.jpg"
    },
    {
      name: "Jessie",
      handle: "@jess_squats",
      text: "UI is ridiculously fast. No loading screens, it just works. The vector matching thing is black magic.",
      avatar: "jessie.jpg"
    }
  ];

  return (
    <section id="testimonials" className="py-32 w-full">
      <div className="flex flex-col items-center text-center gap-4 mb-20 max-w-[60ch] mx-auto">
        <h2 className="text-4xl md:text-5xl font-sans tracking-tight text-zinc-900 dark:text-white">
          Real Lifters. <span className="text-zinc-500 dark:text-zinc-600">Real Results.</span>
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
          Join thousands of lifters who stopped guessing and started progressing.
        </p>
      </div>

      <FadeInStagger className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {reviews.map((review, i) => (
          <FadeInItem key={i} className="break-inside-avoid">
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 p-8 rounded-3xl flex flex-col gap-6 shadow-sm dark:shadow-none">
              <div className="flex gap-1 text-orange-400">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} fill="currentColor" />)}
              </div>
              <p className="text-zinc-800 dark:text-zinc-300 text-base leading-relaxed">"{review.text}"</p>
              
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-white/5">
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
                   <img src={`https://picsum.photos/seed/${review.handle}/100/100`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">{review.name}</span>
                  <span className="text-xs text-zinc-500 font-mono">{review.handle}</span>
                </div>
              </div>
            </div>
          </FadeInItem>
        ))}
      </FadeInStagger>
    </section>
  );
}
