// Exercise-specific prompt templates for Gemini 2.5 Pro / Flash
// Each prompt contains biomechanical checkpoints with GOOD and BAD form descriptors

export interface ExerciseConfig {
  name: string;
  checkpoints: string[];
  commonFaults: string[];
  /** Per-checkpoint descriptions of what GOOD form looks like */
  goodFormDescriptors: Record<string, string>;
  /** Per-checkpoint descriptions of what BAD/dangerous form looks like */
  badFormDescriptors: Record<string, string>;
  /** Visual patterns that indicate injury risk, with severity */
  injuryRiskPatterns: { pattern: string; severity: "caution" | "stop_immediately" }[];
}

/** User profile context for personalized prompts */
export interface UserContext {
  experience?: string | null;
  strictness?: string | null;
  injuries?: string[] | null;
  weaknesses?: string[] | null;
  focus_areas?: string[] | null;
  gender?: string | null;
  body_weight?: number | null;
  weight_unit?: string | null;
}

function buildUserContextBlock(ctx?: UserContext): string {
  if (!ctx) return '';
  const lines: string[] = [];
  lines.push('\nATHLETE PROFILE (use this to personalize your analysis):');
  if (ctx.experience) lines.push(`- Experience Level: ${ctx.experience}`);
  if (ctx.gender) lines.push(`- Biological Sex: ${ctx.gender}`);
  if (ctx.body_weight) lines.push(`- Body Weight: ${ctx.body_weight} ${ctx.weight_unit ?? 'kg'}`);
  if (ctx.strictness) {
    const tone = ctx.strictness === 'Strict' ? 'Be highly critical. Flag every deviation, no matter how small.'
      : ctx.strictness === 'Hype Man' ? 'Be encouraging and positive. Focus on what they did well while gently noting improvements.'
      : 'Be balanced — acknowledge strengths and clearly flag areas to improve.';
    lines.push(`- Coaching Style: ${ctx.strictness} — ${tone}`);
  }
  if (ctx.injuries?.length && !ctx.injuries.includes('None')) {
    lines.push(`- KNOWN INJURIES/LIMITATIONS: ${ctx.injuries.join(', ')} — Pay EXTRA attention to these areas. Flag ANY movement pattern that could aggravate these joints.`);
  }
  if (ctx.weaknesses?.length) {
    lines.push(`- KNOWN WEAKNESSES: ${ctx.weaknesses.join(', ')} — Actively check for these specific issues and provide targeted cues if detected.`);
  }
  if (ctx.focus_areas?.length) {
    lines.push(`- FOCUS AREAS: ${ctx.focus_areas.join(', ')} — Prioritize analysis of these areas and give more detailed feedback on them.`);
  }
  return lines.length > 1 ? lines.join('\n') + '\n' : '';
}

/** Build the full analysis prompt from an ExerciseConfig */
export function buildAnalysisPrompt(config: ExerciseConfig, userCtx?: UserContext): string {
  const checkpointLines = config.checkpoints
    .map((cp, i) => {
      const good = config.goodFormDescriptors[cp] ?? "";
      const bad = config.badFormDescriptors[cp] ?? "";
      return `${i + 1}. ${cp}
   GOOD FORM: ${good}
   BAD FORM (red flags): ${bad}`;
    })
    .join("\n");

  const injuryLines = config.injuryRiskPatterns
    .map((p) => `- [${p.severity.toUpperCase()}] ${p.pattern}`)
    .join("\n");

  return `You are an elite strength & conditioning coach with 20+ years of experience analyzing lifting form via video. You are analyzing a ${config.name.toUpperCase()} video clip.
${buildUserContextBlock(userCtx)}
ANALYSIS METHOD — For each checkpoint you MUST:
1. DESCRIBE exactly what you observe in the video (joint angles, bar position, body segments).
2. COMPARE your observation against both the GOOD FORM and BAD FORM descriptions below.
3. SCORE 0-100 based on how close the lifter is to GOOD form vs BAD form.
4. FLAG any bad-form red flags you detected.

CHECKPOINTS:
${checkpointLines}

INJURY RISK PATTERNS — Flag these if observed:
${injuryLines}

SCORING GUIDE:
- 90-100: Textbook form, competition-ready. Matches GOOD FORM description closely.
- 75-89: Solid form with minor technical flaws. Mostly GOOD, slight deviations.
- 60-74: Noticeable form issues. Some BAD FORM red flags appearing.
- 40-59: Significant form breakdown. Multiple BAD FORM red flags. Injury risk.
- 0-39: Dangerous form matching BAD FORM descriptions. Should stop and relearn.

Return ONLY valid JSON — no markdown, no code fences, no explanation:
{
  "checkpoints": [
    { "name": "Checkpoint Name", "score": 75, "feedback": "OBSERVED: [what you see]. COMPARED: [good vs bad]. Specific cue to improve.", "observed_details": "Detailed visual description of what the lifter did" }
  ],
  "overall_score": 72,
  "top_priority": "The single most important thing to fix. Be specific about body position and correction.",
  "positive": "What the lifter did well. Reference specific checkpoints.",
  "injury_risk": "low",
  "bad_form_detected": false,
  "bad_form_flags": []
}`;
}

