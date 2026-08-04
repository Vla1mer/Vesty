import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatDto, MessageDto } from "../types/api";

const JUMP_BUTTON_DISTANCE = 240;
const HIGHLIGHT_MS = 1600;

interface Options {
  chatId: number;
  messages: MessageDto[];
  chat?: ChatDto;
  chatFailed: boolean;
}

export function useChatScroll({ chatId, messages, chat, chatFailed }: Options) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [unreadOnEntry, setUnreadOnEntry] = useState<number | null>(null);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  const firstUnreadId = useMemo(() => {
    if (!unreadOnEntry || unreadOnEntry > messages.length) return null;
    return messages[messages.length - unreadOnEntry]?.id ?? null;
  }, [messages, unreadOnEntry]);

  useEffect(() => {
    setUnreadOnEntry(null);
    setInitialScrollDone(false);
  }, [chatId]);

  useEffect(() => {
    if (unreadOnEntry !== null) return;
    if (chat) setUnreadOnEntry(chat.unreadCount ?? 0);
    else if (chatFailed) setUnreadOnEntry(0);
  }, [chat, chatFailed, unreadOnEntry]);

  useEffect(() => {
    if (messages.length === 0) return;

    if (!initialScrollDone) {
      if (unreadOnEntry === null) return;

      const anchor =
        firstUnreadId !== null
          ? document.getElementById(`message-${firstUnreadId}`)
          : null;

      if (anchor) anchor.scrollIntoView({ block: "center" });
      else bottomRef.current?.scrollIntoView();
      setInitialScrollDone(true);
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, firstUnreadId, unreadOnEntry, initialScrollDone]);

  function handleScroll() {
    const element = containerRef.current;
    if (!element) return;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    setShowJumpToBottom(distanceFromBottom > JUMP_BUTTON_DISTANCE);
  }

  function jumpToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function jumpToMessage(id: number) {
    const node = document.getElementById(`message-${id}`);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(id);
    window.setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS);
  }

  return {
    containerRef,
    bottomRef,
    firstUnreadId,
    highlightedId,
    showJumpToBottom,
    initialScrollDone,
    handleScroll,
    jumpToBottom,
    jumpToMessage,
  };
}
