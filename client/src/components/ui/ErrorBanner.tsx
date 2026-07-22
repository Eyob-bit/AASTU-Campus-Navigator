import { AlertCircle } from "lucide-react";

export interface ErrorBannerProps {
  /** Short heading, e.g. "Failed to load offices" */
  title:   string;
  /** The error message string. Renders nothing when null. */
  message: string | null;
  onRetry: () => void;
}

/**
 * Inline error banner with a Retry button.
 * Replaces the four identical error-block JSX patterns that lived in
 * BuildingsPage, FloorsPage, OfficesPage, and StaffPage.
 * Renders nothing when `message` is null so callers can always render it.
 */
export function ErrorBanner({ title, message, onRetry }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-red-800">{title}</p>
        <p className="text-xs text-red-600 mt-0.5">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="ml-auto text-xs text-red-600 font-medium hover:underline"
      >
        Retry
      </button>
    </div>
  );
}