export const EXERCISES: Record<string, ExerciseConfig> = {
  deadlift: {
    name: "Conventional Deadlift",
    checkpoints: [
      "Setup & Grip",
      "Hip Hinge Initiation",
      "Bar Path",
      "Spine Position",
      "Lockout",
      "Eccentric Control",
    ],
    commonFaults: [
      "Rounding lower back",
      "Bar drifting forward of midfoot",
      "Hips shooting up before shoulders",
      "Hyperextending at lockout",
      "Jerking the bar off the floor",
      "Not engaging lats (bar swinging away)",
    ],
    goodFormDescriptors: {
      "Setup & Grip": "Feet hip-width apart, hands just outside knees, shoulders over or slightly in front of the bar, hips in proper position (not too high, not too low). Shins near-vertical touching the bar. Mixed or double overhand grip secure.",
      "Hip Hinge Initiation": "Movement initiates with hip hinge, not by squatting down. Weight loads into posterior chain. Hamstrings and glutes engage before the bar breaks the floor. Hips and shoulders rise at the same rate initially.",
      "Bar Path": "Bar travels in a straight vertical line directly over midfoot. No forward drift at any point during the lift. Bar stays in contact with or within 1 inch of the shins and thighs throughout.",
      "Spine Position": "Neutral spine maintained throughout entire lift. No lumbar flexion (rounding) or thoracic collapse. Lats engaged keeping bar close. Chest stays open. Head in neutral alignment with spine.",
      "Lockout": "Full hip extension with glutes squeezed. Shoulders stacked directly over hips. Knees fully locked. No excessive lean-back or hyperextension. Controlled finish.",
      "Eccentric Control": "Bar lowered under control by hinging at hips first, then bending knees once bar passes them. Spine stays neutral on the way down. Controlled 2-3 second descent. Bar path mirrors the concentric.",
    },
    badFormDescriptors: {
      "Setup & Grip": "BAD: Feet too wide or too narrow. Shoulders behind the bar (sitting too low like a squat). Hips too high (stiff-leg position) or too low (squat-pull). Arms not vertical. Bar too far from shins (gap visible). Grip failing or asymmetric.",
      "Hip Hinge Initiation": "BAD: Hips shoot up first while shoulders stay low ('stripper pull'). Movement looks like a squat off the floor. Jerking/yanking the bar. Weight shifts to toes. No hip engagement — powered entirely by lower back extension.",
      "Bar Path": "BAD: Bar drifts forward away from the body at any point. Visible gap between bar and legs during the pull. Bar swings out around the knees. Erratic or S-curved bar path. Bar not over midfoot.",
      "Spine Position": "BAD: Lumbar flexion visible as rounded lower back (cat-back). Thoracic collapse where upper back caves forward. Spine rounding increases as the bar passes the knees. Loss of neutral spine under load. Head craning up or tucking chin excessively.",
      "Lockout": "BAD: Hyperextension — leaning excessively back past vertical. Incomplete lockout — hips not fully extended. Knees still bent. Shrugging the weight up at the top. Asymmetric finish with one shoulder higher.",
      "Eccentric Control": "BAD: Dropping or slamming the bar down without control. Rounding the back on the way down. Knees bending before the bar passes them (bar hits knees). Free-falling descent with no muscle engagement. Asymmetric lowering.",
    },
    injuryRiskPatterns: [
      { pattern: "Lower back rounding (lumbar flexion) visible during any phase of the pull — risk of disc herniation", severity: "stop_immediately" },
      { pattern: "Bar drifting far forward of midfoot putting excess shear force on lumbar spine", severity: "caution" },
      { pattern: "Hips shooting up while shoulders stay low — transfers all load to lower back", severity: "stop_immediately" },
      { pattern: "Hyperextending at lockout — compresses lumbar facet joints", severity: "caution" },
      { pattern: "Jerking the bar off the floor — risk of bicep tear with mixed grip", severity: "caution" },
      { pattern: "Head craning up aggressively — cervical spine compression", severity: "caution" },
    ],
  },

  squat: {
    name: "Barbell Back Squat",
    checkpoints: [
      "Stance & Setup",
      "Descent (Eccentric)",
      "Depth & Bottom Position",
      "Drive Out of the Hole",
      "Knee Tracking",
      "Lockout & Rerack",
    ],
    commonFaults: [
      "Butt wink at depth",
      "Knees caving inward (valgus)",
      "Good morning squat (hips rise first)",
      "Heels lifting off the floor",
      "Forward lean / chest dropping",
      "Uneven depth side to side",
    ],
    goodFormDescriptors: {
      "Stance & Setup": "Feet shoulder-width or slightly wider, toes turned out 15-30°. Bar positioned on upper traps (high bar) or rear delts (low bar). Core braced with big breath. Wrists neutral, elbows pulled down. Even weight distribution across full foot.",
      "Descent (Eccentric)": "Controlled descent, breaking at hips and knees simultaneously. Even tempo (2-3 seconds). Torso angle maintained consistent. Weight stays over midfoot. No rushing or dive-bombing.",
      "Depth & Bottom Position": "Hip crease reaches at or below knee level (parallel or deeper). No butt wink (posterior pelvic tilt). Torso angle appropriate for bar position. Chest stays open. Core remains braced.",
      "Drive Out of the Hole": "Drives up by pushing the floor away. Hips and shoulders rise at the same rate. No 'good morning' pattern. Maintains same torso angle as descent. Explosive intent out of the bottom.",
      "Knee Tracking": "Knees track in line with toes throughout the entire movement. No valgus (inward collapse) at any point, especially out of the hole. Knees push out to match toe angle.",
      "Lockout & Rerack": "Full hip and knee extension at the top. Glutes squeeze. Controlled rerack — walks bar back in with control. No stumbling or racking unevenly.",
    },
    badFormDescriptors: {
      "Stance & Setup": "BAD: Feet too narrow (heels inside hips) or excessively wide. Toes pointing straight ahead (blocks depth). Bar too high on neck (cervical pressure). Wrists bent back excessively. Unbraced core — no visible breath/brace before descent.",
      "Descent (Eccentric)": "BAD: Dive-bombing — dropping fast with no muscular control. Breaking only at knees (quad-dominant, no hip involvement). Weight shifting to toes (heels lifting). Inconsistent tempo. Torso angle changing drastically during descent.",
      "Depth & Bottom Position": "BAD: Cutting depth short (hip crease clearly above knee). Butt wink — visible posterior pelvic tilt where tailbone tucks under at the bottom. Excessive forward lean where chest drops toward thighs. Loss of core brace at depth.",
      "Drive Out of the Hole": "BAD: 'Good morning squat' — hips shoot up first while chest drops forward. Weight shifts to toes. Slow, grinding ascent with visible struggle to maintain position. Torso angle changes significantly compared to descent.",
      "Knee Tracking": "BAD: Knees cave inward (valgus collapse), especially visible when driving out of the hole. Knees collapse past the big toe line. Asymmetric knee tracking (one knee caves more than the other). Knees wobbling or shaking.",
      "Lockout & Rerack": "BAD: Incomplete lockout — hips not fully extended, slight forward lean remaining. Knees not fully straightened. Stumbling or staggering while reracking. Uneven rerack with bar hitting one hook first.",
    },
    injuryRiskPatterns: [
      { pattern: "Severe knee valgus (knees caving inward past big toe) — risk of ACL/MCL strain", severity: "stop_immediately" },
      { pattern: "Butt wink under load — lumbar flexion at depth risks disc injury", severity: "caution" },
      { pattern: "Good morning squat pattern — shifts all load to lower back", severity: "stop_immediately" },
      { pattern: "Heels lifting off the floor — indicates ankle mobility deficit and shifts load forward", severity: "caution" },
      { pattern: "Bar rolling up onto neck during ascent — cervical spine compression risk", severity: "caution" },
      { pattern: "Asymmetric depth or drive — may indicate muscular imbalance or injury compensation", severity: "caution" },
    ],
  },

  bench_press: {
    name: "Barbell Bench Press",
    checkpoints: [
      "Setup & Arch",
      "Unrack & Start Position",
      "Bar Path (Descent)",
      "Touch Point",
      "Drive & Lockout",
      "Shoulder Safety",
    ],
    commonFaults: [
      "Flared elbows (90° angle)",
      "Bouncing bar off chest",
      "Uneven lockout",
      "Feet not planted",
      "Losing upper back tightness",
      "Bar drifting toward face or belly",
    ],
    goodFormDescriptors: {
      "Setup & Arch": "Shoulder blades retracted and depressed (pinched together and pulled down). Slight thoracic arch that opens the chest. Feet flat on the floor with leg drive available. Glutes on the bench. 5 points of contact: head, upper back, glutes, left foot, right foot.",
      "Unrack & Start Position": "Bar unracked with arms locked out. Bar positioned directly over shoulders (not over face or chest). Elbows not flared. Spotter assists unrack if needed. Wrists straight, not bent back.",
      "Bar Path (Descent)": "Bar descends in a controlled J-curve toward lower chest. Elbows at 45-75° angle to torso (not flared at 90°). Forearms remain vertical when viewed from the side. 2-3 second controlled descent. Lats engaged.",
      "Touch Point": "Bar touches at or below nipple line on the chest. Brief pause or light touch — no bouncing. Bar makes contact with the chest (full ROM). Even touch across the bar.",
      "Drive & Lockout": "Drives bar up and slightly back toward face (reverse J-curve). Full elbow lockout at the top. Symmetrical press — bar stays level. Leg drive engages through the floor.",
      "Shoulder Safety": "Shoulders remain retracted and depressed throughout the entire lift. No anterior shoulder roll at the top of the press. Scapulae stay pinched. No shrugging at lockout.",
    },
    badFormDescriptors: {
      "Setup & Arch": "BAD: Flat back on bench (no retraction — shoulders round forward). Excessive lumbar arch (butt lifting off bench). Feet up on the bench or not planted. Head lifting off bench during press. No visible brace or setup ritual.",
      "Unrack & Start Position": "BAD: Losing scapular retraction during unrack. Bar starting over the face or belly (not over shoulders). Wrists bent back at 90°. Elbows already flared before descent begins.",
      "Bar Path (Descent)": "BAD: Elbows flared at 90° to torso (guillotine press position). Bar dropping straight down vertically instead of J-curve. Losing control on descent (bar drops fast). Forearms angled (not vertical). Bouncing or touch-and-go with no control.",
      "Touch Point": "BAD: Bar touching too high (collarbone/neck area — dangerous). Bar touching too low (belly). Bouncing the bar off the chest. Not touching the chest at all (half reps). Uneven touch (bar tilted).",
      "Drive & Lockout": "BAD: Pressing straight up (no J-curve back). Incomplete lockout — elbows still bent at top. Asymmetric press — one arm extends before the other. Hips lifting off bench. No leg drive.",
      "Shoulder Safety": "BAD: Shoulders protracting (rolling forward) at the top of each rep. Scapulae losing retraction mid-set. Shrugging at lockout — traps engaging instead of chest. Visible shoulder discomfort or compensation.",
    },
    injuryRiskPatterns: [
      { pattern: "Elbows flared at 90° (guillotine position) — extreme shoulder impingement risk", severity: "stop_immediately" },
      { pattern: "Bouncing bar off chest with force — risk of sternum bruising or rib fracture", severity: "stop_immediately" },
      { pattern: "Shoulders rolling forward at lockout — anterior shoulder impingement and rotator cuff strain", severity: "caution" },
      { pattern: "Wrists bent back excessively under load — risk of wrist strain", severity: "caution" },
      { pattern: "Uneven lockout with bar tilting — risk of losing balance and dropping the bar", severity: "caution" },
      { pattern: "Excessive lumbar arch with butt off bench — lumbar spine compression", severity: "caution" },
    ],
  },
};

