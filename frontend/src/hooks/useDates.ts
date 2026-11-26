import { useMemo } from "react";
import { useLanguage } from "../context/useLanguage";
import type { LastSeenApprox } from "../types/api";
import type { TranslationKey } from "../i18n/translations";
import {
  formatDateSeparator,
  formatDateTime,
  formatLastSeen,
  formatListTime,
  formatTime,
} from "../utils/date";

const APPROX_KEYS: Record<LastSeenApprox, TranslationKey> = {
  recently: "date.lastSeenRecently",
  week: "date.lastSeenWithinWeek",
  month: "date.lastSeenWithinMonth",
  longAgo: "date.lastSeenLongAgo",
};

export function useDates() {
  const { language, t } = useLanguage();

  return useMemo(
    () => ({
      time: (iso: string) => formatTime(iso, language),
      dateTime: (iso: string) => formatDateTime(iso, language),
      listTime: (iso: string) => formatListTime(iso, language, t),
      lastSeen: (iso: string) => formatLastSeen(iso, language, t),
      lastSeenApprox: (approx: LastSeenApprox) => t(APPROX_KEYS[approx]),
      separator: (iso: string) => formatDateSeparator(iso, language, t),
    }),
    [language, t]
  );
}
