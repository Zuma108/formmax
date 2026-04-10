import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, createPartFromText, type Part } from "@google/genai";
import { Storage } from "@google-cloud/storage";
import fs from "node:fs";
import path from "node:path";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase";
import { EXERCISES, getAnalysisPrompt, GENERIC_EXERCISE_PROMPT, type UserContext } from "@/lib/prompts";

// ── Gemini client ────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- Constants ---
const MAX_VIDEO_DURATION_SECONDS = 60;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const EMBEDDING_MODEL = "gemini-embedding-2-preview";
const EMBEDDING_DIMENSIONS = 3072; // MRL — Matryoshka Representation Learning
const ANALYSIS_MODEL_PRIMARY = "gemini-2.5-flash";  // faster — stays within Netlify's 26s limit
const ANALYSIS_MODEL_FALLBACK = "gemini-2.5-pro";
const REFERENCES_PATH = path.join(process.cwd(), "data", "references.json");
const VIDEO_REFERENCES_PATH = path.join(process.cwd(), "data", "video_references.json");

// --- Video Reference types ---
type VideoRefEntry = {
    id: string;
    gcs_uri: string;
    gemini_file_uri: string;
    label: string;
    quality: "good" | "bad";
    exercise: string;
    mime_type: string;
};

type VideoRefRegistry = Record<string, { good: VideoRefEntry[]; bad: VideoRefEntry[] }>;

// --- Registry cache (module-level, refreshed every hour per Lambda instance) ---
let _registryCache: { data: VideoRefRegistry; expiresAt: number } | null = null;
const REGISTRY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const GCS_REGISTRY_FILE = "registry.json";

/** Load the full registry. Prefers gs://<GCS_BUCKET>/registry.json (kept fresh by the
 *  daily /api/reregister cron), falls back to the local data/video_references.json. */
async function loadFullRegistry(): Promise<VideoRefRegistry> {
    const now = Date.now();

    // Return cached copy if still valid
    if (_registryCache && now < _registryCache.expiresAt) {
        return _registryCache.data;
    }

    const bucketName = process.env.GCS_BUCKET;
    if (bucketName) {
        try {
            const storage = new Storage();
            const [contents] = await storage.bucket(bucketName).file(GCS_REGISTRY_FILE).download();
            const registry: VideoRefRegistry = JSON.parse(contents.toString("utf-8"));
            _registryCache = { data: registry, expiresAt: now + REGISTRY_CACHE_TTL_MS };
            return registry;
        } catch {
            // GCS unavailable — fall through to local file
        }
    }

    // Fall back: local file baked in at deploy time (good for dev / first deploy)
    try {
        if (fs.existsSync(VIDEO_REFERENCES_PATH)) {
            const registry: VideoRefRegistry = JSON.parse(fs.readFileSync(VIDEO_REFERENCES_PATH, "utf-8"));
            _registryCache = { data: registry, expiresAt: now + REGISTRY_CACHE_TTL_MS };
            return registry;
        }
    } catch {
        // ignore
    }

    return {};
}

/** Load video references for a given exercise. Returns { good, bad } arrays (may be empty). */
async function loadVideoReferences(exercise: string): Promise<{ good: VideoRefEntry[]; bad: VideoRefEntry[] }> {
    try {
        const registry = await loadFullRegistry();
        return registry[exercise] ?? { good: [], bad: [] };
    } catch {
        return { good: [], bad: [] };
    }
}

/** Pick one random entry from an array, or undefined if empty */
function pickRandom<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
}

type CheckpointEvaluation = {
    name: string;
    score: number;
    feedback: string;
    observed_details?: string;
};

type BiomechanicsAnalysis = {
    checkpoints: CheckpointEvaluation[];
    overall_score: number;
    top_priority: string;
    positive: string;
    injury_risk: "low" | "medium" | "high";
    bad_form_detected: boolean;
    bad_form_flags: string[];
};

type RepEvaluation = {
    rep_index: number;
    score: number;
    notes: string;
};

