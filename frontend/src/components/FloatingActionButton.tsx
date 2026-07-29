import { useEffect, useState } from "react";

interface Action {
  icon: string;
  label: string;
  description?: string;
  onClick: () => void;
}

interface Props {
  actions: Action[];
}

export function FloatingActionButton({ actions }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

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
        className="absolute right-4 bottom-20 z-30 w-14 h-14 shadow-float text-2xl rounded-full bg-accent hover:bg-accent-hover text-accent-contrast flex items-center justify-center transition md:static md:shrink-0 md:w-9 md:h-9 md:shadow-none md:text-lg"
      >
        💬
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-scrim/70 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-surface border border-line rounded-card shadow-modal p-6 w-full max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-content">Create new</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-content-muted hover:text-content text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleActionClick(action)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg bg-surface hover:bg-surface-overlay border border-line hover:border-accent-strong transition text-left"
                >
                  <span className="text-3xl">{action.icon}</span>
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
          </div>
        </div>
      )}
    </>
  );
}
