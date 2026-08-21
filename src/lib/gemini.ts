/**
 * Server-side Gemini API client.
 *
 * This module is imported ONLY by the two API routes — never by client
 * components. GEMINI_API_KEY is read here and never forwarded to the browser.
 *
 * Both exported functions return `unknown` so the API route is responsible
 * for JSON parsing and schema validation (Tasks 6 & 7).
 *
 * A 9-second Promise.race timeout is applied to every call. On timeout the
 * promise rejects with { code: "TIMEOUT" } so the route can return HTTP 504.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { DocumentAnalysis } from "@/lib/types";

// ─── Client initialisation ────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

// ─── Timeout helper ───────────────────────────────────────────────────────────

const TIMEOUT_MS = 9_000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject({ code: "TIMEOUT" }), TIMEOUT_MS)
  );
  return Promise.race([promise, timeout]);
}

// ─── Stage 1: document analysis ──────────────────────────────────────────────

/**
 * Send a document image to Gemini and return the raw parsed JSON response.
 * The prompt is a placeholder — Task 6 replaces it with the full prompt.
 *
 * @param imageBase64 - Raw base64 string (no data-URL prefix)
 * @param mimeType    - One of image/jpeg, image/png, image/webp, image/gif
 */
export async function analyzeDocument(
  imageBase64: string,
  mimeType: string
): Promise<unknown> {
  // Task 6 will replace this with buildStage1Prompt()
  const prompt =
    "Analyze this document image and return a JSON object. " +
    "Placeholder — full prompt added in Task 6.";

  const result = await withTimeout(
    model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ])
  );

  const text = result.response.text();
  return JSON.parse(text) as unknown;
}

// ─── Stage 2: eligibility reasoning + action plan ────────────────────────────

/**
 * Send the Stage 1 output and the user's answers to Gemini and return the
 * raw parsed JSON response.
 * The prompt is a placeholder — Task 6 replaces it with the full prompt.
 *
 * @param analysis - Validated DocumentAnalysis from Stage 1
 * @param answers  - User's answers keyed by ProfileQuestion id
 */
export async function generatePlan(
  analysis: DocumentAnalysis,
  answers: Record<string, string>
): Promise<unknown> {
  // Task 6 will replace this with buildStage2Prompt(analysis, answers)
  const prompt =
    "Given the following document analysis and user answers, produce an action plan JSON. " +
    "Document analysis: " +
    JSON.stringify(analysis) +
    "\nUser answers: " +
    JSON.stringify(answers) +
    "\nPlaceholder — full prompt added in Task 6.";

  const result = await withTimeout(model.generateContent(prompt));

  const text = result.response.text();
  return JSON.parse(text) as unknown;
}
