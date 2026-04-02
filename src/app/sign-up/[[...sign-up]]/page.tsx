import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0A0A0B] px-4">
      <SignUp
        forceRedirectUrl="/page2"
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800",
          },
        }}
      />
    </main>
  );
}
