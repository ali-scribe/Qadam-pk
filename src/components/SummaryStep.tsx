"use client";

// Placeholder — full implementation in Task 8.
// Renders once Stage 1 returns a DocumentAnalysis.

import type { DocumentAnalysis } from "@/lib/types";

interface SummaryStepProps {
  analysis: DocumentAnalysis;
  onContinue: () => void;
  onBack: () => void;
}

export default function SummaryStep({ analysis, onContinue, onBack }: SummaryStepProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
          Document identified
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900">
          {analysis.documentType ?? "Unknown document type"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {analysis.purpose ?? "Purpose not stated in document"}
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Full document summary and evidence display coming in Task 8.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            ← Back
          </button>
          <button
            onClick={onContinue}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors min-h-[44px]"
          >
            Continue to questions →
          </button>
        </div>
      </div>
    </div>
  );
}
