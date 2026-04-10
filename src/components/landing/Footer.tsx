import { Star } from "lucide-react";
import { AppleStoreButton, GooglePlayButton } from "@/components/ui/StoreButtons";

export function Footer() {
  return (
    <footer className="w-full bg-zinc-100 dark:bg-[#0A0A0B] border-t border-zinc-200 dark:border-white/5 pt-24 pb-12 mt-12 flex flex-col items-center">
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col items-center">
        
        <div className="flex flex-col items-center text-center gap-6 mb-24">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="inline-flex items-center px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <span className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">Don't Leave Gains On The Table</span>
            </div>
            <div className="flex gap-1 items-center bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-4 py-1.5 rounded-full shadow-sm dark:shadow-none">
               <div className="flex gap-1 mr-2 text-orange-400">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={12} fill="currentColor" />)}
               </div>
               <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 tracking-widest uppercase">Over 10,000 5-Star Checks</span>
            </div>
          </div>

          <h2 className="text-4xl md:text-6xl font-sans tracking-tighter text-zinc-900 dark:text-white">
            Ready to Maximize <br/>Your Form?
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Join thousands of lifters treating their bodies right with AI precision.
          </p>

          <div className="flex flex-row items-center gap-4 mt-4 w-full justify-center">
            <AppleStoreButton />
            <GooglePlayButton />
          </div>
        </div>

        <div className="w-full h-px bg-zinc-300 dark:bg-white/5 mb-12"></div>

        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo/Formax%20logo%20horizontal.png" alt="Form Max Logo" className="h-8 md:h-10 w-auto object-contain dark:invert" />
            <span className="font-semibold text-sm tracking-tight text-zinc-600 dark:text-zinc-500">&copy; 2026</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-500 font-medium">
            <a href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <a href="#" className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Twitter
            </a>
            <a href="#" className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </a>
            <a href="#" className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
              </svg>
              TikTok
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
