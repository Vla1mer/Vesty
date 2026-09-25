import { useMemo } from "react";
import { useLanguage } from "../context/useLanguage";
import {
  formatDateSeparator,
  formatDateTime,
  formatLastSeen,
  formatListTime,
  formatTime,
} from "../utils/date";

export function useDates() {
  const { language, t } = useLanguage();

  return useMemo(
    () => ({
      time: (iso: string) => formatTime(iso, language),
      dateTime: (iso: string) => formatDateTime(iso, language),
      listTime: (iso: string) => formatListTime(iso, language, t),
      lastSeen: (iso: string) => formatLastSeen(iso, language, t),
      separator: (iso: string) => formatDateSeparator(iso, language, t),
    }),
    [language, t]
  );
}
