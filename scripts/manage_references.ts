#!/usr/bin/env npx tsx
/**
 * Video Reference Manager
 *
 * Upload, register, and label reference clips for few-shot form analysis.
 * Videos are stored in Google Cloud Storage and registered with the Gemini File API
 * so Gemini can read them directly — no re-downloading at request time.
 *
 * GCS bucket structure:
 *   gs://<BUCKET>/references/<exercise>/<quality>/<filename>.mp4
 *   Example: gs://formmax-references/deadlift/good/deadlift_good_1.mp4
 *
 * Commands:
 *   npx tsx scripts/manage_references.ts add \
 *     --exercise deadlift --quality good --video ./clip.mp4 \
 *     --label "Textbook conventional deadlift, side angle"
 *
 *   npx tsx scripts/manage_references.ts add \
 *     --exercise deadlift --quality bad --video ./bad_clip.mp4 \
 *     --label "Rounded lower back, bar drifting forward"
 *
 *   npx tsx scripts/manage_references.ts list
 *   npx tsx scripts/manage_references.ts list --exercise deadlift
 *   npx tsx scripts/manage_references.ts remove --id deadlift_good_1
 *
 * Environment (.env.local):
 *   GEMINI_API_KEY        — Gemini API key
 *   GCS_BUCKET            — Bucket name (e.g. formmax-references)
 *   GOOGLE_APPLICATION_CREDENTIALS — Path to GCS service account JSON
 */

import { Storage } from "@google-cloud/storage";
import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

// ─── Load .env.local ─────────────────────────────────────────────
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const [key, ...rest] = line.split("=");
      if (key?.trim() && rest.length > 0) {
        process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
      }
    });
}

// ─── Config ──────────────────────────────────────────────────────
const REGISTRY_PATH = path.join(__dirname, "..", "data", "video_references.json");
const BUCKET_NAME = process.env.GCS_BUCKET ?? "formmax-references";
const VALID_EXERCISES = ["deadlift", "squat", "bench_press"] as const;
const VALID_QUALITIES = ["good", "bad"] as const;
type Exercise = (typeof VALID_EXERCISES)[number];
type Quality = (typeof VALID_QUALITIES)[number];

interface VideoReference {
  id: string;
  gcs_uri: string;
  gemini_file_uri: string;
  label: string;
  quality: Quality;
  exercise: Exercise;
  duration_seconds: number | null;
  mime_type: string;
  uploaded_at: string;
}

type Registry = Record<string, { good: VideoReference[]; bad: VideoReference[] }>;

// ─── Helpers ─────────────────────────────────────────────────────
function loadRegistry(): Registry {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
}

function saveRegistry(registry: Registry): void {
  const dir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const flags: Record<string, string> = {};

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith("--") && args[i + 1]) {
      flags[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return { command, flags };
}

function getVideoMime(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".avi": "video/avi",
    ".mkv": "video/x-matroska",
  };
  return mimes[ext] ?? "video/mp4";
}

// ─── Commands ────────────────────────────────────────────────────

async function addReference(flags: Record<string, string>) {
  const exercise = flags.exercise as Exercise;
  const quality = flags.quality as Quality;
  const videoPath = flags.video;
  const label = flags.label ?? "";

  // Validate
  if (!exercise || !VALID_EXERCISES.includes(exercise)) {
    console.error(`❌ --exercise must be one of: ${VALID_EXERCISES.join(", ")}`);
    process.exit(1);
  }
  if (!quality || !VALID_QUALITIES.includes(quality)) {
    console.error(`❌ --quality must be one of: ${VALID_QUALITIES.join(", ")}`);
    process.exit(1);
  }
  if (!videoPath) {
    console.error("❌ --video is required");
    process.exit(1);
  }

  const resolvedPath = path.resolve(videoPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Video file not found: ${resolvedPath}`);
    process.exit(1);
  }

  const fileSize = fs.statSync(resolvedPath).size;
  if (fileSize > 100 * 1024 * 1024) {
    console.error("❌ File too large. Reference clips should be under 100MB (ideally 5-10 seconds).");
    process.exit(1);
  }

  const registry = loadRegistry();
  if (!registry[exercise]) {
    registry[exercise] = { good: [], bad: [] };
  }

  // Generate ID
  const existingCount = registry[exercise][quality].length;
  const id = `${exercise}_${quality}_${existingCount + 1}`;
  const gcsFileName = `references/${exercise}/${quality}/${id}${path.extname(resolvedPath)}`;
  const mimeType = getVideoMime(resolvedPath);

  console.log(`📤 Uploading to GCS...`);
  console.log(`   Bucket:  ${BUCKET_NAME}`);
  console.log(`   Path:    ${gcsFileName}`);

  // 1. Upload to GCS
  const storage = new Storage();
  const bucket = storage.bucket(BUCKET_NAME);
  await bucket.upload(resolvedPath, {
    destination: gcsFileName,
    metadata: {
      contentType: mimeType,
      metadata: {
        exercise,
        quality,
        label,
        id,
      },
    },
  });

  const gcsUri = `gs://${BUCKET_NAME}/${gcsFileName}`;
  console.log(`   ✅ Uploaded: ${gcsUri}`);

  // 2. Register with Gemini File API
  console.log(`🧠 Registering with Gemini File API...`);

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing.");
    process.exit(1);
  }

  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Upload the file to Gemini File API (it will be stored for 48h, but we can re-register)
  // For GCS files, we use the SDK's file upload with the local file
  const videoBytes = fs.readFileSync(resolvedPath);
  const uploadResult = await genai.files.upload({
    file: new Blob([videoBytes], { type: mimeType }),
    config: {
      displayName: `${id} — ${label}`,
      mimeType,
    },
  });

  const geminiFileUri = uploadResult.uri ?? "";
  console.log(`   ✅ Gemini File URI: ${geminiFileUri}`);

  // 3. Save to registry
  const reference: VideoReference = {
    id,
    gcs_uri: gcsUri,
    gemini_file_uri: geminiFileUri,
    label,
    quality,
    exercise,
    duration_seconds: null, // Could probe with ffprobe if available
    mime_type: mimeType,
    uploaded_at: new Date().toISOString(),
  };

  registry[exercise][quality].push(reference);
  saveRegistry(registry);

  console.log(`\n🎉 Reference "${id}" added!`);
  console.log(`   Exercise: ${exercise}`);
  console.log(`   Quality:  ${quality}`);
  console.log(`   Label:    ${label}`);
  console.log(`   GCS:      ${gcsUri}`);
  console.log(`   Gemini:   ${geminiFileUri}`);
}