type QualityAndRepAnalysis = {
    is_valid_exercise_video: boolean;
    rejection_reason: string;
    confidence_score: number;
    confidence_label: "low" | "medium" | "high";
    camera_angle_quality: number;
    body_visibility_quality: number;
    warnings: string[];
    retake_guidance: string;
    rep_scores: RepEvaluation[];
    detected_rep_count: number;
    consistency_summary: string;
};

type ReferenceEntry = {
    name?: string;
    embedding?: number[];
    source_video?: string;
    embedded_at?: string | null;
    model?: string;
    dimensions?: number;
};

function computeCosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        normA += vec1[i] * vec1[i];
        normB += vec2[i] * vec2[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function normalizeExerciseKey(rawValue: string | null, fallback = "deadlift"): string {
    if (!rawValue) return fallback;
    const normalized = rawValue.trim().toLowerCase().replace(/\s+/g, "_");
    return normalized || fallback;
}

function safeParseJson(text: string): unknown {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const withoutFence = trimmed.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    return JSON.parse(withoutFence);
}

function toNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringArray(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    return input.map((item) => String(item)).filter((item) => item.trim().length > 0);
}

function toBiomechanicsAnalysis(input: unknown): BiomechanicsAnalysis {
    if (!input || typeof input !== "object") {
        throw new Error("Invalid analysis output");
    }
    const obj = input as Record<string, unknown>;
    const checkpointsRaw = Array.isArray(obj.checkpoints) ? obj.checkpoints : [];

    const checkpoints = checkpointsRaw
        .map((item) => {
            if (!item || typeof item !== "object") return null;
            const parsed = item as Record<string, unknown>;
            const name = String(parsed.name ?? "Checkpoint").trim();
            const scoreRaw = Number(parsed.score ?? 0);
            const feedback = String(parsed.feedback ?? "").trim();
            const observed_details = parsed.observed_details ? String(parsed.observed_details).trim() : undefined;
            return {
                name,
                score: clamp(Number.isFinite(scoreRaw) ? scoreRaw : 0, 0, 100),
                feedback,
                ...(observed_details ? { observed_details } : {}),
            } satisfies CheckpointEvaluation;
        })
        .filter((item): item is CheckpointEvaluation => Boolean(item));

    if (checkpoints.length === 0) {
        throw new Error("Model did not return checkpoint evaluations");
    }

    const overallRaw = Number(obj.overall_score ?? 0);
    const injuryRaw = String(obj.injury_risk ?? "medium").toLowerCase();
    const injuryRisk: "low" | "medium" | "high" = injuryRaw === "low" || injuryRaw === "high" ? injuryRaw : "medium";

    return {
        checkpoints,
        overall_score: clamp(Number.isFinite(overallRaw) ? overallRaw : 0, 0, 100),
        top_priority: String(obj.top_priority ?? "Focus on maintaining a neutral spine and steady bar path.").trim(),
        positive: String(obj.positive ?? "Strong effort and intent visible across the set.").trim(),
        injury_risk: injuryRisk,
        bad_form_detected: Boolean(obj.bad_form_detected),
        bad_form_flags: toStringArray(obj.bad_form_flags),
    };
}

function loadReferenceEmbedding(referenceId: string): { vector: number[]; source: string } {
    if (!fs.existsSync(REFERENCES_PATH)) {
        throw new Error("Missing references.json. Run the embedding script first.");
    }

    const fileData = JSON.parse(fs.readFileSync(REFERENCES_PATH, "utf-8")) as Record<string, ReferenceEntry>;
    const preferred = fileData[referenceId];
    const fallback = fileData.deadlift;
    const selected = preferred ?? fallback;

    if (!selected?.embedding || !Array.isArray(selected.embedding) || selected.embedding.length === 0) {
        throw new Error(`No embedded reference found for '${referenceId}'. Run scripts/embed_reference.ts to generate it.`);
    }

    return {
        vector: selected.embedding,
        source: preferred ? referenceId : "deadlift",
    };
}

function toQualityAndRepAnalysis(input: unknown): QualityAndRepAnalysis {
    if (!input || typeof input !== "object") {
        throw new Error("Invalid quality analysis output");
    }

    const obj = input as Record<string, unknown>;
    const labelRaw = String(obj.confidence_label ?? "medium").toLowerCase();
    const confidenceLabel: "low" | "medium" | "high" =
        labelRaw === "low" || labelRaw === "high" ? labelRaw : "medium";

    const repScoresRaw = Array.isArray(obj.rep_scores) ? obj.rep_scores : [];
    const repScores = repScoresRaw
        .map((item, index) => {
            if (!item || typeof item !== "object") return null;
            const parsed = item as Record<string, unknown>;
            return {
                rep_index: Math.max(1, Math.round(toNumber(parsed.rep_index, index + 1))),
                score: clamp(toNumber(parsed.score, 0), 0, 100),
                notes: String(parsed.notes ?? "").trim(),
            } satisfies RepEvaluation;
        })
        .filter((item): item is RepEvaluation => Boolean(item));

    return {
        is_valid_exercise_video: obj.is_valid_exercise_video !== false,
        rejection_reason: String(obj.rejection_reason ?? "").trim(),
        confidence_score: clamp(toNumber(obj.confidence_score, 65), 0, 100),
        confidence_label: confidenceLabel,
        camera_angle_quality: clamp(toNumber(obj.camera_angle_quality, 65), 0, 100),
        body_visibility_quality: clamp(toNumber(obj.body_visibility_quality, 65), 0, 100),
        warnings: toStringArray(obj.warnings),
        retake_guidance: String(obj.retake_guidance ?? "Use a side view, keep full body and barbell in frame, and ensure clear lighting.").trim(),
        rep_scores: repScores,
        detected_rep_count: Math.max(repScores.length, Math.round(toNumber(obj.detected_rep_count, repScores.length))),
        consistency_summary: String(obj.consistency_summary ?? "Rep quality remained stable across the set.").trim(),
    };
}

function getCheckpointScore(checkpoints: CheckpointEvaluation[], keyIncludes: string): number {
    const found = checkpoints.find((cp) => cp.name.toLowerCase().includes(keyIncludes));
    return found ? found.score : 70;
}

function computeRepConsistency(repScores: RepEvaluation[]): number {
    if (repScores.length === 0) return 70;
    const values = repScores.map((rep) => rep.score);
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const spreadPenalty = clamp(stdDev * 1.3, 0, 25);
    return clamp(avg - spreadPenalty, 0, 100);
}

function computeScoring(similarityCosine: number, analysis: BiomechanicsAnalysis, quality: QualityAndRepAnalysis) {
    // Embedding is used ONLY for exercise classification, not scoring.
    // Cosine similarity measures "is this the same type of exercise?" not "is the form good?"
    const embeddingScore = clamp(((similarityCosine + 1) / 2) * 100, 0, 100);
    const exerciseMismatch = similarityCosine < 0.3;

    const checkpointAverage = analysis.checkpoints.reduce((acc, cp) => acc + cp.score, 0) / analysis.checkpoints.length;

    const spineScore = getCheckpointScore(analysis.checkpoints, "spine");
    const barPathScore = getCheckpointScore(analysis.checkpoints, "bar path");
    const hipHingeScore = getCheckpointScore(analysis.checkpoints, "hip hinge");
    const eccentricScore = getCheckpointScore(analysis.checkpoints, "eccentric");

    const checkpointConsistency = clamp((spineScore + barPathScore + eccentricScore) / 3, 0, 100);
    const repConsistency = computeRepConsistency(quality.rep_scores);
    const consistencyScore = clamp((checkpointConsistency * 0.35) + (repConsistency * 0.65), 0, 100);

    // Quality adjustment: reward high-confidence recordings, penalize low-confidence
    const qualityAdjustment = clamp(
        (quality.confidence_score * 0.4) + (quality.camera_angle_quality * 0.3) + (quality.body_visibility_quality * 0.3),
        0, 100
    );

    let penalty = 0;
    const penaltyBreakdown = {
        spine: 0,
        bar_path: 0,
        hip_hinge: 0,
        eccentric: 0,
        low_confidence: 0,
        bad_form: 0,
    };

    if (spineScore < 65) {
        penalty += 12;
        penaltyBreakdown.spine = 12;
    }
    if (barPathScore < 70) {
        penalty += 8;
        penaltyBreakdown.bar_path = 8;
    }
    if (hipHingeScore < 65) {
        penalty += 8;
        penaltyBreakdown.hip_hinge = 8;
    }
    if (eccentricScore < 65) {
        penalty += 6;
        penaltyBreakdown.eccentric = 6;
    }
    if (quality.confidence_label === "low") {
        penalty += 6;
        penaltyBreakdown.low_confidence = 6;
    }
    if (analysis.bad_form_detected) {
        penalty += 10;
        penaltyBreakdown.bad_form = 10;
    }

    // New formula: embedding removed from score, replaced with quality adjustment
    const weighted = (0.60 * checkpointAverage) + (0.25 * consistencyScore) + (0.15 * qualityAdjustment);
    const finalScore = clamp(weighted - penalty, 0, 100);

    return {
        embeddingScore,
        exerciseMismatch,
        checkpointAverage,
        consistencyScore,
        qualityAdjustment,
        repConsistency,
        penalty,
        penaltyBreakdown,
        finalScore,
    };
}

async function runBiomechanicsAnalysis(videoPart: Part, exercise: string, userCtx?: UserContext): Promise<BiomechanicsAnalysis> {
    const prompt = getAnalysisPrompt(exercise, userCtx);
    const modelCandidates = [ANALYSIS_MODEL_PRIMARY, ANALYSIS_MODEL_FALLBACK];

    // Load reference video clips for few-shot comparison
    const refs = await loadVideoReferences(exercise);
    const goodRef = pickRandom(refs.good);
    const badRef = pickRandom(refs.bad);

    // Build content parts: prompt → [good ref] → [bad ref] → user video
    const contentParts: Part[] = [];

    // Few-shot preamble if we have references
    if (goodRef || badRef) {
        let refPrompt = "REFERENCE CLIPS FOR COMPARISON:\n";
        if (goodRef) refPrompt += `- The first video is GOOD FORM (${goodRef.label}). Study it as the gold standard.\n`;
        if (badRef) refPrompt += `- The ${goodRef ? "second" : "first"} video is BAD FORM (${badRef.label}). Note the dangerous patterns.\n`;
        refPrompt += `- The ${goodRef && badRef ? "third" : goodRef || badRef ? "second" : "first"} video is the USER'S CLIP to evaluate.\n`;
        refPrompt += "Compare the user's form against both reference clips.\n\n";
        contentParts.push(createPartFromText(refPrompt));
    }

    // Add reference video parts (from Gemini File API URIs)
    if (goodRef?.gemini_file_uri) {
        contentParts.push({ fileData: { fileUri: goodRef.gemini_file_uri, mimeType: goodRef.mime_type } });
    }
    if (badRef?.gemini_file_uri) {
        contentParts.push({ fileData: { fileUri: badRef.gemini_file_uri, mimeType: badRef.mime_type } });
    }

    // Main analysis prompt + user video
    contentParts.push(createPartFromText(prompt));
    contentParts.push(videoPart);

    let lastError: unknown = null;

    for (const model of modelCandidates) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: contentParts,
                config: {
                    temperature: 0.1,
                    responseMimeType: "application/json",
                },
            });

            const parsed = safeParseJson(response.text ?? "");
            return toBiomechanicsAnalysis(parsed);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError instanceof Error ? lastError : new Error("Biomechanics analysis failed");
}

