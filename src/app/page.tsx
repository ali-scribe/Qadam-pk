"use client";

import { PipelineProvider } from "@/context/PipelineContext";
import { usePipeline } from "@/hooks/usePipeline";
import UploadStep from "@/components/UploadStep";
import SummaryStep from "@/components/SummaryStep";
import QuestionsStep from "@/components/QuestionsStep";
import PlanStep from "@/components/PlanStep";
import { MOCK_ACTION_PLAN } from "@/lib/mockData";
import { isDocumentAnalysis } from "@/lib/validate";

// ─── Header ──────────────────────────────────────────────────────────────────

function Header() {
  const { stage, reset } = usePipeline();
  const showReset = stage !== "upload";

  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
        <button
          onClick={reset}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="Go to home"
        >
          <span className="text-xl font-bold tracking-tight text-gray-900">Qadam</span>
          <span className="text-xl" aria-hidden="true">قدم</span>
        </button>

        {showReset && (
          <button
            onClick={reset}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px] flex items-center"
          >
            ← New document
          </button>
        )}
      </div>
    </header>
  );
}

// ─── Pipeline steps ───────────────────────────────────────────────────────────

function PipelineShell() {
  const {
    stage,
    documentAnalysis,
    actionPlan,
    setDocumentAnalysis,
    setUserAnswers,
    setActionPlan,
    goTo,
    reset,
  } = usePipeline();

  // ── Stage: upload ──────────────────────────────────────────────────────────

  if (stage === "upload") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        {/* Landing intro — only shown at upload stage */}
        <section className="mx-auto max-w-4xl px-4 pt-12 pb-6 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-emerald-600">
            Pakistan-focused AI
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Know what comes next.
          </h1>
          <p className="mx-auto max-w-xl text-lg text-gray-600">
            Upload any Pakistani government, university, or scholarship document.
            Qadam reads it, reasons about your eligibility, and gives you a
            clear, evidence-backed action plan.
          </p>
          <p className="mt-4 text-sm text-gray-400">
            No sign-up required · No data stored · Evidence shown for every claim
          </p>
        </section>

        {/* Upload form */}
        <UploadStep
          onAnalyze={async (base64, mimeType) => {
            const res = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageBase64: base64, mimeType }),
            });
            const data: unknown = await res.json();
            if (!res.ok) {
              const msg =
                typeof data === "object" &&
                data !== null &&
                "error" in data &&
                typeof (data as { error: unknown }).error === "string"
                  ? (data as { error: string }).error
                  : "Something went wrong. Please try again.";
              throw new Error(msg);
            }
            if (isDocumentAnalysis(data)) {
              setDocumentAnalysis(data);
            } else {
              throw new Error(
                "AI returned an unrecognized response structure. Please try again."
              );
            }
          }}
        />

        {/* How it works */}
        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="mb-8 text-center text-xl font-bold text-gray-900">How Qadam works</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", title: "Upload a document", description: "Take a photo or screenshot of any Pakistani scholarship, government, or university document." },
              { step: "2", title: "AI reads it for you", description: "Qadam extracts eligibility criteria, deadlines, fees, required documents, and application steps." },
              { step: "3", title: "Answer a few questions", description: "We ask only what's relevant to your specific document — not a generic form." },
              { step: "4", title: "Get your action plan", description: "See exactly what you qualify for, what you're missing, and what to do next — with evidence." },
            ].map(({ step, title, description }) => (
              <div key={step} className="flex flex-col">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {step}
                </div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-gray-100 py-8">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <p className="text-sm text-gray-400">
              Qadam is not a legal advisor. Always verify your eligibility with the issuing authority.
            </p>
            <p className="mt-1 text-xs text-gray-300">Built for the Build with Kiro 2026 Hackathon</p>
          </div>
        </footer>
      </div>
    );
  }

  // ── Stage: summary ─────────────────────────────────────────────────────────

  if (stage === "summary") {
    if (!documentAnalysis) { reset(); return null; }

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <SummaryStep
          analysis={documentAnalysis}
          onContinue={() => goTo("questions")}
          onBack={() => goTo("upload")}
        />
      </div>
    );
  }

  // ── Stage: questions ───────────────────────────────────────────────────────

  if (stage === "questions") {
    if (!documentAnalysis) { reset(); return null; }

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <QuestionsStep
          analysis={documentAnalysis}
          onSubmit={async (answers) => {
            setUserAnswers(answers);
            // TODO (Task 9): POST to /api/plan and call setActionPlan(result)
            // For now, load mock data to demonstrate the full pipeline flow
            setActionPlan(MOCK_ACTION_PLAN);
          }}
          onBack={() => goTo("summary")}
        />
      </div>
    );
  }

  // ── Stage: plan ────────────────────────────────────────────────────────────

  if (stage === "plan") {
    if (!actionPlan || !documentAnalysis) { reset(); return null; }

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <PlanStep
          plan={actionPlan}
          analysis={documentAnalysis}
          onReset={reset}
        />
      </div>
    );
  }

  return null;
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function RootPage() {
  return (
    <PipelineProvider>
      <PipelineShell />
    </PipelineProvider>
  );
}
