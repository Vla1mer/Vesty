import type { MouseEvent, ReactNode, RefObject } from "react";
import { motion } from "framer-motion";

interface PanelProps {
  menuRef: RefObject<HTMLDivElement | null>;
  position: { top: number; left: number };
  onClickCapture: (e: MouseEvent) => void;
  children: ReactNode;
}

export function ContextMenuPanel({
  menuRef,
  position,
  onClickCapture,
  children,
}: PanelProps) {
  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.13, ease: [0.22, 1, 0.36, 1] }}
      className="fixed z-50 w-max max-w-[13rem] origin-top-left rounded-lg border border-line bg-surface-raised py-1 shadow-float"
      style={{ top: position.top, left: position.left }}
      onClickCapture={onClickCapture}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );
}

interface ItemProps {
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}

export function ContextMenuItem({ onClick, danger = false, children }: ItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-overlay transition ${
        danger ? "text-danger" : "text-content"
      }`}
    >
      {children}
    </button>
  );
}
