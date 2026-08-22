import { NextRequest, NextResponse } from "next/server";
import { generatePlan } from "@/lib/gemini";
import type { DocumentAnalysis } from "@/lib/types";
import { isActionPlan } from "@/lib/validate";

export const maxDuration = 30;

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
    // 7.4 — validate ActionPlan shape
    if (!isActionPlan(result)) {
      return NextResponse.json(
        { error: "AI returned an unrecognized response structure. Please try again." },
        { status: 500 }
      );
    }
    // 7.4 — Stage 2 rule: no criterion may appear in satisfiedCriteria
    // unless the user actually provided an answer for it. We check by
    // comparing satisfiedCriteria text against the questionsForUser ids
    // in the incoming documentAnalysis. Any satisfied criterion whose
    // corresponding question id has no answer in userAnswers is a violation.
    const answers = userAnswers as Record<string, string>;
    const analysis = documentAnalysis as DocumentAnalysis;
    const questionIds = new Set(
      analysis.questionsForUser?.map((q: { id: string }) => q.id) ?? []
    );
    for (const sc of result.satisfiedCriteria) {
      // Find the question whose relevantCriterionId matches a criterion with
      // this text. If the question exists and has no answer, reject.
      const relatedQuestion = analysis.questionsForUser?.find(
        (q: { relevantCriterionId: string; id: string }) =>
          questionIds.has(q.id) &&
          analysis.eligibilityCriteria?.some(
            (c: { id: string; description: string }) =>
              c.id === q.relevantCriterionId &&
              c.description === sc.text
          )
      );
      if (relatedQuestion) {
        const answer = answers[relatedQuestion.id];
        if (answer === undefined || answer === null || answer === "") {
          return NextResponse.json(
            { error: "AI returned an unrecognized response structure. Please try again." },
            { status: 500 }
          );
        }
      }
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
        console.error("[Qadam/plan] Gemini timeout (15 s exceeded)");
      }
      return NextResponse.json(
        { error: "The plan took too long to generate. Please try again." },
        { status: 504 }
      );
    }

    // JSON parse failure from gemini.ts
    if (err instanceof SyntaxError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Qadam/plan] JSON parse error:", err.message);
      }
      return NextResponse.json(
        { error: "The AI returned an unexpected response. Please try again." },
        { status: 500 }
      );
    }

    // Gemini API error
    if (process.env.NODE_ENV === "development") {
      console.error("[Qadam/plan] Gemini API error:", err);
    }
    return NextResponse.json(
      {
        error:
          "The plan generation service is temporarily unavailable. Please try again.",
      },
      { status: 502 }
    );
  }
}
