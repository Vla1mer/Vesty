import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Avatar } from "./Avatar";
import type { MessageDto } from "../types/api";

interface Props {
  message: MessageDto;
  isOwn: boolean;
  authorName?: string;
  authorAvatarUpdatedAt?: string | null;
  showAuthor?: boolean;
  isEditing?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onSelectStart?: (id: number) => void;
  onToggleSelect?: (id: number) => void;
  onEdit?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
}

export function MessageBubble({
  message,
  isOwn,
  authorName,
  authorAvatarUpdatedAt,
  showAuthor = true,
  isEditing,
  selectionMode = false,
  selected = false,
  onSelectStart,
  onToggleSelect,
  onEdit,
  onDelete,
}: Props) {
  const [menu, setMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [pressing, setPressing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const moved = useRef(false);
  const lastTouchRef = useRef(0);

  const canManage = Boolean(onEdit || onDelete);

  useLayoutEffect(() => {
    if (!menu || !menuRef.current || !bubbleRef.current) return;
    const m = menuRef.current.getBoundingClientRect();
    const scroller = bubbleRef.current.closest(".overflow-y-auto");
    const bounds = scroller
      ? scroller.getBoundingClientRect()
      : new DOMRect(0, 0, window.innerWidth, window.innerHeight);
    const { x, y } = anchorRef.current;

    let top = y - m.height - 4;
    if (top < bounds.top + 8) {
      top = y + 4;
    }
    top = Math.max(bounds.top + 8, Math.min(top, bounds.bottom - m.height - 8));

    const left = Math.max(
      bounds.left + 8,
      Math.min(x, bounds.right - m.width - 8)
    );

    setMenuPos({ top, left });
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const openedAt = Date.now();
    const close = () => {
      if (Date.now() - openedAt < 250) return;
      setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    const closeOther = () => setMenu(false);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("message-menu-open", closeOther);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("message-menu-open", closeOther);
    };
  }, [menu]);

  function openMenu(x: number, y: number) {
    anchorRef.current = { x, y };
    window.dispatchEvent(new Event("message-menu-open"));
    setMenu(true);
  }

  function handleCopy() {
    if (message.content) navigator.clipboard?.writeText(message.content);
    setMenu(false);
  }

  function handleContextMenu(e: MouseEvent) {
    if (!message.content && !canManage) return;
    e.preventDefault();
    if (Date.now() - lastTouchRef.current < 700) return;
    if (menu) {
      setMenu(false);
      return;
    }
    openMenu(e.clientX, e.clientY);
  }

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleTouchStart() {
    lastTouchRef.current = Date.now();
    longPressFired.current = false;
    moved.current = false;
    setPressing(true);
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setPressing(false);
      onSelectStart?.(message.id);
    }, 500);
  }

  function handleTouchMove() {
    moved.current = true;
    setPressing(false);
    clearLongPress();
  }

  function handleTouchEnd() {
    lastTouchRef.current = Date.now();
    setPressing(false);
    const fired = longPressFired.current;
    const didMove = moved.current;
    clearLongPress();
    if (!fired && !didMove && selectionMode) onToggleSelect?.(message.id);
  }

  function cancelTouch() {
    setPressing(false);
    clearLongPress();
  }

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const timeLabel = message.isEdited ? `edited ${time}` : time;

  const displayName = authorName ?? `User #${message.userId}`;

  return (
    <>
      <div
        className={`flex items-center gap-2 transition ${
          selected ? "bg-amber-500/10" : ""
        }`}
      >
        {selectionMode && (
          <span
            className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
              selected
                ? "bg-amber-500 border-amber-500 text-white"
                : "border-slate-500 text-transparent"
            }`}
          >
            ✓
          </span>
        )}
        <div
          className={`group flex flex-1 min-w-0 gap-2 ${
            isOwn ? "justify-end md:justify-start" : "justify-start"
          }`}
        >
          {!isOwn && showAuthor && (
            <Avatar
              userId={message.userId}
              userName={authorName}
              avatarUpdatedAt={authorAvatarUpdatedAt}
              size="sm"
              className="self-end mb-0.5"
            />
          )}
          <div className="relative flex flex-col max-w-[78%] md:max-w-md">
            <div
              ref={bubbleRef}
              onContextMenu={handleContextMenu}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onTouchCancel={cancelTouch}
              style={{ WebkitTouchCallout: "none" }}
              className={`rounded-2xl px-4 py-2 select-none md:select-text transition ${
                menu || isEditing || pressing || selected
                  ? "ring-2 ring-amber-400"
                  : ""
              } ${
                isOwn
                  ? "bg-amber-600 text-white rounded-br-sm md:rounded-br-2xl md:rounded-bl-sm"
                  : "bg-slate-700 text-slate-100 rounded-bl-sm"
              }`}
            >
              {!isOwn && showAuthor && (
                <p className="text-xs text-amber-300 font-medium mb-1">
                  {displayName}
                </p>
              )}

              <div className="relative">
                <p className="break-words whitespace-pre-wrap">
                  {message.content}
                  <span
                    className="invisible select-none ml-2 text-[10px]"
                    aria-hidden="true"
                  >
                    {timeLabel}
                  </span>
                </p>
                <span
                  className={`absolute bottom-0 right-0 text-[10px] leading-none whitespace-nowrap ${
                    isOwn ? "text-amber-100" : "text-slate-400"
                  }`}
                >
                  {timeLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-32 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {message.content && (
            <button
              type="button"
              onClick={handleCopy}
              className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 transition"
            >
              📋 Copy
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onEdit(message.id, message.content ?? "");
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 transition"
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onDelete(message.id);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-slate-700 transition"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </>
  );
}
