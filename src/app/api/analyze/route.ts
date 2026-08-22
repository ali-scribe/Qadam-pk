import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/gemini";
import { isDocumentAnalysis } from "@/lib/validate";

export const maxDuration = 30;

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Parse and validate input ──────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("imageBase64" in body) ||
    !("mimeType" in body)
  ) {
    return NextResponse.json(
      { error: "Missing required fields: imageBase64 and mimeType." },
      { status: 400 }
    );
  }

  const { imageBase64, mimeType } = body as Record<string, unknown>;

  if (typeof imageBase64 !== "string" || imageBase64.trim() === "") {
    return NextResponse.json(
      { error: "imageBase64 must be a non-empty string." },
      { status: 400 }
    );
  }

  if (typeof mimeType !== "string" || !ACCEPTED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      {
        error:
          "mimeType must be one of: image/jpeg, image/png, image/webp, image/gif.",
      },
      { status: 400 }
    );
  }

  // ── 2. Call Gemini ───────────────────────────────────────────────────────
  try {
    const result = await analyzeDocument(imageBase64, mimeType);
    // 7.3 — validate shape before returning to client
    if (!isDocumentAnalysis(result)) {
      return NextResponse.json(
        { error: "AI returned an unrecognized response structure. Please try again." },
        { status: 500 }
      );
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    // Timeout
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: unknown }).code === "TIMEOUT"
    ) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Qadam/analyze] Gemini timeout (15 s exceeded)");
      }
      return NextResponse.json(
        {
          error:
            "The analysis took too long. Please try again with a clearer image.",
        },
        { status: 504 }
      );
    }

    // JSON parse failure from gemini.ts
    if (err instanceof SyntaxError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Qadam/analyze] JSON parse error:", err.message);
      }
      return NextResponse.json(
        { error: "The AI returned an unexpected response. Please try again." },
        { status: 500 }
      );
    }

    // Gemini API error (non-2xx from the upstream API)
    if (process.env.NODE_ENV === "development") {
      console.error("[Qadam/analyze] Gemini API error:", err);
    }
    return NextResponse.json(
      {
        error:
          "The document analysis service is temporarily unavailable. Please try again.",
      },
      { status: 502 }
    );
  }
}
