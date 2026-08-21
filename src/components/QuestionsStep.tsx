"use client";

// Placeholder — full implementation in Task 9.
// Renders the dynamic profile-questions form from DocumentAnalysis.questionsForUser.

import type { DocumentAnalysis } from "@/lib/types";

interface QuestionsStepProps {
  analysis: DocumentAnalysis;
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  onBack: () => void;
}

export default function QuestionsStep({ analysis, onSubmit, onBack }: QuestionsStepProps) {
  async function handleSkip() {
    await onSubmit({});
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h1 className="text-xl font-bold text-gray-900">A few questions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Based on <strong>{analysis.documentType ?? "this document"}</strong>, Qadam needs a few answers to assess your eligibility.
        </p>
        <p className="mt-4 text-sm text-gray-400">
          Dynamic question form coming in Task 9.
          {analysis.questionsForUser.length > 0
            ? ` (${analysis.questionsForUser.length} question${analysis.questionsForUser.length !== 1 ? "s" : ""} found)`
            : " (No questions generated for this document)"}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            ← Back
          </button>
          <button
            onClick={handleSkip}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors min-h-[44px]"
          >
            Generate action plan →
          </button>
        </div>
      </div>
    </div>
  );
}
