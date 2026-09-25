import type { ReactNode } from "react";
import type { Language } from "../../i18n/translations";

const flags: Record<Language, ReactNode> = {
  en: (
    <>
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#fff" strokeWidth="3" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#C8102E" strokeWidth="1.8" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5" />
      <path d="M12 0v16M0 8h24" stroke="#C8102E" strokeWidth="3" />
    </>
  ),
  pl: (
    <>
      <rect width="24" height="8" fill="#fff" />
      <rect y="8" width="24" height="8" fill="#DC143C" />
    </>
  ),
};

export function FlagIcon({ language }: { language: Language }) {
  return (
    <svg
      viewBox="0 0 24 16"
      width="20"
      height="14"
      aria-hidden="true"
      className="shrink-0 rounded-[2px] border border-line"
    >
      {flags[language]}
    </svg>
  );
}
