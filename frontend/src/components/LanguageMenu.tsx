import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useLanguage } from "../context/useLanguage";
import { LANGUAGES, LANGUAGE_NAMES } from "../i18n/translations";
import { FlagIcon } from "./ui/FlagIcon";

export function LanguageMenu() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOutside = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };

    window.addEventListener("mousedown", closeOutside);
    return () => window.removeEventListener("mousedown", closeOutside);
  }, [open]);

  function closeOnEscape(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Escape" || !open) return;
    e.stopPropagation();
    setOpen(false);
  }

  return (
    <div ref={rootRef} onKeyDown={closeOnEscape} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((shown) => !shown)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-card border border-line-strong bg-surface-sunken px-3 py-2 text-sm text-content transition hover:border-accent-strong"
      >
        <FlagIcon language={language} />
        {LANGUAGE_NAMES[language]}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`text-content-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-1 min-w-full overflow-hidden rounded-card border border-line bg-surface shadow-float"
        >
          {LANGUAGES.map((option) => {
            const selected = option === language;

            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setLanguage(option);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                  selected
                    ? "bg-accent-soft text-content"
                    : "text-content-muted hover:bg-surface-muted"
                }`}
              >
                <FlagIcon language={option} />
                {LANGUAGE_NAMES[option]}
                {selected && (
                  <Check size={14} aria-hidden="true" className="ml-auto text-accent-strong" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
