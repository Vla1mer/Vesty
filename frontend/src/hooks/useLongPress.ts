import { useRef, useState } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";

const LONG_PRESS_MS = 500;

interface Options {
  onLongPress: () => void;
  onTap: (e: ReactTouchEvent) => void;
}

export function useLongPress({ onLongPress, onTap }: Options) {
  const [pressing, setPressing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const moved = useRef(false);

  function stopTimer() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  function cancel() {
    setPressing(false);
    stopTimer();
  }

  return {
    pressing,
    handlers: {
      onTouchStart: () => {
        fired.current = false;
        moved.current = false;
        setPressing(true);
        timer.current = setTimeout(() => {
          fired.current = true;
          setPressing(false);
          onLongPress();
        }, LONG_PRESS_MS);
      },
      onTouchMove: () => {
        moved.current = true;
        cancel();
      },
      onTouchEnd: (e: ReactTouchEvent) => {
        const handled = fired.current || moved.current;
        cancel();
        if (handled) return;
        onTap(e);
      },
      onTouchCancel: cancel,
    },
  };
}
