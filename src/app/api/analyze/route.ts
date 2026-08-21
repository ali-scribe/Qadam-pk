import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/gemini";

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
    // Task 7 adds isDocumentAnalysis() validation before returning
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    // Timeout
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: unknown }).code === "TIMEOUT"
    ) {
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
      return NextResponse.json(
        { error: "The AI returned an unexpected response. Please try again." },
        { status: 500 }
      );
    }

    // Gemini API error (non-2xx from the upstream API)
    return NextResponse.json(
      {
        error:
          "The document analysis service is temporarily unavailable. Please try again.",
      },
      { status: 502 }
    );
  }
}
