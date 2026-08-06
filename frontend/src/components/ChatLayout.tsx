import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ChatsPage } from "../pages/ChatsPage";
import { RAIL_WIDTH_COMPACT, RAIL_WIDTH_WITH_LABELS } from "./SideRail";
import { useRailLabels } from "../hooks/useRailLabels";
import { useIsMobile } from "../hooks/useIsMobile";
import {
  CHAT_LIST_DEFAULT_WIDTH,
  clampChatListWidth,
  setChatListWidth,
  useChatListWidth,
} from "../hooks/useChatListWidth";

export function ChatLayout() {
  const location = useLocation();
  const hasSelection = /^\/chats\/.+/.test(location.pathname);
  const showRailLabels = useRailLabels();
  const isMobile = useIsMobile();
  const storedWidth = useChatListWidth();
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const railWidth = showRailLabels ? RAIL_WIDTH_WITH_LABELS : RAIL_WIDTH_COMPACT;
  const listWidth = dragWidth ?? storedWidth;

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    dragRef.current = { startX: event.clientX, startWidth: listWidth };
    setDragWidth(listWidth);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    setDragWidth(clampChatListWidth(drag.startWidth + event.clientX - drag.startX));
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>): boolean {
    if (!dragRef.current) return false;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    return true;
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!endDrag(event)) return;
    if (dragWidth !== null) setChatListWidth(dragWidth);
    setDragWidth(null);
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    if (!endDrag(event)) return;
    setDragWidth(null);
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <aside
        style={isMobile ? undefined : { width: listWidth + railWidth }}
        className={`${
          hasSelection ? "hidden md:flex" : "flex"
        } relative h-dvh w-full shrink-0 md:border-r border-line flex-col overflow-hidden`}
      >
        <ChatsPage isResizing={dragWidth !== null} />

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize the chat list"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onDoubleClick={() => setChatListWidth(CHAT_LIST_DEFAULT_WIDTH)}
          className="absolute inset-y-0 right-0 hidden w-1.5 cursor-col-resize select-none md:block"
        />
      </aside>
      <main
        className={`${
          hasSelection ? "flex" : "hidden md:flex"
        } flex-1 flex-col min-w-0`}
      >
        <Outlet />
      </main>
    </div>
  );
}
