"use client";

import { useState } from "react";

interface EvidenceBlockProps {
  evidence: string;
  label?: string;
}

export default function EvidenceBlock({
  evidence,
  label = "View source",
}: EvidenceBlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 min-h-[44px] text-xs text-emerald-700 hover:text-emerald-900 transition-colors"
      >
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M7.293 4.293a1 1 0 011.414 0L14 9.586a1 1 0 010 1.414l-5.293 5.293a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        {open ? "Hide source" : label}
      </button>

      {open && (
        <blockquote className="mt-2 border-l-4 border-gray-300 bg-gray-50 pl-4 pr-3 py-2 text-sm italic text-gray-600 break-words">
          {evidence}
        </blockquote>
      )}
    </div>
  );
}