function listReferences(flags: Record<string, string>) {
  const registry = loadRegistry();
  const filterExercise = flags.exercise;

  const exercises = filterExercise ? [filterExercise] : Object.keys(registry);

  let total = 0;
  for (const exercise of exercises) {
    const entry = registry[exercise];
    if (!entry) {
      console.log(`\n⚠️  No references for "${exercise}"`);
      continue;
    }

    console.log(`\n📋 ${exercise.toUpperCase()}`);

    for (const quality of VALID_QUALITIES) {
      const refs = entry[quality] ?? [];
      console.log(`  ${quality === "good" ? "✅" : "❌"} ${quality.toUpperCase()} (${refs.length})`);
      for (const ref of refs) {
        console.log(`     ${ref.id} — "${ref.label}"`);
        console.log(`       GCS: ${ref.gcs_uri}`);
        total++;
      }
    }
  }

  console.log(`\n📊 Total references: ${total}`);
}

async function removeReference(flags: Record<string, string>) {
  const id = flags.id;
  if (!id) {
    console.error("❌ --id is required");
    process.exit(1);
  }

  const registry = loadRegistry();
  let found = false;

  for (const exercise of Object.keys(registry)) {
    for (const quality of VALID_QUALITIES) {
      const refs = registry[exercise][quality] ?? [];
      const idx = refs.findIndex((r) => r.id === id);
      if (idx !== -1) {
        const ref = refs[idx];
        console.log(`🗑️  Removing "${ref.id}" (${ref.gcs_uri})...`);

        // Remove from GCS
        try {
          const storage = new Storage();
          const gcsPath = ref.gcs_uri.replace(`gs://${BUCKET_NAME}/`, "");
          await storage.bucket(BUCKET_NAME).file(gcsPath).delete();
          console.log(`   ✅ Deleted from GCS`);
        } catch (e) {
          console.warn(`   ⚠️  Could not delete from GCS: ${e}`);
        }

        refs.splice(idx, 1);
        found = true;
        break;
      }
    }
    if (found) break;
  }

  if (!found) {
    console.error(`❌ Reference "${id}" not found`);
    process.exit(1);
  }

  saveRegistry(registry);
  console.log(`✅ Removed.`);
}

async function reregisterAll() {
  console.log("🔄 Re-registering all references with Gemini File API...");
  console.log("   (Gemini File API files expire after 48h, run this to refresh)\n");

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing.");
    process.exit(1);
  }

  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const storage = new Storage();
  const registry = loadRegistry();
  let count = 0;

  for (const exercise of Object.keys(registry)) {
    for (const quality of VALID_QUALITIES) {
      const refs = registry[exercise]?.[quality] ?? [];
      for (const ref of refs) {
        try {
          // Download from GCS
          const gcsPath = ref.gcs_uri.replace(`gs://${BUCKET_NAME}/`, "");
          const [buffer] = await storage.bucket(BUCKET_NAME).file(gcsPath).download();

          // Re-upload to Gemini File API
          const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
          const uploadResult = await genai.files.upload({
            file: new Blob([uint8], { type: ref.mime_type }),
            config: {
              displayName: `${ref.id} — ${ref.label}`,
              mimeType: ref.mime_type,
            },
          });

          ref.gemini_file_uri = uploadResult.uri ?? "";
          count++;
          console.log(`   ✅ ${ref.id} → ${ref.gemini_file_uri}`);
        } catch (e) {
          console.error(`   ❌ ${ref.id}: ${e}`);
        }
      }
    }
  }

  saveRegistry(registry);
  console.log(`\n🎉 Re-registered ${count} files.`);
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  const { command, flags } = parseArgs();

  console.log("🎬 FormMax Video Reference Manager\n");

  switch (command) {
    case "add":
      await addReference(flags);
      break;
    case "list":
      listReferences(flags);
      break;
    case "remove":
      await removeReference(flags);
      break;
    case "reregister":
      await reregisterAll();
      break;
    default:
      console.log(`Usage:
  npx tsx scripts/manage_references.ts add \\
    --exercise deadlift --quality good --video ./clip.mp4 \\
    --label "Textbook form, side angle"

  npx tsx scripts/manage_references.ts add \\
    --exercise deadlift --quality bad --video ./bad.mp4 \\
    --label "Rounded back, bar drifts forward"

  npx tsx scripts/manage_references.ts list
  npx tsx scripts/manage_references.ts list --exercise deadlift
  npx tsx scripts/manage_references.ts remove --id deadlift_good_1
  npx tsx scripts/manage_references.ts reregister

Exercises: ${VALID_EXERCISES.join(", ")}
Qualities: good, bad

Environment:
  GEMINI_API_KEY                   Gemini API key
  GCS_BUCKET                       GCS bucket name (default: formmax-references)
  GOOGLE_APPLICATION_CREDENTIALS   Path to GCS service account JSON
`);
      break;
  }
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
