"use client";

import EvidenceBlock from "@/components/EvidenceBlock";
import type { ActionPlan, DocumentAnalysis, EligibilityVerdict } from "@/lib/types";

// ─── Verdict config ───────────────────────────────────────────────────────────

const VERDICT_CONFIG: Record<
  EligibilityVerdict,
  { label: string; bg: string; border: string; text: string; icon: string }
> = {
  likely_eligible: {
    label: "Likely Eligible",
    bg: "bg-green-50",
    border: "border-green-500",
    text: "text-green-800",
    icon: "✓",
  },
  likely_not_eligible: {
    label: "Likely Not Eligible",
    bg: "bg-red-50",
    border: "border-red-500",
    text: "text-red-800",
    icon: "✗",
  },
  cannot_determine: {
    label: "Cannot Determine",
    bg: "bg-amber-50",
    border: "border-amber-500",
    text: "text-amber-800",
    icon: "?",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlanStepProps {
  plan: ActionPlan;
  analysis: DocumentAnalysis;
  onReset: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlanStep({ plan, analysis, onReset }: PlanStepProps) {
  const verdict = VERDICT_CONFIG[plan.eligibilityVerdict];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">

      {/* ── Document identity ── */}
      <div className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-gray-100">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
          Document identified
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900">
          {analysis.documentType ?? "Unknown document type"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {analysis.purpose ?? "Purpose not stated in document"}
        </p>
        {analysis.unknownFields.length > 0 && (
          <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-sm font-medium text-gray-500">
              Could not determine from document
            </p>
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              {analysis.unknownFields.map((f) => (
                <li key={f} className="text-sm text-gray-500">{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Eligibility verdict ── */}
      <div className={`rounded-2xl border-l-4 px-6 py-5 shadow-sm ${verdict.bg} ${verdict.border}`}>
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold ${verdict.border} ${verdict.text}`}
            aria-hidden="true"
          >
            {verdict.icon}
          </span>
          <h2 className={`text-xl font-bold ${verdict.text}`}>{verdict.label}</h2>
        </div>
        <p className={`mt-3 text-sm leading-relaxed ${verdict.text}`}>
          {plan.verdictRationale || "Rationale not provided"}
        </p>
      </div>

      {/* Disclaimer — standalone below verdict card, always visible at 375px */}
      <p className="text-sm text-gray-500 italic">
        Qadam is not a legal advisor. Always verify your eligibility directly
        with the issuing authority before submitting.
      </p>

      {/* ── Criteria breakdown ── */}
      <section aria-labelledby="criteria-heading">
        <h2 id="criteria-heading" className="mb-4 text-lg font-bold text-gray-900">
          Eligibility breakdown
        </h2>
        <div className="space-y-4">
          <CriteriaSection
            heading="Criteria you meet"
            headingColor="text-green-700"
            bgColor="bg-green-50"
            borderColor="border-green-200"
            icon="✓"
            iconColor="text-green-600"
            items={plan.satisfiedCriteria.map((c) => ({ text: c.text, sub: null, evidence: c.evidence }))}
          />
          <CriteriaSection
            heading="Criteria not met"
            headingColor="text-red-700"
            bgColor="bg-red-50"
            borderColor="border-red-200"
            icon="✗"
            iconColor="text-red-500"
            items={plan.unmetCriteria.map((c) => ({ text: c.text, sub: c.reason, evidence: c.evidence }))}
          />
          <CriteriaSection
            heading="Could Not Be Determined"
            headingColor="text-amber-700"
            bgColor="bg-amber-50"
            borderColor="border-amber-200"
            icon="?"
            iconColor="text-amber-600"
            items={plan.unknownCriteria.map((c) => ({
              text: c.text,
              sub: "Your answer was insufficient to confirm this criterion.",
              evidence: c.evidence,
            }))}
          />
        </div>
      </section>

      {/* ── Action plan ── */}
      <section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="mb-1 text-lg font-bold text-gray-900">
          What to do next
        </h2>
        <p className="mb-5 text-sm text-gray-500">
          Ordered by urgency and dependency — do these in sequence.
        </p>
        {plan.actionItems.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500">
            No specific action items could be determined from this document.
          </div>
        ) : (
          <ol className="space-y-4">
            {plan.actionItems.map((item, index) => (
              <li
                key={index}
                className="flex gap-4 rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-100"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 mt-0.5">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                    {item.deadline && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {item.deadline}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                  {item.evidence && <EvidenceBlock evidence={item.evidence} />}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ── Required documents ── */}
      <section aria-labelledby="docs-heading">
        <h2 id="docs-heading" className="mb-4 text-lg font-bold text-gray-900">
          Documents you will need
        </h2>
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
          {analysis.requiredDocuments.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-500">None found in document</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {analysis.requiredDocuments.map((d) => (
                <li key={d.id} className="px-5 py-3">
                  <p className="text-sm text-gray-800">{d.description}</p>
                  {d.evidence && <EvidenceBlock evidence={d.evidence} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Deadlines ── */}
      <section aria-labelledby="deadlines-heading">
        <h2 id="deadlines-heading" className="mb-4 text-lg font-bold text-gray-900">
          Key deadlines
        </h2>
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
          {analysis.deadlines.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-500">Deadline: Not stated in document</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {analysis.deadlines.map((dl, i) => (
                <li key={i} className="flex items-start gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{dl.label}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {dl.date ?? (
                        <span className="font-normal text-gray-400">Not stated in document</span>
                      )}
                    </p>
                    {dl.evidence && <EvidenceBlock evidence={dl.evidence} />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Warnings ── */}
      {analysis.warnings.length > 0 && (
        <section aria-labelledby="warnings-heading">
          <h2 id="warnings-heading" className="mb-4 text-lg font-bold text-gray-900">
            Important warnings
          </h2>
          <div className="rounded-2xl border border-red-200 bg-red-50 overflow-hidden">
            <ul className="divide-y divide-red-100">
              {analysis.warnings.map((w, i) => (
                <li key={i} className="px-5 py-3">
                  <p className="text-sm text-red-800">{w.description}</p>
                  {w.evidence && <EvidenceBlock evidence={w.evidence} />}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Start over ── */}
      <div className="flex justify-center pt-4 pb-10">
        <button
          onClick={onReset}
          className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          ← Analyse another document
        </button>
      </div>
    </div>
  );
}

// ─── CriteriaSection ──────────────────────────────────────────────────────────

interface CriteriaItem {
  text: string;
  sub: string | null;
  evidence: string | null;
}

interface CriteriaSectionProps {
  heading: string;
  headingColor: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  iconColor: string;
  items: CriteriaItem[];
}

function CriteriaSection({
  heading, headingColor, bgColor, borderColor, icon, iconColor, items,
}: CriteriaSectionProps) {
  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} overflow-hidden`}>
      <div className={`px-4 py-2.5 border-b ${borderColor}`}>
        <h3 className={`text-sm font-semibold ${headingColor}`}>{heading}</h3>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-500">None</p>
      ) : (
        <ul className="divide-y divide-white/60">
          {items.map((item, i) => (
            <li key={i} className="px-4 py-3">
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 flex-shrink-0 text-sm font-bold ${iconColor}`} aria-hidden="true">
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-gray-800">{item.text}</p>
                  {item.sub && <p className="mt-0.5 text-sm text-gray-500">{item.sub}</p>}
                  {item.evidence && <EvidenceBlock evidence={item.evidence} />}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
