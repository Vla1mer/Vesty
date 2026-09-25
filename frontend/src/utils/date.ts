import {
  isSameDay as isSameCalendarDay,
  isToday,
  isYesterday,
  isSameYear,
} from "date-fns";

const LOCALE = "en-GB";

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE);
}

export function isSameDay(a: string, b: string): boolean {
  return isSameCalendarDay(new Date(a), new Date(b));
}

export function formatListTime(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return formatTime(iso);
  if (isYesterday(date)) return "Yesterday";

  const sameYear = isSameYear(date, new Date());
  return date.toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "2-digit" }),
  });
}

export function formatLastSeen(iso: string): string {
  const date = new Date(iso);
  const time = formatTime(iso);

  if (isToday(date)) return `last seen at ${time}`;
  if (isYesterday(date)) return `last seen yesterday at ${time}`;

  const sameYear = isSameYear(date, new Date());
  const day = date.toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return `last seen on ${day}`;
}

export function formatDateSeparator(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";

  const sameYear = isSameYear(date, new Date());
  return date.toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
