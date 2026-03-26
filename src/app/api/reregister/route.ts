/**
 * POST /api/reregister
 *
 * Daily cron endpoint — re-uploads all GCS reference videos to the Gemini File API
 * (files expire after 48h) and saves the updated URIs to gs://<bucket>/registry.json.
 *
 * Protected by Authorization: Bearer <REREGISTER_SECRET>
 *
 * Designed to be called by cron-job.org once per day.
 * Example cron-job.org config:
 *   URL: https://<your-netlify-domain>/api/reregister
 *   Method: POST
 *   Headers: Authorization: Bearer <REREGISTER_SECRET>
 *   Schedule: Once daily (e.g. 03:00 UTC)
 */

import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { GoogleGenAI } from "@google/genai";

// ─── Types ──────────────────────────────────────────────────────
interface VideoReference {
    id: string;
    gcs_uri: string;
    gemini_file_uri: string;
    label: string;
    quality: "good" | "bad";
    exercise: string;
    mime_type: string;
    uploaded_at?: string;
}

type Registry = Record<string, { good: VideoReference[]; bad: VideoReference[] }>;

const VALID_QUALITIES = ["good", "bad"] as const;
const GCS_REGISTRY_FILE = "registry.json";

// ─── GCS helpers ────────────────────────────────────────────────
async function loadRegistryFromGCS(bucket: string): Promise<Registry | null> {
    try {
        const storage = new Storage();
        const [contents] = await storage.bucket(bucket).file(GCS_REGISTRY_FILE).download();
        return JSON.parse(contents.toString("utf-8")) as Registry;
    } catch {
        return null;
    }
}

async function saveRegistryToGCS(bucket: string, registry: Registry): Promise<void> {
    const storage = new Storage();
    await storage.bucket(bucket).file(GCS_REGISTRY_FILE).save(JSON.stringify(registry, null, 2), {
        contentType: "application/json",
    });
}

// ─── Route handler ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
    // --- Auth check ---
    const secret = process.env.REREGISTER_SECRET;
    const authHeader = req.headers.get("authorization");

    if (!secret) {
        return NextResponse.json({ error: "REREGISTER_SECRET env var not configured" }, { status: 500 });
    }
    if (authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Env checks ---
    const geminiKey = process.env.GEMINI_API_KEY;
    const bucketName = process.env.GCS_BUCKET;

    if (!geminiKey) {
        return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }
    if (!bucketName) {
        return NextResponse.json({ error: "GCS_BUCKET not configured" }, { status: 500 });
    }

    // --- Load registry ---
    const registry = await loadRegistryFromGCS(bucketName);
    if (!registry || Object.keys(registry).length === 0) {
        return NextResponse.json({
            ok: true,
            refreshed: 0,
            errors: [],
            message: "Registry is empty — no references to re-register.",
            timestamp: new Date().toISOString(),
        });
    }

    const genai = new GoogleGenAI({ apiKey: geminiKey });
    const storage = new Storage();

    let refreshed = 0;
    const errors: string[] = [];

    // --- Re-register each video ---
    for (const exercise of Object.keys(registry)) {
        for (const quality of VALID_QUALITIES) {
            const refs = registry[exercise]?.[quality] ?? [];
            for (const ref of refs) {
                try {
                    // 1. Download bytes from GCS
                    const gcsPath = ref.gcs_uri.replace(`gs://${bucketName}/`, "");
                    const [buffer] = await storage.bucket(bucketName).file(gcsPath).download();

                    // 2. Re-upload to Gemini File API (gets a fresh URI valid for 48h)
                    const uploadResult = await genai.files.upload({
                        file: new Blob([new Uint8Array(buffer)], { type: ref.mime_type }),
                        config: {
                            displayName: `${ref.id} — ${ref.label}`,
                            mimeType: ref.mime_type,
                        },
                    });

                    ref.gemini_file_uri = uploadResult.uri ?? "";
                    refreshed++;
                } catch (e) {
                    const msg = `${ref.id}: ${e instanceof Error ? e.message : String(e)}`;
                    errors.push(msg);
                }
            }
        }
    }

    // --- Save updated registry to GCS ---
    try {
        await saveRegistryToGCS(bucketName, registry);
    } catch (e) {
        errors.push(`Failed to save registry.json to GCS: ${e instanceof Error ? e.message : String(e)}`);
    }

    return NextResponse.json({
        ok: errors.length === 0,
        refreshed,
        errors,
        timestamp: new Date().toISOString(),
    });
}
