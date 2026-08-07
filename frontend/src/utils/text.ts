export interface Insertion {
  value: string;
  caret: number;
}

export function insertAtSelection(
  value: string,
  insert: string,
  start: number,
  end: number,
  maxLength: number
): Insertion {
  const from = Math.max(0, Math.min(start, end, value.length));
  const to = Math.max(0, Math.min(Math.max(start, end), value.length));

  const next = (value.slice(0, from) + insert + value.slice(to)).slice(0, maxLength);
  const caret = Math.min(from + insert.length, next.length);

  return { value: next, caret };
}
