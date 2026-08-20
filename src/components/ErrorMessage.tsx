"use client";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export default function ErrorMessage({
  message,
  onRetry,
  onBack,
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-300 bg-red-50 p-4 text-red-700"
    >
      <p className="text-sm">{message}</p>
      {(onRetry || onBack) && (
        <div className="mt-3 flex gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="min-h-[44px] rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200 transition-colors"
            >
              Try again
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="min-h-[44px] rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              Go back
            </button>
          )}
        </div>
      )}
    </div>
  );
}
