"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.gif";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const TARGET_ENCODED_BYTES = 1 * 1024 * 1024; // 1 MB after base64

// ─── Image compression via Canvas API ────────────────────────────────────────

async function compressImage(file: File): Promise<string> {
  // Files already ≤ 1 MB: read directly without compression
  if (file.size <= TARGET_ENCODED_BYTES) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data URL prefix — keep only the base64 payload
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Files > 1 MB: draw to canvas and reduce quality until ≤ 1 MB
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
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0);

      let quality = 0.9;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Compression failed"));
              return;
            }
            if (blob.size <= TARGET_ENCODED_BYTES || quality <= 0.1) {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(",")[1]);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            } else {
              quality = Math.max(quality - 0.1, 0.1);
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
      reject(new Error("Could not load image"));
    };
    img.src = objectUrl;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── File selection & validation ──
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
      // Clear the input so the user can re-select
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

  // ── Drop zone ──
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    // Reuse the same validation by simulating a file-input change
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

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!selectedFile) {
      setValidationError("Please select a document image before continuing.");
      return;
    }

    setLoading(true);

    try {
      await compressImage(selectedFile);
      // TODO (Task 5): POST base64 + mimeType to /api/analyze
      // For now, navigate to the result page to demonstrate the UI flow
      router.push("/result");
    } catch {
      setApiError(
        "Something went wrong preparing your image. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* ── Drop zone / file picker ── */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors
          ${selectedFile ? "border-emerald-400 bg-emerald-50" : "border-gray-300 bg-white hover:border-emerald-400 hover:bg-gray-50"}`}
      >
        {selectedFile && previewUrl ? (
          /* ── Preview ── */
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
            <label
              htmlFor="file-upload"
              className="mt-3 cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px] inline-flex items-center"
            >
              Choose a file
            </label>
          </>
        )}

        {/* Hidden input — always present for mobile native picker */}
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

      {/* API error */}
      {apiError && (
        <ErrorMessage
          message={apiError}
          onRetry={() => setApiError(null)}
        />
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center">
          <LoadingSpinner label="Analyzing your document…" />
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !selectedFile}
        className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Analyzing…" : "Analyze document"}
      </button>
    </form>
  );
}
