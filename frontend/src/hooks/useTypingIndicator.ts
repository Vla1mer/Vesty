import { useCallback, useEffect, useRef, useState } from "react";
import { onUserTyping, sendTyping } from "../lib/signalr";

const TYPING_DISPLAY_TIMEOUT = 5000;
const TYPING_SEND_THROTTLE = 2000;

export function useTypingIndicator(chatId: number, enabled: boolean) {
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const namesRef = useRef(new Map<number, string>());
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const names = namesRef.current;
    const timers = timersRef.current;
    const sync = () => setTypingNames([...names.values()]);

    const unsubscribe = onUserTyping(
      ({ chatId: eventChatId, userId, userName }) => {
        if (eventChatId !== chatId) return;

        names.set(userId, userName);
        sync();

        const existing = timers.get(userId);
        if (existing) clearTimeout(existing);
        timers.set(
          userId,
          setTimeout(() => {
            names.delete(userId);
            timers.delete(userId);
            sync();
          }, TYPING_DISPLAY_TIMEOUT)
        );
      }
    );

    return () => {
      unsubscribe();
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      names.clear();
      setTypingNames([]);
    };
  }, [chatId, enabled]);

  const notifyTyping = useCallback(() => {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastSentRef.current < TYPING_SEND_THROTTLE) return;
    lastSentRef.current = now;
    sendTyping(chatId);
  }, [chatId, enabled]);

  return { typingNames, notifyTyping };
}
