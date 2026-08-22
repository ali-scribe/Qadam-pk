"use client";

import EvidenceBlock from "@/components/EvidenceBlock";
import type {
  ApplicationStep,
  Deadline,
  DocumentAnalysis,
  EligibilityCriterion,
  Fee,
  RequiredDocument,
  Warning,
} from "@/lib/types";

interface SummaryStepProps {
  analysis: DocumentAnalysis;
  onContinue: () => void;
  onBack: () => void;
}

// ─── Small section wrapper ────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
      <h2 className="border-b border-gray-100 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-gray-500">
        {title}
      </h2>
      <div className="divide-y divide-gray-100">{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="bg-white px-4 py-3">{children}</div>;
}

function NotStated() {
  return (
    <span className="text-sm italic text-gray-400">Not stated in document</span>
  );
}

function NoneFoud() {
  return (
    <Row>
      <p className="text-sm italic text-gray-400">None found in document</p>
    </Row>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SummaryStep({
  analysis,
  onContinue,
  onBack,
}: SummaryStepProps) {

  // ── Path A: unreadable ────────────────────────────────────────────────────
  // 8.2 — readable === false: show message, no extraction fields, no Continue

  if (!analysis.readable) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Could not read document</h1>
          <p className="mt-2 text-sm text-gray-600">
            The image was too blurry, dark, or unclear to extract information.
            Please try a clearer or better-lit photo.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={onBack}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors min-h-[44px]"
            >
              Try a different image
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Path B: out of scope ──────────────────────────────────────────────────
  // 8.2 — documentScope === 'out_of_scope': show message, no Continue

  if (analysis.documentScope === "out_of_scope") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Document not recognised</h1>
          <p className="mt-2 text-sm text-gray-600">
            This does not appear to be a supported Pakistani institutional
            document (scholarship, government service, or university). Please
            try a different document.
          </p>
          <div className="mt-6">
            <button
              onClick={onBack}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors min-h-[44px]"
            >
              Try a different document
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Path C: normal extraction ─────────────────────────────────────────────
  // 8.3–8.6 — readable and in_scope: render all extracted fields

  const {
    documentType,
    purpose,
    eligibilityCriteria,
    requiredDocuments,
    deadlines,
    fees,
    applicationSteps,
    warnings,
    unknownFields,
  } = analysis;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">

      {/* ── Document identity ── */}
      <div className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-gray-100">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
          Document identified
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900">
          {documentType ?? <NotStated />}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {purpose ?? <NotStated />}
        </p>
      </div>

      {/* ── Eligibility criteria ── */}
      <Section title="Eligibility criteria">
        {eligibilityCriteria.length === 0 ? (
          <NoneFoud />
        ) : (
          eligibilityCriteria.map((c: EligibilityCriterion) => (
            <Row key={c.id}>
              <p className="text-sm text-gray-800">{c.description}</p>
              {c.evidence ? <EvidenceBlock evidence={c.evidence} /> : null}
            </Row>
          ))
        )}
      </Section>

      {/* ── Required documents ── */}
      <Section title="Required documents">
        {requiredDocuments.length === 0 ? (
          <NoneFoud />
        ) : (
          requiredDocuments.map((d: RequiredDocument) => (
            <Row key={d.id}>
              <p className="text-sm text-gray-800">{d.description}</p>
              {d.evidence ? <EvidenceBlock evidence={d.evidence} /> : null}
            </Row>
          ))
        )}
      </Section>

      {/* ── Deadlines ── */}
      <Section title="Deadlines">
        {deadlines.length === 0 ? (
          <NoneFoud />
        ) : (
          deadlines.map((dl: Deadline, i: number) => (
            <Row key={i}>
              <p className="text-sm font-medium text-gray-500">{dl.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                {dl.date ?? <NotStated />}
              </p>
              {dl.evidence ? <EvidenceBlock evidence={dl.evidence} /> : null}
            </Row>
          ))
        )}
      </Section>

      {/* ── Fees ── */}
      <Section title="Fees">
        {fees.length === 0 ? (
          <NoneFoud />
        ) : (
          fees.map((f: Fee, i: number) => (
            <Row key={i}>
              <p className="text-sm font-medium text-gray-500">{f.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                {f.amount ?? <NotStated />}
              </p>
              {f.evidence ? <EvidenceBlock evidence={f.evidence} /> : null}
            </Row>
          ))
        )}
      </Section>

      {/* ── Application steps ── */}
      <Section title="Application steps">
        {applicationSteps.length === 0 ? (
          <NoneFoud />
        ) : (
          applicationSteps
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((s: ApplicationStep) => (
              <Row key={s.order}>
                <div className="flex gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 mt-0.5">
                    {s.order}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800">{s.description}</p>
                    {s.evidence ? <EvidenceBlock evidence={s.evidence} /> : null}
                  </div>
                </div>
              </Row>
            ))
        )}
      </Section>

      {/* ── Warnings ── */}
      {warnings.length > 0 && (
        <Section title="Warnings">
          {warnings.map((w: Warning, i: number) => (
            <Row key={i}>
              <p className="text-sm text-red-700">{w.description}</p>
              {w.evidence ? <EvidenceBlock evidence={w.evidence} /> : null}
            </Row>
          ))}
        </Section>
      )}

      {/* ── Unknown fields — 8.5 ── */}
      {unknownFields.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Could not determine from document
          </p>
          <ul className="mt-2 space-y-1">
            {unknownFields.map((f: string) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-gray-300">–</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Continue / back — 8.6 ── */}
      {/* Button shown only when readable and in_scope (guaranteed by reaching path C) */}
      <div className="flex gap-3 pb-10">
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          ← Back
        </button>
        <button
          onClick={onContinue}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors min-h-[44px]"
        >
          Continue to questions →
        </button>
      </div>
    </div>
  );
}
