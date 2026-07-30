import { useState } from "react";
import { Pencil } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Modal } from "./ui/Modal";
import type { LucideIcon } from "lucide-react";

interface Action {
  Icon: LucideIcon;
  label: string;
  description?: string;
  onClick: () => void;
}

interface Props {
  actions: Action[];
}

export function FloatingActionButton({ actions }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  function handleActionClick(action: Action) {
    setIsOpen(false);
    action.onClick();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="New chat"
        className="absolute right-4 bottom-20 z-30 w-14 h-14 shadow-float rounded-full bg-accent hover:bg-accent-hover text-accent-contrast flex items-center justify-center transition md:static md:shrink-0 md:w-9 md:h-9 md:shadow-none"
      >
        <Pencil size={20} className="md:hidden" />
        <Pencil size={16} className="hidden md:block" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <Modal title="Create new" onClose={() => setIsOpen(false)}>
          <div className="space-y-2">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleActionClick(action)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg bg-surface hover:bg-surface-overlay border border-line hover:border-accent-strong transition text-left"
                >
                  <action.Icon size={24} aria-hidden="true" className="shrink-0 text-accent-strong" />
                  <div className="flex-1">
                    <p className="text-content font-medium">{action.label}</p>
                    {action.description && (
                      <p className="text-xs text-content-muted mt-0.5">
                        {action.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
