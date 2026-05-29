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
      <div className="fixed inset-x-0 bottom-20 z-30 pointer-events-none px-6">
        <div className="max-w-4xl mx-auto flex justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
            className="pointer-events-auto w-14 h-14 rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow-xl flex items-center justify-center transition text-2xl"
          >
            💬
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-100">Create new</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-100 text-2xl leading-none"
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
                  className="w-full flex items-center gap-4 p-4 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 hover:border-amber-500 transition text-left"
                >
                  <span className="text-3xl">{action.icon}</span>
                  <div className="flex-1">
                    <p className="text-slate-100 font-medium">{action.label}</p>
                    {action.description && (
                      <p className="text-xs text-slate-400 mt-0.5">
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
