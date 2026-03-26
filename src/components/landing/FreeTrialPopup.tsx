"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";

export function FreeTrialPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup after 7 seconds
    const timer = setTimeout(() => {
      // Check if user already dismissed it in this session (optional, but good UX)
      const hasDismissed = sessionStorage.getItem("formMax_trialPopupDismissed");
      if (!hasDismissed) {
        setIsVisible(true);
      }
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem("formMax_trialPopupDismissed", "true");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for form submission goes here
    handleClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white border border-zinc-200 shadow-2xl dark:bg-zinc-950 dark:border-zinc-800"
          >
            {/* Top glass reflection / gradient lighting */}
            <div className="absolute inset-x-0 -top-24 -z-10 h-48 bg-blue-500/10 dark:bg-blue-500/20 blur-3xl rounded-full" />
            
            <button
              onClick={handleClose}
              className="absolute right-5 top-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 sm:p-10 text-center">
              <div className="mx-auto mb-6 flex h-20 sm:h-24 items-center justify-center">
                <img src="/logo/Formax%20logo%20horizontal.png" alt="Form Max" className="h-full w-auto object-contain dark:invert" />
              </div>

              <h2 className="mb-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
                Claim your 3-day <br className="hidden sm:block" /> free trial
              </h2>
              <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
                Unlock Form Max premium features. No credit card required to start unlocking your limits.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="name@email.com"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500 transition-all"
                />
                <button
                  type="submit"
                  className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-medium text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  <span>Claim my free trial</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
