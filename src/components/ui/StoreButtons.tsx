import React from 'react';
import Link from 'next/link';

type StoreButtonProps = {
  className?: string;
  size?: 'sm' | 'md';
};

export function AppleStoreButton({ className, size = 'md' }: StoreButtonProps) {
  const isSm = size === 'sm';
  return (
    <Link 
      href="/onboarding" 
      className={`flex items-center ${isSm ? 'gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 w-[120px] sm:w-[135px]' : 'gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 w-[140px] sm:w-[160px]'} bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 transition-all text-white dark:text-zinc-950 rounded-xl border border-zinc-800 dark:border-zinc-200 shadow-lg justify-center ${className || ''}`}
      aria-label="Download on the App Store"
    >
      <svg viewBox="10 -10 150 190" className={`${isSm ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-6 h-6 sm:w-7 sm:h-7'} shrink-0`} fill="currentColor">
        <path d="M121.03 103.26c-.19-21.6 17.65-31.54 18.42-32.06-10.05-14.63-25.59-16.63-31.14-16.94-13.3-1.34-25.96 7.84-32.65 7.84-6.73 0-17.06-7.55-28.09-7.34-14.47.21-27.84 8.41-35.25 21.32-14.97 25.86-3.83 64.13 10.74 85.25 7.11 10.3 15.53 21.84 26.68 21.43 10.73-.42 14.88-6.91 27.88-6.91 12.96 0 16.71 6.91 27.91 6.7 11.6-.2 18.79-10.45 25.84-20.73 8.16-11.95 11.51-23.51 11.69-24.1-.25-.13-21.85-8.38-22.03-34.46zm-20.78-54.83c5.96-7.25 9.94-17.33 8.85-27.43-8.66.36-19.18 5.76-25.32 13.01-4.94 5.76-9.74 16.03-8.42 25.97 9.68.74 18.97-4.92 24.89-11.55z"/>
      </svg>
      <div className="flex flex-col items-start leading-none gap-0.5 whitespace-nowrap">
        <span className={`${isSm ? 'text-[8px] sm:text-[9px]' : 'text-[9px] sm:text-[10px]'} font-medium opacity-80`}>Download on the</span>
        <span className={`${isSm ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'} font-bold tracking-tight -mt-1`}>App Store</span>
      </div>
    </Link>
  );
}

export function GooglePlayButton({ className, size = 'md' }: StoreButtonProps) {
  const isSm = size === 'sm';
  return (
    <Link 
      href="/onboarding" 
      className={`flex items-center ${isSm ? 'gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 w-[120px] sm:w-[135px]' : 'gap-2 px-3 py-2 sm:px-4 sm:py-2.5 w-[140px] sm:w-[160px]'} bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 transition-all text-white dark:text-zinc-950 rounded-xl border border-zinc-800 dark:border-zinc-200 shadow-lg justify-center ${className || ''}`}
      aria-label="Get it on Google Play"
    >
      <svg viewBox="0 0 512 512" className={`${isSm ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'} shrink-0`}>
        <path fill="#4caf50" d="M26.4 10.3C18.6 17.6 14.5 28.1 14.5 41v430c0 12.9 4.1 23.4 11.9 30.7l1.1 1.1 242.3-242.2v-7.1L27.5 9.2l-1.1 1.1z"></path>
        <path fill="#ffeb3b" d="M363.3 351l-93.5-93.5v-3.1L363.3 161l1.3 1.1 110.8 63.6c31.6 18.2 31.6 47.8 0 66l-110.8 63.6-1.3-4.3z"></path>
        <path fill="#f44336" d="M269.8 257.5L27.5 500c9.1 9.4 24 10.6 42.1.2L364.5 352l-94.7-94.5z"></path>
        <path fill="#2196f3" d="M364.5 160L69.6 11.8C51.5 1.4 36.6 2.6 27.5 12l242.3 242.4 94.7-94.4z"></path>
      </svg>
      <div className="flex flex-col items-start leading-none gap-0.5 whitespace-nowrap">
        <span className={`${isSm ? 'text-[8px] sm:text-[9px]' : 'text-[9px] sm:text-[10px]'} font-medium opacity-80 uppercase`}>Get it on</span>
        <span className={`${isSm ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'} font-bold tracking-tight -mt-1`}>Google Play</span>
      </div>
    </Link>
  );
}