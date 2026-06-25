import { useEffect } from "react";
import { SettingsContent } from "./SettingsContent";

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-100">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-100 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <SettingsContent />
      </div>
    </div>
  );
}
