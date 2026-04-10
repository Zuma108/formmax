import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { AppleStoreButton, GooglePlayButton } from "@/components/ui/StoreButtons";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Form Max",
  description: "How Form Max collects, uses, and protects your personal data — including our commitment to never storing your workout videos.",
};

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 dark:bg-[#0A0A0B] overflow-hidden">
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      {/* Nav */}
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12">
        <nav className="w-full flex flex-col md:flex-row items-center justify-between pt-2 pb-4 md:pt-4 md:pb-4 gap-4 md:gap-0 border-b border-transparent">
          <Link href="/" className="flex items-center justify-center md:justify-start w-full md:w-auto">
            <img
              src="/logo/Formax%20logo%20horizontal.png"
              alt="Form Max Logo"
              className="h-12 sm:h-[64px] w-auto object-contain dark:invert origin-center md:origin-left -ml-2"
            />
          </Link>
          <div className="flex items-center justify-center md:justify-end gap-2 sm:gap-3 w-full md:w-auto">
            <AppleStoreButton size="sm" />
            <GooglePlayButton size="sm" />
          </div>
        </nav>
      </div>

      {/* Hero */}
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 pt-16 pb-8">
        <div className="flex flex-col gap-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit">
            <ShieldCheck size={13} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">Legal</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-sans tracking-tighter leading-[1.05] text-zinc-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">
            Last updated: April 2, 2026
          </p>
          <div className="flex items-center gap-3 mt-2 px-5 py-4 bg-zinc-900 dark:bg-white/5 border border-zinc-800 dark:border-white/10 rounded-2xl w-fit">
            <ShieldCheck size={18} className="text-blue-400 shrink-0" />
            <p className="text-zinc-300 dark:text-zinc-300 text-sm font-medium leading-relaxed">
              We <span className="text-white font-bold">never store, retain, or share</span> your workout videos. Videos are analyzed in-memory and permanently deleted immediately after.
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="w-full h-px bg-zinc-200 dark:bg-white/5" />
      </div>

      {/* Content */}
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12 lg:gap-20 items-start">

          {/* Sticky TOC — desktop only */}
          <aside className="hidden lg:flex flex-col gap-2 sticky top-12">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Contents</p>
            {[
              ["#definitions", "1. Definitions"],
              ["#data-collected", "2. Data We Collect"],
              ["#video-policy", "3. Workout Videos"],
              ["#how-we-use", "4. How We Use Data"],
              ["#sharing", "5. Sharing"],
              ["#retention", "6. Retention"],
              ["#your-rights", "7. Your Rights"],
              ["#security", "8. Security"],
              ["#children", "9. Children"],
              ["#changes", "10. Changes"],
              ["#contact", "11. Contact"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors py-1 border-l-2 border-transparent hover:border-zinc-400 dark:hover:border-zinc-500 pl-3 -ml-3">
                {label}
              </a>
            ))}
          </aside>

          {/* Main content */}
          <article className="prose-zinc max-w-none">
            <div className="flex flex-col gap-14">

              <Section id="definitions" title="1. Interpretation and Definitions">
                <p>This Privacy Policy describes how <strong>Form Max</strong> collects, uses, processes, shares, and protects Your information when You use the Form Max mobile application, website, and related services (collectively, the "Service"). By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.</p>
                <DefinitionList items={[
                  ["Account", "The unique profile created for You to access the Service."],
                  ["Application", "The mobile application titled \"Form Max \u2013 AI Form Coach\"."],
                  ["Company / We / Us / Our", "Form Max and its operators."],
                  ["Device", "Any device used to access the Service, including smartphones and tablets."],
                  ["Personal Data", "Information that identifies or can reasonably be linked to an individual."],
                  ["Health & Fitness Data", "Information You provide relating to Your physical characteristics, training history, goals, or activity — including body weight, lifting experience, injury history, focus areas, and training preferences."],
                  ["Workout Video", "Any video content You record or upload through the Application for form analysis purposes."],
                  ["Analysis Data", "The AI-generated output produced from processing a Workout Video, including biomechanics scores, checkpoint evaluations, injury risk assessments, and coaching feedback."],
                  ["Usage Data", "Data collected automatically through use of the Service, including device information, activity logs, and analytics data."],
                  ["You", "The individual using the Service."],
                ]} />
              </Section>

              <Section id="data-collected" title="2. Types of Data We Collect">
                <SubSection title="2.1 Personal Data You Provide">
                  <ul>
                    <li>First and last name</li>
                    <li>Email address</li>
                    <li>Optional profile details provided during onboarding or account setup</li>
                  </ul>
                </SubSection>
                <SubSection title="2.2 Health & Fitness Data">
                  <p>To provide form analysis and personalized coaching, We collect:</p>
                  <ul>
                    <li>Body weight and preferred unit of measurement</li>
                    <li>Biological sex (used for biomechanical estimation)</li>
                    <li>Lifting experience level and training environment</li>
                    <li>Focus areas, preferred exercises, and known weaknesses</li>
                    <li>Current or past injuries</li>
                    <li>Primary fitness goal and AI coaching preferences</li>
                  </ul>
                  <p>You decide which health information to provide. The Service cannot function fully without basic fitness data entered during onboarding.</p>
                </SubSection>
                <SubSection title="2.3 Analysis Data">
                  <p>We generate and may retain the following output from analyzing Your Workout Videos:</p>
                  <ul>
                    <li>Overall form score and checkpoint-level scores (e.g., bar path, spine position, lockout)</li>
                    <li>Injury risk classification</li>
                    <li>Detected rep count and consistency summary</li>
                    <li>AI coaching feedback and top priority cues</li>
                  </ul>
                  <p>Analysis Data is associated with Your Account to enable progress tracking and session history.</p>
                </SubSection>
                <SubSection title="2.4 Usage Data">
                  <p>We automatically collect device type, OS version, IP address (for security and rate limiting), timestamps, crash data, and performance analytics to secure and improve the Service.</p>
                </SubSection>
              </Section>

              <Section id="video-policy" title="3. Workout Videos — Our Commitment">
                <div className="bg-zinc-900 dark:bg-white/5 border border-zinc-700 dark:border-white/10 rounded-2xl p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={20} className="text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-zinc-200 dark:text-zinc-200 text-sm font-semibold leading-relaxed">
                      Workout Videos are never stored, archived, indexed, or associated with Your identity.
                    </p>
                  </div>
                </div>
                <p>Given the sensitive nature of video content depicting individuals in physical activity, We are committed to the following binding practices:</p>
                <ol>
                  <li><strong>No storage.</strong> Workout Videos are never written to disk, object storage, or any database by Form Max.</li>
                  <li><strong>No retention.</strong> Videos exist only for the duration of the AI processing pipeline (typically 5–30 seconds) and are discarded immediately thereafter.</li>
                  <li><strong>No training.</strong> Workout Videos are never used to train, fine-tune, or evaluate AI or machine learning models.</li>
                  <li><strong>No sharing.</strong> Workout Videos are never shared with, sold to, or disclosed to any third party — other than the transient API call to Google Gemini AI required to produce Your analysis results.</li>
                  <li><strong>No profiling.</strong> We do not use video content to identify, profile, monitor, or track individuals.</li>
                </ol>
                <p>The only output We retain from a Workout Video is the structured Analysis Data (scores and feedback text) returned to You.</p>
              </Section>

              <Section id="how-we-use" title="4. How We Use Your Data">
                <SubSection title="4.1 To Provide and Improve the Service">
                  <ul>
                    <li>AI-powered biomechanics analysis of Your lifting form</li>
                    <li>Generating CheckPoint scores, injury risk assessments, and coaching feedback</li>
                    <li>Progress tracking and session history</li>
                    <li>Personalization and recommendations based on Your fitness profile</li>
                    <li>Account management, service stability, and debugging</li>
                  </ul>
                </SubSection>
                <SubSection title="4.2 Communications">
                  <p>We may contact You about service updates, new features, analysis notifications, and customer support responses.</p>
                </SubSection>
                <SubSection title="4.3 Marketing (Optional)">
                  <p>We may send You promotional communications. You may opt out at any time via in-app settings or by contacting Us.</p>
                </SubSection>
                <SubSection title="4.4 Legal and Compliance">
                  <p>We may use Your data to detect or prevent fraud, comply with legal obligations, and protect Our rights and the rights of other users.</p>
                </SubSection>
              </Section>

              <Section id="sharing" title="5. How We Share Personal Data">
                <SubSection title="5.1 AI Processing Services">
                  <p>Workout Videos are transmitted to Google's Gemini AI API solely to generate Analysis Data. This transmission is transient — no video data is retained by Us or Google beyond the duration of the API call, pursuant to Google's API data usage terms.</p>
                </SubSection>
                <SubSection title="5.2 Service Providers">
                  <p>With vendors who support the Service: cloud hosting, analytics providers, authentication services (Clerk), and customer support tools. All service providers are contractually bound to protect Your data.</p>
                </SubSection>
                <SubSection title="5.3 Legal Compliance">
                  <p>With law enforcement or regulators when legally required.</p>
                </SubSection>
                <SubSection title="5.4 Aggregated or Anonymized Data">
                  <p>We may share aggregated, non-identifiable data for analytics or research purposes. <strong>We do not sell Your Personal Data.</strong></p>
                </SubSection>
              </Section>

              <Section id="retention" title="6. Retention of Data">
                <ul>
                  <li><strong>Personal Data</strong> — retained while Your Account is active or as legally required</li>
                  <li><strong>Health & Fitness Data</strong> — until You delete it or close Your Account</li>
                  <li><strong>Analysis Data</strong> — until You delete individual sessions or close Your Account</li>
                  <li><strong>Workout Videos</strong> — <strong>not retained; permanently deleted immediately after analysis</strong></li>
                  <li><strong>Usage Data</strong> — shorter retention period unless needed for security or compliance</li>
                </ul>
              </Section>

              <Section id="your-rights" title="7. Your Privacy Rights">
                <p>Depending on Your jurisdiction, You may have rights to access, correct, delete, export, or restrict processing of Your Personal Data. GDPR-covered users may also withdraw consent or object to processing based on legitimate interests.</p>
                <p>You may exercise these rights through <strong>Profile → Personal Details</strong> in the Application, or by contacting Us at the address below.</p>
                <SubSection title="7.1 Deleting Your Account">
                  <p>You may request deletion of Your Account, health and fitness profile, Analysis Data, and all associated Personal Data via <strong>Profile → Personal Details → Delete Account</strong>, or by contacting Us directly. Some data may persist for a limited period where legally required.</p>
                </SubSection>
              </Section>

              <Section id="security" title="8. Security">
                <p>We use administrative, technical, and physical safeguards including encrypted data transmission (TLS/HTTPS), access-controlled server infrastructure, immediate deletion of Workout Videos post-analysis, and API key authentication for all external service calls. However, no online system is entirely secure.</p>
                <div className="mt-4 px-5 py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <p className="text-amber-700 dark:text-amber-400 text-sm font-medium">
                    <strong>Health Disclaimer:</strong> Form Max provides general fitness guidance based on AI analysis. It is not a substitute for professional medical advice. Always consult a qualified healthcare or fitness professional before modifying your exercise program.
                  </p>
                </div>
              </Section>

              <Section id="children" title="9. Children's Privacy">
                <p>The Service is not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13. If You believe a child has provided Us with Personal Data, please contact Us and We will promptly delete it.</p>
              </Section>

              <Section id="changes" title="10. Changes to This Privacy Policy">
                <p>We may update this Policy from time to time. Updates become effective when posted. We will notify You of material changes by email or through a notice within the Application. Continued use of the Service after changes are posted constitutes Your acceptance of the updated Policy.</p>
              </Section>

              <Section id="contact" title="11. Contact Us">
                <p>If You have questions, concerns, or requests related to this Privacy Policy:</p>
                <ul>
                  <li><strong>Email:</strong> <a href="mailto:support@formmax.app" className="text-blue-600 dark:text-blue-400 hover:underline">support@formmax.app</a></li>
                </ul>
              </Section>

            </div>
          </article>
        </div>
      </div>

      <Footer />
    </main>
  );
}

/* ─── Local layout components ─── */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="text-2xl md:text-3xl font-sans tracking-tighter text-zinc-900 dark:text-white mb-6">
        {title}
      </h2>
      <div className="flex flex-col gap-4 text-zinc-600 dark:text-zinc-400 text-[15px] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[15px] font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">{title}</h3>
      <div className="flex flex-col gap-3 pl-0">{children}</div>
    </div>
  );
}

function DefinitionList({ items }: { items: [string, string][] }) {
  return (
    <div className="flex flex-col divide-y divide-zinc-100 dark:divide-white/5 border border-zinc-100 dark:border-white/5 rounded-2xl overflow-hidden mt-4">
      {items.map(([term, def]) => (
        <div key={term} className="flex gap-4 px-5 py-4 bg-white dark:bg-white/[0.02]">
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 w-48 shrink-0">{term}</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{def}</span>
        </div>
      ))}
    </div>
  );
}
