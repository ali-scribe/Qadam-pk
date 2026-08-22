"use client";

import { useRef, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.gif";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── Props ────────────────────────────────────────────────────────────────────

interface UploadStepProps {
  /**
   * Called when the user submits a valid file.
   * Task 3: receives placeholder empty strings — real base64 + mimeType
   * wired in Task 4 (compression) and Task 5 (API call).
   */
  onAnalyze: (base64: string, mimeType: string) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UploadStep({ onAnalyze }: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile]           = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]               = useState<string | null>(null);
  const [validationError, setValidationError]     = useState<string | null>(null);
  const [loading, setLoading]                     = useState(false);
  const [apiError, setApiError]                   = useState<string | null>(null);

  // ── File selection & validation ──────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValidationError(null);
    setApiError(null);
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setValidationError(
        "Unsupported file type. Please upload a JPEG, PNG, WebP, or GIF image."
      );
      setSelectedFile(null);
      setPreviewUrl(null);
      // Clear so the user can re-select without clicking remove
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setValidationError(
        `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.`
      );
      setSelectedFile(null);
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemove() {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    setApiError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  // ── Drag and drop ────────────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    // Simulate a change event so existing validation logic runs
    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) {
      inputRef.current.files = dt.files;
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  // ── Compression (Task 4) ─────────────────────────────────────────────────
  // Files ≤ 1 MB: read directly with FileReader — no quality loss.
  // Files > 1 MB: draw to canvas and reduce JPEG quality in steps of 0.1
  //               until the blob is ≤ 1 MB or quality reaches 0.1.
  // Returns the raw base64 string (no data-URL prefix) and the output mimeType.

  function readAsBase64(blob: Blob): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Strip "data:<mime>;base64," prefix — keep only the base64 payload
        const comma = dataUrl.indexOf(",");
        const base64 = dataUrl.slice(comma + 1);
        const mimeType = dataUrl.slice(5, comma).split(";")[0];
        resolve({ base64, mimeType });
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(blob);
    });
  }

  async function compressToBase64(
    file: File
  ): Promise<{ base64: string; mimeType: string }> {
    const TARGET = 1 * 1024 * 1024; // 1 MB

    // 4.1 — already within limit: read as-is
    if (file.size <= TARGET) {
      return readAsBase64(file);
    }

    // 4.1 — over limit: compress via Canvas API
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable."));
          return;
        }
        ctx.drawImage(img, 0, 0);

        let quality = 0.9;

        const tryCompress = () => {
          // 4.1 — canvas.toBlob with iteratively reduced quality
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Image compression failed."));
                return;
              }
              if (blob.size <= TARGET || quality <= 0.1) {
                // 4.2 — mimeType will be "image/jpeg" from canvas
                readAsBase64(blob).then(resolve).catch(reject);
              } else {
                quality = Math.round((quality - 0.1) * 10) / 10;
                tryCompress();
              }
            },
            "image/jpeg",
            quality
          );
        };

        tryCompress();
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not load the image for compression."));
      };

      img.src = objectUrl;
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!selectedFile) {
      setValidationError("Please select a document image before continuing.");
      return;
    }

    setLoading(true);
    try {
      // 4.1 / 4.2 — compress (if needed) and extract clean base64 + mimeType
      const { base64, mimeType } = await compressToBase64(selectedFile);

      // 4.3 — dev-only confirmation that encoded payload is within limit
      if (process.env.NODE_ENV === "development") {
        const approxBytes = Math.ceil((base64.length * 3) / 4);
        console.log(
          `[Qadam] compressed payload: ${(approxBytes / 1024).toFixed(1)} KB` +
            ` (${mimeType})`
        );
      }

      // 4.2 — pass real base64 (no data-URL prefix) and mimeType to onAnalyze
      await onAnalyze(base64, mimeType);
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

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Upload your document</h1>
        <p className="mt-2 text-sm text-gray-600">
          Take a clear photo or screenshot of your scholarship, government, or
          university document. Qadam will read it and build your personalised
          action plan.
        </p>
      </div>

      {/* Upload card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={[
              "relative flex flex-col items-center justify-center rounded-xl",
              "border-2 border-dashed px-6 py-10 text-center transition-colors",
              selectedFile
                ? "border-emerald-400 bg-emerald-50"
                : "border-gray-300 bg-white hover:border-emerald-400 hover:bg-gray-50",
            ].join(" ")}
          >
            {selectedFile && previewUrl ? (
              /* ── File selected: preview ── */
              <div className="w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Selected document preview"
                  className="mx-auto max-h-64 rounded-lg object-contain shadow-sm"
                />
                <p className="mt-3 text-sm font-medium text-gray-700">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="mt-3 text-sm text-red-500 hover:text-red-700 underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              /* ── Empty state ── */
              <>
                <svg
                  className="mb-4 h-10 w-10 text-gray-300"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-700">
                  Drag and drop your document here
                </p>
                <p className="mt-1 text-xs text-gray-400">or</p>

                {/* Visible label acts as the clickable upload trigger */}
                <label
                  htmlFor="file-upload"
                  className="mt-3 cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px] inline-flex items-center"
                >
                  Choose a file
                </label>
              </>
            )}

            {/* Standard file input — always present for mobile native picker */}
            <input
              ref={inputRef}
              id="file-upload"
              name="file-upload"
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              className="sr-only"
              disabled={loading}
              aria-label="Upload document image"
            />
          </div>

          {/* Supported formats note */}
          <p className="text-xs text-gray-400 text-center">
            Supported formats: JPEG, PNG, WebP, GIF · Maximum size: 10 MB
          </p>

          {/* Validation error */}
          {validationError && (
            <ErrorMessage
              message={validationError}
              onRetry={() => {
                setValidationError(null);
                inputRef.current?.click();
              }}
            />
          )}

          {/* API / submission error */}
          {apiError && (
            <ErrorMessage
              message={apiError}
              onRetry={() => setApiError(null)}
            />
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center">
              <LoadingSpinner label="Analyzing your document..." />
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !selectedFile}
            className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyse document"}
          </button>
        </form>
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

      <p className="mt-6 text-center text-xs text-gray-400">
        Qadam is not a legal advisor. Always verify with the issuing authority.
      </p>
    </div>
  );
}
