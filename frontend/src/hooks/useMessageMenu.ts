import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";

const MENU_OPEN_EVENT = "message-menu-open";
const DISMISS_GRACE_MS = 250;
const CLICK_GRACE_MS = 400;
const EDGE_GAP = 8;

export function useMessageMenu(enabled: boolean) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef({ x: 0, y: 0 });
  const pointerTypeRef = useRef<string>("mouse");
  const openedAtRef = useRef(0);

  useLayoutEffect(() => {
    if (!open || !menuRef.current || !bubbleRef.current) return;
    const m = menuRef.current.getBoundingClientRect();
    const scroller = bubbleRef.current.closest(".overflow-y-auto");
    const bounds = scroller
      ? scroller.getBoundingClientRect()
      : new DOMRect(0, 0, window.innerWidth, window.innerHeight);
    const { x, y } = anchorRef.current;

    let top = y - m.height - 4;
    if (top < bounds.top + EDGE_GAP) {
      top = y + 4;
    }
    top = Math.max(
      bounds.top + EDGE_GAP,
      Math.min(top, bounds.bottom - m.height - EDGE_GAP)
    );

    const left = Math.max(
      bounds.left + EDGE_GAP,
      Math.min(x, bounds.right - m.width - EDGE_GAP)
    );

    setPosition({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const openedAt = Date.now();
    const close = () => {
      if (Date.now() - openedAt < DISMISS_GRACE_MS) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const closeOther = () => setOpen(false);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(MENU_OPEN_EVENT, closeOther);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(MENU_OPEN_EVENT, closeOther);
    };
  }, [open]);

  function openAt(x: number, y: number) {
    openedAtRef.current = Date.now();
    anchorRef.current = { x, y };
    window.dispatchEvent(new Event(MENU_OPEN_EVENT));
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    if (pointerTypeRef.current === "touch") return;
    if (!enabled) return;
    if (open) {
      setOpen(false);
      return;
    }
    openAt(e.clientX, e.clientY);
  }

  function guardClick(e: MouseEvent) {
    if (Date.now() - openedAtRef.current < CLICK_GRACE_MS) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return {
    open,
    position,
    menuRef,
    bubbleRef,
    openAt,
    close,
    guardClick,
    triggerProps: {
      onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
        pointerTypeRef.current = e.pointerType;
      },
      onContextMenu: handleContextMenu,
    },
  };
}
