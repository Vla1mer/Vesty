import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import { motion } from "framer-motion";

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
  closeIcon?: "close" | "back";
  closeSide?: "left" | "right";
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
  closeIcon = "close",
  closeSide = "right",
  layer = "top",
  children,
}: Props) {
  const pressStartedOnBackdrop = useRef(false);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && !closeDisabled) onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, closeDisabled]);

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      disabled={closeDisabled}
      aria-label={closeIcon === "back" ? "Back" : "Close"}
      className="shrink-0 text-content-muted transition hover:text-content disabled:opacity-50"
    >
      {closeIcon === "back" ? <ArrowLeft size={22} /> : <X size={22} />}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={`fixed inset-0 flex items-center justify-center bg-scrim/70 p-4 ${
        layer === "top" ? "z-50" : "z-40"
      }`}
      onPointerDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (
          !closeDisabled &&
          e.target === e.currentTarget &&
          pressStartedOnBackdrop.current
        ) {
          onClose();
        }
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? (typeof title === "string" ? title : undefined)}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={`w-full ${WIDTHS[size]} rounded-card border border-line bg-surface p-6 shadow-modal ${LAYOUTS[layout]}`}
      >
        {title && (
          <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
            {closeSide === "left" && closeButton}
            {typeof title === "string" ? (
              <h2 className="min-w-0 break-words text-xl font-bold text-content">
                {title}
              </h2>
            ) : (
              title
            )}
            {closeSide === "right" && closeButton}
          </div>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}
