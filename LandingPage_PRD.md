# Product Requirements Document (PRD): Form Max Landing Page

## 1. Objective
To design and develop a high-converting landing page for **Form Max**, an elite AI-powered strength and conditioning coach application. The landing page must effectively translate complex, highly technical AI form analysis into clear, engaging, and consumer-friendly value propositions heavily inspired by high-converting fitness apps (like Cal AI).

## 2. Target Audience
*   **Novice Lifters:** Looking to avoid injury and learn the "gold standard" form for major lifts (Squat, Deadlift, Bench Press).
*   **Intermediate/Advanced Lifters:** Seeking granular, biomechanical feedback to break through plateaus and optimize performance.
*   **Fitness Enthusiasts:** Motivated by gamification (the "Aura" score) and data-driven insights.

## 3. Landing Page Structure & Requirements

The landing page will be structured as a funnel, moving users from a high-impact hook to undeniable social proof, and finally into a seamless onboarding pipeline.

### Section 1: Hero Section (The Hook)
*   **Headline:** "Perfect Your Form. Prevent Injuries. Optimize Your Lifts."
*   **Sub-headline:** "Upload a video of your lift and let Google Gemini 2.5 Pro act as your elite strength coach—analyzing your biomechanics against a perfect 'Gold Standard' in seconds."
*   **Visual Payload:** A dynamic dual-screen video/GIF. On the left, a user lifting; on the right, the Form Max overlay showing real-time biomechanical checkpoints and their "Aura" graph generating.
*   **Social Proof Blurb:** "Loved by 10k+ lifters with a ⭐ 4.9 rating." (Inspired by Cal AI).
*   **Primary CTA:** `Analyze My Form Free` -> Directs to the premium Onboarding flow `components/Onboarding.tsx`.

### Section 2: Influencer / Social Proof (Authority Building)
*   **Headline:** "Used by Elite Powerlifters and Coaches 👀"
*   **Content:** A horizontal, auto-scrolling carousel of short video reels or testimonials from fitness influencers using the app to check their squats or deadlifts.
*   **Goal:** Instantly build trust by associating the app with recognizable figures in the fitness space.

### Section 3: Core Features (What does Form Max include?)
Highlight the key technical features of the app translated into user benefits, accompanied by sleek app UI mockups.
*   **AI Video Form Analysis:** "Upload up to 60 seconds of your lift. Our AI evaluates your form and provides granular, actionable feedback instantly." (Show UI of `api/compare_workout/route.ts` response).
*   **Biomechanical Checkpoint Scoring:** "We don't just say 'good job.' We score you from 0-100 across specific checkpoints like Hip Hinge Initiation, Bar Path, and Spine Position."
*   **Gold Standard Comparison:** "Your form is analyzed mathematically against the vector-embedded 'Gold Standard' reference lifts." (Show a visual of the user's form vs. the standard).
*   **Gamified 'Aura' Visualizations:** "Turn your biomechanics into a visual 'Aura' radar chart. Instantly see where your lift is weakest and track your progression." (Showcase the `AuraGraph.tsx` component).

### Section 4: Value Proposition (Why choose Form Max?)
Focus on the emotional and physical benefits.
*   **Never Guess Again:** Stop wondering if you are doing it right. Get instant, elite-level feedback.
*   **Bulletproof Your Joints (Injury Prevention):** The AI specifically flags common faults (e.g., lumbar flexion, butt wink) and provides an "Injury Risk" assessment.
*   **Actionable Cues:** Get a "Top Priority" cue for your next set. No overwhelming data—just the one thing you need to fix right now.

### Section 5: The "Dark Mode" / Premium Vibe Feature Spotlight
*   **Headline:** "Sleek, Fast, and Built for the Gym."
*   **Content:** Showcase the dark mode, high-end visual design (using Tailwind CSS v4 and Framer Motion) that makes the app easy to use between sets without blinding the user.

### Section 6: User Testimonials (Community Proof)
*   **Headline:** "Real Lifters. Real Results."
*   **Content:** A masonry grid of user reviews, tweets, and Instagram comments.
    *   *Example:* "'I've been deadlifting wrong for 2 years. Form Max fixed my hip hinge in one session. My lower back has never felt better.' - @power_paul"
    *   *Example:* "'The Aura graph is so addicting. Trying to get my squat to a 99% match!' - @gym_girl_sarah"

### Section 7: Final CTA & App Store Ratings
*   **Headline:** "Ready to Maximize Your Form?"
*   **Sub-headline:** Join thousands of lifters treating their bodies right.
*   **Visual:** "Over 10,000 5-star form checks."
*   **CTA Buttons:** "Start Web App" (Link to Onboarding).
*   **Footer:** Links to Privacy Policy, Terms of Service, Contact, and Socials.

## 4. Conversion Strategy & Psychology
*   **Frictionless Entry:** The CTA leads directly into the fast, Framer-Motion-powered Onboarding questionnaire to get users invested before asking for an account creation.
*   **Visual Proof:** Fitness is visual. The landing page must heavily feature the `AuraGraph` and form-tracking overlays. Users need to *see* the AI working to believe it.
*   **Fear & Desire:** The copy balances the fear of injury ("Bulletproof Your Joints", "Injury Risk Rating") with the desire for aesthetic and strength progression ("Optimize Your Lifts").
*   **Credibility via Association:** The influencer carousel mirrors the highly successful strategy used by apps like Cal AI, proving that serious fitness creators trust the tool.