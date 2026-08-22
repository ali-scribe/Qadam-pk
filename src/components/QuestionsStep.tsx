"use client";

import { useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import type { DocumentAnalysis, ProfileQuestion } from "@/lib/types";

interface QuestionsStepProps {
  analysis: DocumentAnalysis;
  /** Called with answers map on valid submission. Throws on API error. */
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  onBack: () => void;
  /** When provided (example sessions), pre-fills all answer fields. */
  initialAnswers?: Record<string, string>;
}

export default function QuestionsStep({
  analysis,
  onSubmit,
  onBack,
  initialAnswers,
}: QuestionsStepProps) {
  const questions = analysis.questionsForUser;

  const [answers, setAnswers] = useState<Record<string, string>>(
    initialAnswers ?? {}
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Answer change handler ─────────────────────────────────────────────────

  function handleChange(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    // Clear per-field error as soon as the user types
    if (fieldErrors[id]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  // ── Submission ────────────────────────────────────────────────────────────

  async function submitAnswers(finalAnswers: Record<string, string>) {
    setApiError(null);
    setLoading(true);
    try {
      await onSubmit(finalAnswers);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    // 9.4 — validate required fields before any API call
    const errors: Record<string, string> = {};
    for (const q of questions) {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val.trim() === "") {
          errors[q.id] = `"${q.question}" is required.`;
        }
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    await submitAnswers(answers);
  }

  // ── Render a single question field ────────────────────────────────────────

  function renderField(q: ProfileQuestion) {
    const baseInput =
      "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[44px]";
    const hasError = !!fieldErrors[q.id];

    switch (q.fieldType) {
      case "boolean":
        return (
          <div className="flex gap-6 mt-1">
            {["Yes", "No"].map((opt) => {
              const val = opt.toLowerCase();
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={val}
                    checked={answers[q.id] === val}
                    onChange={() => handleChange(q.id, val)}
                    disabled={loading}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        );

      case "select":
        return (
          <select
            id={q.id}
            value={answers[q.id] ?? ""}
            onChange={(e) => handleChange(q.id, e.target.value)}
            disabled={loading}
            className={`${baseInput} ${hasError ? "border-red-400" : ""}`}
          >
            <option value="" disabled>
              Select an option…
            </option>
            {(q.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "number":
        return (
          <input
            id={q.id}
            type="number"
            value={answers[q.id] ?? ""}
            onChange={(e) => handleChange(q.id, e.target.value)}
            disabled={loading}
            className={`${baseInput} ${hasError ? "border-red-400" : ""}`}
          />
        );

      default: // "text"
        return (
          <input
            id={q.id}
            type="text"
            value={answers[q.id] ?? ""}
            onChange={(e) => handleChange(q.id, e.target.value)}
            disabled={loading}
            className={`${baseInput} ${hasError ? "border-red-400" : ""}`}
          />
        );
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">A few questions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Based on{" "}
          <strong>{analysis.documentType ?? "this document"}</strong>, Qadam
          needs a few answers to assess your eligibility.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        {/* 9.2 — empty questionsForUser */}
        {questions.length === 0 ? (
          <div>
            <p className="text-sm text-gray-600">
              No profile questions are needed for this document.
            </p>
            {apiError && (
              <div className="mt-4">
                <ErrorMessage
                  message={apiError}
                  onRetry={() => { setApiError(null); setLoading(false); }}
                  onBack={onBack}
                />
              </div>
            )}
            {loading && (
              <div className="mt-4 flex justify-center">
                <LoadingSpinner label="Generating your action plan..." />
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onBack}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px] disabled:opacity-50"
              >
                ← Back
              </button>
              <button
                onClick={() => void submitAnswers({})}
                disabled={loading}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generating…" : "Generate action plan →"}
              </button>
            </div>
          </div>
        ) : (
          /* 9.3–9.6 — dynamic form */
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {questions.map((q) => (
              <div key={q.id}>
                {/* Label with asterisk for required — 9.3 */}
                <label
                  htmlFor={q.fieldType !== "boolean" ? q.id : undefined}
                  className="block text-sm font-medium text-gray-800"
                >
                  {q.question}
                  {q.required && (
                    <span
                      className="ml-1 text-red-500"
                      aria-label="required"
                    >
                      *
                    </span>
                  )}
                </label>

                {/* Field */}
                <div className="mt-1">{renderField(q)}</div>

                {/* Per-field validation error — 9.4 */}
                {fieldErrors[q.id] && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {fieldErrors[q.id]}
                  </p>
                )}
              </div>
            ))}

            {/* API error — 9.7 */}
            {apiError && (
              <ErrorMessage
                message={apiError}
                onRetry={() => {
                  setApiError(null);
                  setLoading(false);
                }}
                onBack={onBack}
              />
            )}

            {/* Loading — 9.6 */}
            {loading && (
              <div className="flex justify-center">
                <LoadingSpinner label="Generating your action plan..." />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px] disabled:opacity-50"
              >
                ← Back
              </button>
              {/* Submit — disabled while loading — 9.6 */}
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generating…" : "Generate action plan →"}
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">
        Qadam is not a legal advisor. Always verify with the issuing authority.
      </p>
    </div>
  );
}
