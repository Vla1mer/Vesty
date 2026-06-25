export function isSameDay(a: string, b: string): boolean {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function formatListTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(iso, now.toISOString())) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(iso, yesterday.toISOString())) return "Yesterday";

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "2-digit" }),
  });
}

export function formatDateSeparator(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(iso, now.toISOString())) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(iso, yesterday.toISOString())) return "Yesterday";

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
