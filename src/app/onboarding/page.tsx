"use client";

import { useRouter } from "next/navigation";
import Onboarding from "@/components/Onboarding";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0B]">
      <Onboarding onComplete={() => router.push('/dashboard')} />
    </main>
  );
}