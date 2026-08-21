import { NextRequest, NextResponse } from "next/server";
import { generatePlan } from "@/lib/gemini";
import type { DocumentAnalysis } from "@/lib/types";

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

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const { documentAnalysis, userAnswers } = body as Record<string, unknown>;

  if (
    typeof documentAnalysis !== "object" ||
    documentAnalysis === null
  ) {
    return NextResponse.json(
      { error: "Missing or invalid field: documentAnalysis." },
      { status: 400 }
    );
  }

  if (
    typeof userAnswers !== "object" ||
    userAnswers === null
  ) {
    return NextResponse.json(
      { error: "Missing or invalid field: userAnswers." },
      { status: 400 }
    );
  }

  // ── 2. Call Gemini ───────────────────────────────────────────────────────
  try {
    const result = await generatePlan(
      documentAnalysis as DocumentAnalysis,
      userAnswers as Record<string, string>
    );
    // Task 7 adds isActionPlan() validation before returning
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
        { error: "The plan took too long to generate. Please try again." },
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

    // Gemini API error
    return NextResponse.json(
      {
        error:
          "The plan generation service is temporarily unavailable. Please try again.",
      },
      { status: 502 }
    );
  }
}
