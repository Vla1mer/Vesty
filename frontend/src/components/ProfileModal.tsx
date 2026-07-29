import { useEffect } from "react";
import { ProfileContent } from "./ProfileContent";

interface Props {
  onClose: () => void;
}

export function ProfileModal({ onClose }: Props) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-scrim/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-raised border border-line rounded-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-content">Profile</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-content-muted hover:text-content text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <ProfileContent />
      </div>
    </div>
  );
}
