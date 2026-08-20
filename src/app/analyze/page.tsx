import Link from "next/link";
import UploadForm from "@/components/UploadForm";

export const metadata = {
  title: "Upload a Document — Qadam",
};

export default function AnalyzePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-gray-900 hover:text-emerald-700 transition-colors"
          >
            Qadam
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">Upload</span>
        </div>
      </header>

      {/* ── Page body ── */}
      <main className="mx-auto max-w-2xl px-4 py-12">
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Upload your document
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Take a clear photo or screenshot of your scholarship, government, or
            university document. Qadam will read it and build your personalized
            action plan.
          </p>
        </div>

        {/* Upload card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <UploadForm />
        </div>

        {/* Tips */}
        <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-amber-800">
            Tips for best results
          </h2>
          <ul className="space-y-1 text-sm text-amber-700 list-disc list-inside">
            <li>Make sure the document text is sharp and fully visible</li>
            <li>Avoid glare, shadows, or cut-off edges</li>
            <li>Works with Urdu, English, or mixed documents</li>
            <li>One page at a time for now</li>
          </ul>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Qadam is not a legal advisor. Always verify with the issuing
          authority.
        </p>
      </main>
    </div>
  );
}