async function runQualityAndRepAnalysis(videoPart: Part, exercise: string): Promise<QualityAndRepAnalysis> {
    const exerciseConfig = EXERCISES[exercise];
    const exerciseName = exerciseConfig?.name ?? exercise;
    const qualityPrompt = `You are a strict strength coach evaluating recording quality and rep-by-rep execution quality for a ${exerciseName} video.

Exercise: ${exerciseName}

CRITICAL FIRST STEP — CONTENT VALIDATION:
Before analysing form, determine whether this video actually shows a human performing a recognizable physical exercise.
Set "is_valid_exercise_video" to FALSE and provide a "rejection_reason" if ANY of these apply:
- No human body is visible (e.g. a hand, wall, ceiling, desk, floor, random object)
- A person is visible but NOT performing any exercise movement
- The video is too dark, blurry, or obscured to see any movement
- Only a partial body part is visible (e.g. just a hand or foot) without any exercise motion
If the video is invalid, still return the full JSON structure but with zeroed scores and "rejection_reason" explaining what you see instead of an exercise.

If the video IS valid, proceed with the full analysis:
1) Assess camera/view quality for reliable form grading. Consider: angle (side view is ideal for most lifts), lighting, full body visibility, bar/equipment visibility, steadiness.
2) Detect individual reps and score each rep 0-100 based on form quality.
3) Summarize consistency across reps — flag any progressive form breakdown.

Return ONLY valid JSON with this exact structure:
{
  "is_valid_exercise_video": true,
  "rejection_reason": "",
  "confidence_score": 0,
  "confidence_label": "low",
  "camera_angle_quality": 0,
  "body_visibility_quality": 0,
  "warnings": [""],
  "retake_guidance": "",
  "rep_scores": [
    { "rep_index": 1, "score": 0, "notes": "" }
  ],
  "detected_rep_count": 0,
  "consistency_summary": ""
}

Rules:
- is_valid_exercise_video: false if no recognizable exercise is being performed. When false, set all scores to 0, detected_rep_count to 0, and provide a clear rejection_reason.
- confidence_label must be one of: low, medium, high.
- If lifter or equipment is not fully visible for key phases, confidence_label must be low.
- camera_angle_quality: 90+ for clear side view, 70-89 for angled view, below 70 for front-on or obstructed.
- rep_scores should include every clearly visible rep. Keep rep_index sequential.
- Notes must mention concrete mechanics (joint positions, bar path, tempo), not generic encouragement.
- If form degrades across reps, note this in consistency_summary.`;

    const modelCandidates = [ANALYSIS_MODEL_PRIMARY, ANALYSIS_MODEL_FALLBACK];
    let lastError: unknown = null;

    for (const model of modelCandidates) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: [
                    createPartFromText(qualityPrompt),
                    videoPart,
                ],
                config: {
                    temperature: 0.1,
                    responseMimeType: "application/json",
                },
            });

            const parsed = safeParseJson(response.text ?? "");
            return toQualityAndRepAnalysis(parsed);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError instanceof Error ? lastError : new Error("Quality and rep analysis failed");
}

