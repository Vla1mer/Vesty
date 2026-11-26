import { useMemo, useState } from "react";
import type { MessageDto } from "../types/api";

interface SearchState {
  chatId: number;
  query: string;
  index: number;
}

const matchesTerm = (message: MessageDto, term: string) =>
  Boolean(term) && Boolean(message.content?.toLocaleLowerCase().includes(term));

export function useMessageSearch(
  chatId: number,
  messages: MessageDto[],
  onShow: (messageId: number) => void
) {
  const [state, setState] = useState<SearchState | null>(null);
  const active = state?.chatId === chatId ? state : null;
  const query = active?.query ?? "";
  const term = query.trim().toLocaleLowerCase();

  const matches = useMemo(
    () => messages.filter((m) => matchesTerm(m, term)).map((m) => m.id).reverse(),
    [messages, term]
  );

  const current = matches.length > 0 ? Math.min(active?.index ?? 0, matches.length - 1) : -1;

  function show(next: number) {
    setState((prev) => (prev ? { ...prev, index: next } : prev));
    onShow(matches[next]);
  }

  return {
    open: active !== null,
    query,
    total: matches.length,
    position: current + 1,
    start: () => setState({ chatId, query: "", index: 0 }),
    close: () => setState(null),
    search: (value: string) => {
      setState({ chatId, query: value, index: 0 });
      const lowered = value.trim().toLocaleLowerCase();
      const newest = [...messages].reverse().find((m) => matchesTerm(m, lowered));
      if (newest) onShow(newest.id);
    },
    older: () => {
      if (current >= 0 && current < matches.length - 1) show(current + 1);
    },
    newer: () => {
      if (current > 0) show(current - 1);
    },
  };
}
