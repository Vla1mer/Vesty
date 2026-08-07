import {
  isSameDay as isSameCalendarDay,
  isToday,
  isYesterday,
  isSameYear,
} from "date-fns";

export function isSameDay(a: string, b: string): boolean {
  return isSameCalendarDay(new Date(a), new Date(b));
}

export function formatListTime(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (isYesterday(date)) return "Yesterday";

  const sameYear = isSameYear(date, new Date());
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "2-digit" }),
  });
}

export function formatLastSeen(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isToday(date)) return `last seen at ${time}`;
  if (isYesterday(date)) return `last seen yesterday at ${time}`;

  const sameYear = isSameYear(date, new Date());
  const day = date.toLocaleDateString(undefined, {
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
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