export async function POST(req: NextRequest) {

    try {
        // Fetch user profile for personalized analysis (non-blocking — graceful fallback)
        let userCtx: UserContext | undefined;
        try {
            const { userId } = await auth();
            if (userId) {
                const db = createAdminClient();
                const { data } = await db.from('user_profiles').select('experience, strictness, injuries, weaknesses, focus_areas, gender, body_weight, weight_unit').eq('clerk_user_id', userId).single();
                if (data) userCtx = data;
            }
        } catch { /* continue without personalization */ }

        const formData = await req.formData();
        const videoFile = formData.get("video") as File;
        const exercise = normalizeExerciseKey(formData.get("exercise") as string | null, "deadlift");
        const requestedReference = normalizeExerciseKey(formData.get("pro_reference_id") as string | null, exercise);

        if (!videoFile) {
            return NextResponse.json({ error: "Missing video file" }, { status: 400 });
        }

        // --- Validation: File size ---
        if (videoFile.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: `Video must be under ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB. Received: ${(videoFile.size / 1024 / 1024).toFixed(1)}MB` },
                { status: 413 }
            );
        }

        // --- Validation: Duration (checked via metadata header if available) ---
        const durationHeader = formData.get("duration") as string | null;
        if (durationHeader) {
            const durationSeconds = parseFloat(durationHeader);
            if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
                return NextResponse.json(
                    { error: `Clips must be ${MAX_VIDEO_DURATION_SECONDS} seconds or under. Your clip: ${durationSeconds.toFixed(1)}s` },
                    { status: 400 }
                );
            }
        }

        const arrayBuffer = await videoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = videoFile.type || "video/mp4";

        // Retry wrapper: if the first attempt hits a rate limit, rotate key and retry once
        const attemptAnalysis = async (): Promise<NextResponse> => {
            console.log("[compare_workout] Starting Files API upload + embedding in parallel…");
            const blob = new Blob([buffer], { type: mimeType });
            const inlinePart = { inlineData: { mimeType, data: buffer.toString("base64") } };
            const [embeddingResponse, uploadedFile] = await Promise.all([
                ai.models.embedContent({
                    model: EMBEDDING_MODEL,
                    contents: [inlinePart],
                    config: { outputDimensionality: EMBEDDING_DIMENSIONS },
                }),
                ai.files.upload({ file: blob, config: { mimeType, displayName: "workout" } }),
            ]);

            // Poll until ACTIVE (usually immediate for short clips)
            let fileRef = uploadedFile;
            let pollAttempts = 0;
            while (fileRef.state === "PROCESSING" && pollAttempts < 10) {
                await new Promise(r => setTimeout(r, 1500));
                fileRef = await ai.files.get({ name: uploadedFile.name! });
                pollAttempts++;
            }
            if (fileRef.state !== "ACTIVE") {
                throw new Error(`File processing failed with state: ${fileRef.state}`);
            }
            const fileDataPart: Part = { fileData: { fileUri: fileRef.uri!, mimeType } };

            const userEmbedding = embeddingResponse.embeddings?.[0]?.values;

            if (!userEmbedding) {
                throw new Error("Failed to generate video embedding from Gemini Embedding 2");
            }

            // Retrieve stored reference vector
            const { vector: proEmbedding, source: referenceSource } = loadReferenceEmbedding(requestedReference);

            if (proEmbedding.length !== userEmbedding.length) {
                throw new Error(`Reference embedding dimension mismatch. Expected ${userEmbedding.length}, got ${proEmbedding.length}.`);
            }

            // Calculate 'Form Match Score' via cosine similarity
            const similarity = computeCosineSimilarity(userEmbedding, proEmbedding);
            console.log("[compare_workout] File active, starting biomechanics + quality in parallel via fileData…");
            const [analysis, quality] = await Promise.all([
                runBiomechanicsAnalysis(fileDataPart, exercise, userCtx),
                runQualityAndRepAnalysis(fileDataPart, exercise),
            ]);
            console.log("[compare_workout] All analyses complete.");
            // Clean up uploaded file (fire-and-forget)
            ai.files.delete({ name: uploadedFile.name! }).catch(() => {});

            // --- Rejection gate: reject if the video doesn't show a real exercise ---
            const isContentInvalid = !quality.is_valid_exercise_video;
            const isGhostVideo = quality.detected_rep_count === 0
                && quality.confidence_label === "low"
                && quality.body_visibility_quality < 25;

            if (isContentInvalid || isGhostVideo) {
                const reason = quality.rejection_reason
                    || "No exercise detected. Make sure your full body and the movement are clearly visible.";
                console.log(`[compare_workout] Rejected: ${reason}`);
                return NextResponse.json({
                    rejected: true,
                    rejection_reason: reason,
                    exercise,
                }, { status: 200 });
            }

            const score = computeScoring(similarity, analysis, quality);

            // Check which reference clips were used for few-shot
            const refs = await loadVideoReferences(exercise);
            const refClipsUsed = {
                good_available: refs.good.length,
                bad_available: refs.bad.length,
                few_shot_enabled: refs.good.length > 0 || refs.bad.length > 0,
            };

            const critique = {
                power: analysis.positive,
                grace: quality.confidence_label === "low"
                    ? `${analysis.top_priority} Capture quality is low confidence: ${quality.retake_guidance}`
                    : analysis.top_priority,
                consistency: `Rep consistency ${score.repConsistency.toFixed(0)}/100 across ${quality.detected_rep_count} detected reps. Penalty applied: ${score.penalty}.`,
            };

            // Exercise mismatch warning
            const exerciseWarnings: string[] = [];
            if (score.exerciseMismatch) {
                exerciseWarnings.push(`This video doesn't appear to match the selected exercise (${exercise}). The embedding similarity is very low. Please ensure you recorded the correct exercise.`);
            }

            return NextResponse.json({
                exercise,
                pro_reference_id: referenceSource,
                similarity_score: Number((score.embeddingScore / 100).toFixed(4)),
                similarity_cosine: Number(similarity.toFixed(4)),
                embedding_score: Number(score.embeddingScore.toFixed(1)),
                exercise_mismatch: score.exerciseMismatch,
                checkpoint_average: Number(score.checkpointAverage.toFixed(1)),
                consistency_score: Number(score.consistencyScore.toFixed(1)),
                quality_adjustment: Number(score.qualityAdjustment.toFixed(1)),
                rep_consistency_score: Number(score.repConsistency.toFixed(1)),
                penalty_score: score.penalty,
                penalty_breakdown: score.penaltyBreakdown,
                final_score: Number(score.finalScore.toFixed(1)),
                checkpoints: analysis.checkpoints,
                bad_form_detected: analysis.bad_form_detected,
                bad_form_flags: analysis.bad_form_flags,
                quality_gate: {
                    confidence_score: Number(quality.confidence_score.toFixed(1)),
                    confidence_label: quality.confidence_label,
                    camera_angle_quality: Number(quality.camera_angle_quality.toFixed(1)),
                    body_visibility_quality: Number(quality.body_visibility_quality.toFixed(1)),
                    warnings: [...quality.warnings, ...exerciseWarnings],
                    retake_guidance: quality.retake_guidance,
                },
                rep_analysis: {
                    rep_scores: quality.rep_scores,
                    detected_rep_count: quality.detected_rep_count,
                    consistency_summary: quality.consistency_summary,
                },
                overall_score: Number(analysis.overall_score.toFixed(1)),
                top_priority: analysis.top_priority,
                positive: analysis.positive,
                injury_risk: analysis.injury_risk,
                embedding_model: EMBEDDING_MODEL,
                embedding_dimensions: userEmbedding.length,
                analysis_model: ANALYSIS_MODEL_PRIMARY,
                max_clip_duration: MAX_VIDEO_DURATION_SECONDS,
                reference_clips: refClipsUsed,
                critique
            });
        };

        return await attemptAnalysis();

    } catch (error: unknown) {
        console.error("Error processing workout:", error);
        const raw = error instanceof Error ? error.message : String(error);

        // Map known API errors to user-friendly messages
        let message: string;
        let status = 500;
        if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429') || raw.includes('quota')) {
            message = 'Our AI service is temporarily at capacity. Please try again in a minute.';
            status = 429;
        } else if (raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
            message = 'AI service configuration error. Please contact support.';
            status = 403;
        } else if (raw.includes('DEADLINE_EXCEEDED') || raw.includes('timeout') || raw.includes('AbortError')) {
            message = 'Analysis timed out. Try a shorter clip or check your connection.';
            status = 504;
        } else if (raw.includes('File processing failed')) {
            message = 'Video processing failed. Try a different format or shorter clip.';
        } else {
            message = 'Analysis failed. Please try again.';
        }

        return NextResponse.json({ error: message }, { status });
    }
}
