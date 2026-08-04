import { useMemo, useState } from "react";
import type { MessageDto } from "../types/api";

export function useMessageSelection(
  messages: MessageDto[],
  currentUserId: number | null
) {
  const [ids, setIds] = useState<Set<number>>(new Set());

  const selected = useMemo(
    () => messages.filter((message) => ids.has(message.id)),
    [messages, ids]
  );

  const ownIds = useMemo(
    () =>
      selected
        .filter((message) => message.userId === currentUserId)
        .map((message) => message.id),
    [selected, currentUserId]
  );

  function start(id: number) {
    setIds((prev) => new Set(prev).add(id));
  }

  function toggle(id: number) {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clear() {
    setIds(new Set());
  }

  function copy() {
    const text = selected.map((message) => message.content ?? "").join("\n");
    if (text) navigator.clipboard?.writeText(text);
    clear();
  }

  return {
    ids,
    mode: ids.size > 0,
    selected,
    ownIds,
    start,
    toggle,
    clear,
    copy,
  };
}
