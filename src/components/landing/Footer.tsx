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

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full justify-center">
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
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">TikTok</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
