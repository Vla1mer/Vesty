import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

const WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
} as const;

const LAYOUTS = {
  auto: "",
  scroll: "max-h-[85vh] overflow-y-auto",
  column: "max-h-[85vh] flex flex-col",
} as const;

interface Props {
  title?: ReactNode;
  ariaLabel?: string;
  onClose: () => void;
  size?: keyof typeof WIDTHS;
  layout?: keyof typeof LAYOUTS;
  closeDisabled?: boolean;
  layer?: "base" | "top";
  children: ReactNode;
}

export function Modal({
  title,
  ariaLabel,
  onClose,
  size = "sm",
  layout = "auto",
  closeDisabled = false,
  layer = "top",
  children,
}: Props) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-scrim/70 p-4 ${
        layer === "top" ? "z-50" : "z-40"
      }`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? (typeof title === "string" ? title : undefined)}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${WIDTHS[size]} rounded-card border border-line bg-surface p-6 shadow-modal ${LAYOUTS[layout]}`}
      >
        {title && (
          <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
            {typeof title === "string" ? (
              <h2 className="text-xl font-bold text-content">{title}</h2>
            ) : (
              title
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={closeDisabled}
              aria-label="Close"
              className="text-content-muted transition hover:text-content disabled:opacity-50"
            >
              <X size={22} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
