import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { CoreFeatures } from "@/components/landing/CoreFeatures";
import { ValueProp } from "@/components/landing/ValueProp";
import { Testimonials } from "@/components/landing/Testimonials";
import { Footer } from "@/components/landing/Footer";
import { FreeTrialPopup } from "@/components/landing/FreeTrialPopup";

import { AppleStoreButton, GooglePlayButton } from "@/components/ui/StoreButtons";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between pb-24 overflow-hidden bg-zinc-50 dark:bg-[#0A0A0B]">
      {/* 
        High-End UI Rule: No center bias Hero. Use asymmetric.
        No pure black, we use #0A0A0B (Zinc 950).
        Background will have subtle noise or mesh later if we want.
      */}
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] dark:opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 pt-0 md:pt-2">
        <Nav />
        <HeroSection />
        <SocialProof />
        <CoreFeatures />
        <ValueProp />
        <Testimonials />
      </div>
      
      <Footer />
      <FreeTrialPopup />
    </main>
  );
}

function Nav() {
  return (
    <nav className="w-full flex flex-col md:flex-row items-center justify-between pt-2 pb-4 md:pt-4 md:pb-4 gap-4 md:gap-0 border-b border-transparent">
      <div className="flex items-center justify-center md:justify-start w-full md:w-auto">
        <img src="/logo/Formax%20logo.png" alt="Form Max Logo" className="h-16 sm:h-[84px] w-auto object-contain dark:invert origin-center md:origin-left -ml-2" />
      </div>
      <div className="flex items-center justify-center md:justify-end gap-6 text-sm font-medium w-full md:w-auto">
        <a href="#features" className="hidden lg:block text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">Features</a>
        <a href="#testimonials" className="hidden lg:block text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">Testimonials</a>
        <div className="flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
          <AppleStoreButton size="sm" />
          <GooglePlayButton size="sm" />
        </div>
      </div>
    </nav>
  );
}
