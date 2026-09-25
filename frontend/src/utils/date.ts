import {
  isSameDay as isSameCalendarDay,
  isToday,
  isYesterday,
  isSameYear,
} from "date-fns";
import type { Language, Translate } from "../i18n/translations";

const LOCALES: Record<Language, string> = {
  en: "en-GB",
  pl: "pl-PL",
};

export function isSameDay(a: string, b: string): boolean {
  return isSameCalendarDay(new Date(a), new Date(b));
}

export function formatTime(iso: string, language: Language): string {
  return new Date(iso).toLocaleTimeString(LOCALES[language], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string, language: Language): string {
  return new Date(iso).toLocaleString(LOCALES[language]);
}

export function formatListTime(iso: string, language: Language, t: Translate): string {
  const date = new Date(iso);
  if (isToday(date)) return formatTime(iso, language);
  if (isYesterday(date)) return t("date.yesterday");

  return date.toLocaleDateString(LOCALES[language], {
    day: "numeric",
    month: "short",
    ...(isSameYear(date, new Date()) ? {} : { year: "2-digit" }),
  });
}

export function formatLastSeen(iso: string, language: Language, t: Translate): string {
  const date = new Date(iso);
  const time = formatTime(iso, language);

  if (isToday(date)) return t("date.lastSeenAt", { time });
  if (isYesterday(date)) return t("date.lastSeenYesterday", { time });

  const day = date.toLocaleDateString(LOCALES[language], {
    day: "numeric",
    month: "short",
    ...(isSameYear(date, new Date()) ? {} : { year: "numeric" }),
  });
  return t("date.lastSeenOn", { day });
}

export function formatDateSeparator(iso: string, language: Language, t: Translate): string {
  const date = new Date(iso);
  if (isToday(date)) return t("date.today");
  if (isYesterday(date)) return t("date.yesterday");

  return date.toLocaleDateString(LOCALES[language], {
    day: "numeric",
    month: "long",
    ...(isSameYear(date, new Date()) ? {} : { year: "numeric" }),
  });
}
