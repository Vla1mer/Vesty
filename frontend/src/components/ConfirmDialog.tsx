import { useEffect } from "react";

interface Props {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [loading, onCancel]);

  const confirmClasses =
    variant === "danger"
      ? "bg-danger hover:bg-danger text-danger-contrast"
      : "bg-accent hover:bg-accent-hover text-accent-contrast";

  return (
    <div
      className="fixed inset-0 bg-scrim/70 flex items-center justify-center z-50 p-4"
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="bg-surface border border-line rounded-card shadow-modal p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-content">{title}</h2>
        <p className="text-sm text-content-muted">{message}</p>

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded bg-surface-overlay hover:bg-line-strong text-content transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded font-medium transition disabled:opacity-50 ${confirmClasses}`}
          >
            {loading ? "..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
