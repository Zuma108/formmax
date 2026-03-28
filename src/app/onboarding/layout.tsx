"use client";

import { SignInButton, SignUpButton, UserButton, Show } from "@clerk/nextjs";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-out">
        <div className="fixed top-0 right-0 z-[200] flex items-center gap-2 p-3">
          <SignInButton>
            <button className="px-3 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-semibold active:bg-zinc-700 transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-zinc-900 text-xs font-semibold active:bg-zinc-100 transition-colors">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <div className="fixed top-0 right-0 z-[200] p-3">
          <UserButton />
        </div>
      </Show>
      {children}
    </>
  );
}
