#!/usr/bin/env npx tsx
/**
 * Reference Video Embedding Script
 * 
 * Pre-embeds a "gold standard" exercise video using Gemini Embedding 2.
 * The resulting 3072-dim vector is stored in data/references.json.
 * 
 * Usage:
 *   npx tsx scripts/embed_reference.ts --exercise deadlift --video ./proper_deadlift.mp4
 * 
 * Requirements:
 *   - GEMINI_API_KEY in .env.local or environment
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Load environment variables from .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });
}

const EMBEDDING_MODEL = "gemini-embedding-2-preview";
const EMBEDDING_DIMENSIONS = 3072;
const REFERENCES_PATH = path.join(__dirname, "..", "data", "references.json");

type ReferenceRecord = {
  name: string;
  embedding: number[];
  source_video: string;
  embedded_at: string;
  model: string;
  dimensions: number;
};

// --- Parse CLI Args ---
function parseArgs(): { exercise: string; video: string } {
  const args = process.argv.slice(2);
  let exercise = "";
  let video = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--exercise" && args[i + 1]) {
      exercise = args[i + 1];
      i++;
    } else if (args[i] === "--video" && args[i + 1]) {
      video = args[i + 1];
      i++;
    }
  }

  if (!exercise || !video) {
    console.error("Usage: npx tsx scripts/embed_reference.ts --exercise <name> --video <path>");
    console.error("Example: npx tsx scripts/embed_reference.ts --exercise deadlift --video ./proper_deadlift.mp4");
    process.exit(1);
  }

  const isRemote = /^https?:\/\//i.test(video);
  if (isRemote) {
    return { exercise, video };
  }

  const resolvedVideo = path.resolve(video);
  if (!fs.existsSync(resolvedVideo)) {
    console.error(`❌ Video file not found: ${resolvedVideo}`);
    process.exit(1);
  }

  return { exercise, video: resolvedVideo };
}

async function resolveVideoPath(videoArg: string): Promise<{ videoPath: string; cleanupPath: string | null }> {
  if (!/^https?:\/\//i.test(videoArg)) {
    return { videoPath: videoArg, cleanupPath: null };
  }

  console.log("🌐 Downloading remote reference video...");
  const response = await fetch(videoArg);
  if (!response.ok) {
    throw new Error(`Failed to download remote video: ${response.status} ${response.statusText}`);
  }

  const fileName = path.basename(new URL(videoArg).pathname) || `reference_${Date.now()}.mp4`;
  const tempPath = path.join(os.tmpdir(), `${Date.now()}_${fileName}`);
  const bytes = await response.arrayBuffer();
  fs.writeFileSync(tempPath, Buffer.from(bytes));
  console.log(`   ✅ Downloaded to: ${tempPath}`);

  return { videoPath: tempPath, cleanupPath: tempPath };
}

async function main() {
  const { exercise, video } = parseArgs();
  const { videoPath, cleanupPath } = await resolveVideoPath(video);

  console.log(`🎬 FORMAX Reference Embedding`);
  console.log(`   Exercise: ${exercise}`);
  console.log(`   Video:    ${videoPath}`);
  console.log(`   Model:    ${EMBEDDING_MODEL}`);
  console.log(`   Dims:     ${EMBEDDING_DIMENSIONS}`);
  console.log();

  try {
    // Initialize Gemini using API key from environment/.env.local
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing. Add it to .env.local before embedding references.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Step 1: Read video and build inline part
    console.log("📦 Reading video bytes...");
    const videoBytes = fs.readFileSync(videoPath);
    const mimeType = path.extname(videoPath).toLowerCase() === ".mov" ? "video/quicktime" : "video/mp4";
    const videoPart = {
      inlineData: {
        mimeType,
        data: videoBytes.toString("base64"),
      },
    };

    // Step 2: Generate embedding
    console.log("🧠 Generating embedding with Gemini Embedding 2...");
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [videoPart],
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    });

    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) {
      console.error("❌ Failed to generate embedding");
      process.exit(1);
    }
    console.log(`   ✅ Embedding generated: ${embedding.length} dimensions`);

    // Step 3: Save to references.json
    console.log("💾 Saving to references.json...");

    // Ensure data directory exists
    const dataDir = path.dirname(REFERENCES_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Load existing references or start fresh
    let references: Record<string, ReferenceRecord> = {};
    if (fs.existsSync(REFERENCES_PATH)) {
      references = JSON.parse(fs.readFileSync(REFERENCES_PATH, "utf-8"));
    }

    // Store the embedding
    references[exercise] = {
      name: exercise.charAt(0).toUpperCase() + exercise.slice(1).replace(/_/g, " "),
      embedding: Array.from(embedding),
      source_video: /^https?:\/\//i.test(video) ? video : path.basename(videoPath),
      embedded_at: new Date().toISOString(),
      model: EMBEDDING_MODEL,
      dimensions: embedding.length,
    };

    fs.writeFileSync(REFERENCES_PATH, JSON.stringify(references, null, 2));
    console.log(`   ✅ Saved to ${REFERENCES_PATH}`);

    console.log();
    console.log(`🎉 Done! "${exercise}" reference embedding is ready.`);
    console.log(`   Similarity comparisons will now use this real embedding.`);
    console.log();
    console.log(`   To add more exercises, run:`);
    console.log(`   npx tsx scripts/embed_reference.ts --exercise squat --video ./squat.mp4`);
  } finally {
    if (cleanupPath && fs.existsSync(cleanupPath)) {
      fs.unlinkSync(cleanupPath);
      console.log(`   🧹 Removed temporary download: ${cleanupPath}`);
    }
  }
}

main().catch((err) => {
  console.error("💥 Fatal error:", err.message || err);
  process.exit(1);
});
