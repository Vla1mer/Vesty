import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { useTheme } from "../context/useTheme";
import type { Theme } from "emoji-picker-react";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

interface Props {
  disabled?: boolean;
  onPick: (emoji: string) => void;
}

export function EmojiPickerButton({ disabled = false, onPick }: Props) {
  const { resolved } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("mousedown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Insert emoji"
        aria-expanded={open}
        title="Insert emoji"
        className="px-2 text-content-muted transition hover:text-accent-strong disabled:opacity-50"
      >
        <Smile size={20} />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute bottom-full left-0 z-40 mb-2 shadow-float"
        >
          <Suspense
            fallback={
              <p className="rounded-card border border-line bg-surface p-4 text-sm text-content-muted">
                Loading...
              </p>
            }
          >
            <EmojiPicker
              theme={(resolved === "dark" ? "dark" : "light") as Theme}
              lazyLoadEmojis
              width={320}
              height={400}
              onEmojiClick={(selected) => {
                onPick(selected.emoji);
                setOpen(false);
              }}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
