import Link from "next/link";

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Upload a document",
    description:
      "Take a photo or screenshot of any Pakistani scholarship, government, or university document.",
  },
  {
    step: "2",
    title: "AI reads it for you",
    description:
      "Qadam extracts eligibility criteria, deadlines, fees, required documents, and application steps.",
  },
  {
    step: "3",
    title: "Answer a few questions",
    description:
      "We ask only what's relevant to your specific document — not a generic form.",
  },
  {
    step: "4",
    title: "Get your action plan",
    description:
      "See exactly what you qualify for, what you're missing, and what to do next — with evidence from the document.",
  },
];

const EXAMPLES = [
  {
    label: "Scholarship",
    description: "HEC / provincial / institutional funding",
    href: "/analyze",
    icon: "🎓",
  },
  {
    label: "Government Service",
    description: "NADRA, passport, domicile, CNIC",
    href: "/analyze",
    icon: "🏛️",
  },
  {
    label: "University",
    description: "Admissions, enrollment, degree requirements",
    href: "/analyze",
    icon: "📋",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              Qadam
            </span>
            <span className="text-2xl">قدم</span>
          </div>
          <Link
            href="/analyze"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors min-h-[44px] flex items-center"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-emerald-600">
          Pakistan-focused AI
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Know what comes next.
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-lg text-gray-600">
          Upload any Pakistani government, university, or scholarship document.
          Qadam reads it, reasons about your eligibility, and gives you a
          clear, evidence-backed action plan.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/analyze"
            className="w-full sm:w-auto rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-700 transition-colors min-h-[44px] flex items-center justify-center"
          >
            Upload a document
          </Link>
          <Link
            href="/result"
            className="w-full sm:w-auto rounded-lg border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px] flex items-center justify-center"
          >
            See an example result
          </Link>
        </div>

        {/* Trust note */}
        <p className="mt-6 text-sm text-gray-400">
          No sign-up required · No data stored · Evidence shown for every claim
        </p>
      </section>

      {/* ── What Qadam is NOT ── */}
      <section className="border-y border-gray-100 bg-gray-50 py-10">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-center">
            {[
              {
                not: "Not a chatbot",
                is: "A structured pipeline that reads your document",
              },
              {
                not: "Not a summarizer",
                is: "Personalized to your situation and answers",
              },
              {
                not: "Not guesswork",
                is: "Every claim is traced back to the document",
              },
            ].map(({ not, is }) => (
              <div key={not} className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-red-500 line-through">
                  {not}
                </p>
                <p className="mt-1 text-sm text-gray-700">{is}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">
          How Qadam works
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map(({ step, title, description }) => (
            <div key={step} className="flex flex-col">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                {step}
              </div>
              <h3 className="mb-1 text-sm font-semibold text-gray-900">
                {title}
              </h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Try an example ── */}
      <section className="border-t border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
            Try an example
          </h2>
          <p className="mb-8 text-center text-sm text-gray-500">
            Select a document type to upload a sample and see Qadam in action.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {EXAMPLES.map(({ label, description, href, icon }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-5 hover:border-emerald-400 hover:shadow-sm transition-all group min-h-[44px]"
              >
                <span className="mb-2 text-2xl">{icon}</span>
                <span className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700">
                  {label}
                </span>
                <span className="mt-0.5 text-xs text-gray-500">
                  {description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm text-gray-400">
            Qadam is not a legal advisor. Always verify your eligibility with
            the issuing authority.
          </p>
          <p className="mt-1 text-xs text-gray-300">
            Built for the Build with Kiro 2026 Hackathon
          </p>
        </div>
      </footer>
    </div>
  );
}
