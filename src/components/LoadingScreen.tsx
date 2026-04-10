"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const VERTEBRAE_COUNT = 5;

const STATUS_MESSAGES = [
  "Calibrating your experience",
  "Loading your preferences",
  "Preparing your workout space",
  "Syncing your profile",
  "Almost ready",
];

export default function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0b] overflow-hidden">
      {/* Radial glow behind logo */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 320,
          height: 320,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Expanding pulse rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-white/[0.04]"
          style={{ width: 200, height: 200 }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 2.2], opacity: [0.15, 0] }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            delay: i * 1.15,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Logo */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >
        <motion.img
          src="/logo/Formax logo.png"
          alt="FORMAX"
          className="w-36 h-36 object-contain"
          style={{ filter: "brightness(0) invert(1)" }}
          animate={{
            filter: [
              "brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.15))",
              "brightness(0) invert(1) drop-shadow(0 0 24px rgba(255,255,255,0.3))",
              "brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.15))",
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Spine vertebrae loader */}
      <motion.div
        className="relative z-10 flex gap-1.5 mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {Array.from({ length: VERTEBRAE_COUNT }).map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full bg-white"
            style={{ width: 6, height: 6 }}
            animate={{
              opacity: [0.15, 1, 0.15],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Status message */}
      <motion.div
        className="relative z-10 mt-8 h-6 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <motion.p
          key={msgIndex}
          className="text-sm font-medium text-white/40 tracking-wide"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4 }}
        >
          {STATUS_MESSAGES[msgIndex]}
        </motion.p>
      </motion.div>

      {/* Bottom progress bar */}
      <motion.div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-white/[0.06] overflow-hidden"
        style={{ width: 120 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div
          className="h-full rounded-full bg-white/30"
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ width: "40%" }}
        />
      </motion.div>
    </div>
  );
}
