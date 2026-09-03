/**
 * Server-side Gemini API client.
 *
 * This module is imported ONLY by the two API routes — never by client
 * components. GEMINI_API_KEY is read here and never forwarded to the browser.
 *
 * Both exported functions return `unknown` so the API route is responsible
 * for JSON parsing and schema validation (Task 7).
 *
 * A 20-second Promise.race timeout is applied to every call. On timeout the
 * promise rejects with { code: "TIMEOUT" } so the route can return HTTP 504.
 *
 * SDK: @google/genai (replaces deprecated @google/generative-ai)
 */

import { GoogleGenAI } from "@google/genai";
import type { DocumentAnalysis } from "@/lib/types";
import { buildStage1Prompt, buildStage2Prompt } from "@/lib/prompts";

// ─── Client initialisation ────────────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

const MODEL = "gemini-3.6-flash";

// ─── Timeout helper ───────────────────────────────────────────────────────────

const TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject({ code: "TIMEOUT" }), TIMEOUT_MS)
  );
  return Promise.race([promise, timeout]);
}

// ─── Stage 1: document analysis ──────────────────────────────────────────────

/**
 * Send a document image to Gemini and return the raw parsed JSON response.
 *
 * @param imageBase64 - Raw base64 string (no data-URL prefix)
 * @param mimeType    - One of image/jpeg, image/png, image/webp, image/gif
 */
export async function analyzeDocument(
  imageBase64: string,
  mimeType: string
): Promise<unknown> {
  const prompt = buildStage1Prompt();

  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    })
  );

  const text = response.text ?? "";
  if (process.env.NODE_ENV === "development") {
    console.log("[Qadam/analyze] raw Gemini response text:", text.slice(0, 500));
  }
  return JSON.parse(text) as unknown;
}

// ─── Stage 2: eligibility reasoning + action plan ────────────────────────────

/**
 * Send the Stage 1 output and the user's answers to Gemini and return the
 * raw parsed JSON response.
 *
 * @param analysis - Validated DocumentAnalysis from Stage 1
 * @param answers  - User's answers keyed by ProfileQuestion id
 */
export async function generatePlan(
  analysis: DocumentAnalysis,
  answers: Record<string, string>
): Promise<unknown> {
  const prompt = buildStage2Prompt(analysis, answers);

  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    })
  );

  const text = response.text ?? "";
  if (process.env.NODE_ENV === "development") {
    console.log("[Qadam/plan] raw Gemini response text:", text.slice(0, 500));
  }
  return JSON.parse(text) as unknown;
}
