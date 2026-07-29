import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent, TouchEvent as ReactTouchEvent } from "react";
import { Avatar } from "./Avatar";
import { MessageAttachments } from "./MessageAttachments";
import type { MessageDto } from "../types/api";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface Props {
  message: MessageDto;
  isOwn: boolean;
  authorName?: string;
  authorAvatarUpdatedAt?: string | null;
  replyAuthorName?: string;
  showAuthor?: boolean;
  isEditing?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onSelectStart?: (id: number) => void;
  onToggleSelect?: (id: number) => void;
  onEdit?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
  onReply?: (message: MessageDto) => void;
  onJumpToMessage?: (id: number) => void;
  highlighted?: boolean;
  currentUserId?: number | null;
  onToggleReaction?: (messageId: number, emoji: string, active: boolean) => void;
  onTogglePin?: (messageId: number, pinned: boolean) => void;
}

export function MessageBubble({
  message,
  isOwn,
  authorName,
  authorAvatarUpdatedAt,
  replyAuthorName,
  showAuthor = true,
  isEditing,
  selectionMode = false,
  selected = false,
  onSelectStart,
  onToggleSelect,
  onEdit,
  onDelete,
  onReply,
  onJumpToMessage,
  highlighted = false,
  currentUserId,
  onToggleReaction,
  onTogglePin,
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
  const pointerTypeRef = useRef<string>("mouse");
  const menuOpenedAtRef = useRef(0);

  const hasActions = Boolean(
    onEdit || onDelete || onReply || onTogglePin || onToggleReaction
  );

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
    menuOpenedAtRef.current = Date.now();
    anchorRef.current = { x, y };
    window.dispatchEvent(new Event("message-menu-open"));
    setMenu(true);
  }

  function handleCopy() {
    if (message.content) navigator.clipboard?.writeText(message.content);
    setMenu(false);
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    if (pointerTypeRef.current === "touch") return;
    if (!message.content && !hasActions) return;
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

  function handleTouchEnd(e: ReactTouchEvent) {
    setPressing(false);
    const fired = longPressFired.current;
    const didMove = moved.current;
    clearLongPress();
    if (fired || didMove) return;

    if (selectionMode) {
      onToggleSelect?.(message.id);
      return;
    }

    const touch = e.changedTouches[0];
    if (!touch) return;

    e.preventDefault();
    openMenu(touch.clientX, touch.clientY);
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
        id={`message-${message.id}`}
        className={`flex items-center gap-2 rounded-lg transition-colors duration-500 ${
          selected ? "bg-accent/10" : highlighted ? "bg-accent/20" : ""
        }`}
      >
        {selectionMode && (
          <span
            className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
              selected
                ? "bg-accent border-accent-strong text-accent-contrast"
                : "border-line-strong text-transparent"
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
          <span className="hidden md:block self-end mb-0.5">
            <Avatar
              userId={message.userId}
              userName={authorName}
              avatarUpdatedAt={authorAvatarUpdatedAt}
              size="sm"
            />
          </span>
          <div className="relative flex flex-col max-w-[78%] md:max-w-md">
            <div
              ref={bubbleRef}
              onPointerDown={(e) => {
                pointerTypeRef.current = e.pointerType;
              }}
              onContextMenu={handleContextMenu}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onTouchCancel={cancelTouch}
              style={{ WebkitTouchCallout: "none" }}
              className={`rounded-bubble px-4 py-2 select-none md:select-text shadow-raised transition ${
                menu || isEditing || pressing || selected
                  ? "ring-2 ring-accent-strong"
                  : ""
              } ${
                isOwn
                  ? "bg-bubble-out text-on-bubble rounded-br-sm md:rounded-br-bubble md:rounded-bl-sm"
                  : "bg-bubble-in text-content rounded-bl-sm"
              }`}
            >
              {!isOwn && showAuthor && (
                <p className="text-xs text-accent-strong font-medium mb-1">
                  {displayName}
                </p>
              )}

              {message.pinnedAt && (
                <p
                  className={`text-[11px] mb-1 ${
                    isOwn ? "text-on-bubble-accent" : "text-accent-strong"
                  }`}
                >
                  📌 Pinned
                </p>
              )}

              {message.replyTo && (
                <button
                  type="button"
                  onClick={() => onJumpToMessage?.(message.replyTo!.id)}
                  className={`w-full text-left mb-1.5 pl-2 border-l-2 rounded-sm py-0.5 transition ${
                    isOwn
                      ? "border-on-bubble-accent bg-on-bubble/[0.08] hover:bg-on-bubble/[0.13]"
                      : "border-accent-strong bg-content/[0.05] hover:bg-content/[0.09]"
                  }`}
                >
                  <span
                    className={`block text-xs font-medium truncate ${
                      isOwn ? "text-on-bubble-accent" : "text-accent-strong"
                    }`}
                  >
                    {replyAuthorName ?? `User #${message.replyTo.userId}`}
                  </span>
                  <span
                    className={`block text-xs truncate ${
                      isOwn ? "text-on-bubble-muted" : "text-content-muted"
                    }`}
                  >
                    {message.replyTo.content}
                  </span>
                </button>
              )}

              {!!message.attachments?.length && (
                <MessageAttachments attachments={message.attachments} />
              )}

              <div className="relative">
                <p className="break-words whitespace-pre-wrap">
                  {message.content}
                  <span
                    className="invisible select-none ml-2.5 text-xs"
                    aria-hidden="true"
                  >
                    {timeLabel}
                  </span>
                </p>
                <span
                  className={`absolute bottom-0 right-0 text-xs leading-none whitespace-nowrap ${
                    isOwn ? "text-on-bubble-muted" : "text-content-muted"
                  }`}
                >
                  {timeLabel}
                </span>
              </div>
            </div>

            {!!message.reactions?.length && (
              <div
                className={`flex flex-wrap gap-1 mt-1 ${
                  isOwn ? "justify-end md:justify-start" : "justify-start"
                }`}
              >
                {message.reactions.map((r) => {
                  const mine =
                    currentUserId != null && r.userIds.includes(currentUserId);
                  return (
                    <button
                      key={r.emoji}
                      type="button"
                      onClick={() => onToggleReaction?.(message.id, r.emoji, mine)}
                      title={`${r.userIds.length}`}
                      className={`px-1.5 py-0.5 rounded-full text-xs border transition ${
                        mine
                          ? "bg-accent/20 border-accent-strong text-accent-strong"
                          : "bg-surface-raised border-line-strong text-content-muted hover:bg-surface-overlay"
                      }`}
                    >
                      {r.emoji} {r.userIds.length}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 w-max max-w-[13rem] rounded-lg border border-line bg-surface-raised py-1 shadow-float"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClickCapture={(e) => {
            if (Date.now() - menuOpenedAtRef.current < 400) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onToggleReaction && (
            <div className="flex gap-0.5 px-1.5 py-1.5 border-b border-line">
              {QUICK_REACTIONS.map((emoji) => {
                const mine = Boolean(
                  currentUserId != null &&
                    message.reactions?.some(
                      (r) => r.emoji === emoji && r.userIds.includes(currentUserId)
                    )
                );
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      onToggleReaction(message.id, emoji, mine);
                    }}
                    className={`w-7 h-7 rounded-full text-base leading-none transition ${
                      mine ? "bg-accent/30" : "hover:bg-surface-overlay"
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}
          {onReply && (
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onReply(message);
              }}
              className="w-full px-3 py-2 text-left text-sm text-content hover:bg-surface-overlay transition"
            >
              ↩️ Reply
            </button>
          )}
          {message.content && (
            <button
              type="button"
              onClick={handleCopy}
              className="w-full px-3 py-2 text-left text-sm text-content hover:bg-surface-overlay transition"
            >
              📋 Copy
            </button>
          )}
          {onTogglePin && (
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onTogglePin(message.id, Boolean(message.pinnedAt));
              }}
              className="w-full px-3 py-2 text-left text-sm text-content hover:bg-surface-overlay transition"
            >
              {message.pinnedAt ? "📌 Unpin" : "📌 Pin"}
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onEdit(message.id, message.content ?? "");
              }}
              className="w-full px-3 py-2 text-left text-sm text-content hover:bg-surface-overlay transition"
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
              className="w-full px-3 py-2 text-left text-sm text-danger hover:bg-surface-overlay transition"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </>
  );
}