/** Build the full analysis prompt from an exercise key, optionally personalized */
export function getAnalysisPrompt(exercise: string, userCtx?: UserContext): string {
  const config = EXERCISES[exercise];
  if (config) return buildAnalysisPrompt(config, userCtx);
  return GENERIC_EXERCISE_PROMPT;
}

// Fallback generic prompt for exercises without a specific template
export const GENERIC_EXERCISE_PROMPT = `You are an elite strength & conditioning coach analyzing a workout video clip.

ANALYSIS METHOD — For each checkpoint you MUST:
1. DESCRIBE exactly what you observe in the video (joint angles, body positions, movement quality).
2. COMPARE your observation against both the GOOD FORM and BAD FORM descriptions.
3. SCORE 0-100 based on how close the lifter is to GOOD form vs BAD form.
4. FLAG any bad-form red flags you detected.

Evaluate the lifter's form focusing on:
1. Movement Quality
   GOOD FORM: Smooth, controlled movement through full range of motion. Consistent tempo. No jerky or compensatory movements.
   BAD FORM (red flags): Jerky, uncontrolled movement. Compensatory patterns visible. Rushing through reps with no control.
2. Joint Alignment
   GOOD FORM: Joints stacked properly, no excessive deviation. Knees, hips, shoulders in proper alignment for the movement.
   BAD FORM (red flags): Joints deviating from proper alignment. Knees collapsing, hips shifting, shoulders rounding under load.
3. Tempo & Control
   GOOD FORM: Controlled eccentric (2-3 seconds), explosive concentric. Deliberate pace throughout.
   BAD FORM (red flags): Momentum-based movement, dropping weights, no eccentric control, bouncing at end ranges.
4. Stability
   GOOD FORM: Core braced, no wobbling or compensation patterns. Stable base throughout.
   BAD FORM (red flags): Visible wobbling, shifting, or instability. Core not braced. Balance lost during movement.
5. Range of Motion
   GOOD FORM: Full ROM achieved without compensation. End range positions are solid.
   BAD FORM (red flags): Partial reps, cutting range of motion short. Compensating to reach full ROM (e.g., rounding back to reach depth).
6. Safety
   GOOD FORM: No movements that could lead to acute injury. Controlled at all times.
   BAD FORM (red flags): Reckless speed, loss of control, dangerous joint positions, load exceeding ability to maintain form.

Return ONLY valid JSON:
{
  "checkpoints": [
    { "name": "Movement Quality", "score": 75, "feedback": "OBSERVED: [what you see]. COMPARED: [good vs bad]. Cue to improve.", "observed_details": "..." },
    { "name": "Joint Alignment", "score": 72, "feedback": "...", "observed_details": "..." },
    { "name": "Tempo & Control", "score": 80, "feedback": "...", "observed_details": "..." },
    { "name": "Stability", "score": 65, "feedback": "...", "observed_details": "..." },
    { "name": "Range of Motion", "score": 78, "feedback": "...", "observed_details": "..." },
    { "name": "Safety", "score": 70, "feedback": "...", "observed_details": "..." }
  ],
  "overall_score": 73,
  "top_priority": "...",
  "positive": "...",
  "injury_risk": "low",
  "bad_form_detected": false,
  "bad_form_flags": []
}`;
