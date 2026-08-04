import type { TouchEvent as ReactTouchEvent } from "react";
import { Check, Copy, Pencil, Pin, PinOff, Reply, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLongPress } from "../hooks/useLongPress";
import { useMessageMenu } from "../hooks/useMessageMenu";
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
  const hasActions = Boolean(
    onEdit || onDelete || onReply || onTogglePin || onToggleReaction
  );
  const menu = useMessageMenu(Boolean(message.content) || hasActions);

  function handleCopy() {
    if (message.content) navigator.clipboard?.writeText(message.content);
    menu.close();
  }

  function handleTap(e: ReactTouchEvent) {
    if (selectionMode) {
      onToggleSelect?.(message.id);
      return;
    }

    const touch = e.changedTouches[0];
    if (!touch) return;

    e.preventDefault();
    menu.openAt(touch.clientX, touch.clientY);
  }

  const longPress = useLongPress({
    onLongPress: () => onSelectStart?.(message.id),
    onTap: handleTap,
  });

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
            <Check size={12} strokeWidth={3} />
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
              ref={menu.bubbleRef}
              {...menu.triggerProps}
              {...longPress.handlers}
              style={{ WebkitTouchCallout: "none" }}
              className={`rounded-bubble px-4 py-2 select-none md:select-text shadow-raised transition ${
                menu.open || isEditing || longPress.pressing || selected
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
                  <Pin size={11} aria-hidden="true" className="inline -mt-0.5 mr-1" />
                  Pinned
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
                <AnimatePresence initial={false}>
                {message.reactions.map((r) => {
                  const mine =
                    currentUserId != null && r.userIds.includes(currentUserId);
                  return (
                    <motion.button
                      key={r.emoji}
                      type="button"
                      layout
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: "spring", stiffness: 520, damping: 26 }}
                      onClick={() => onToggleReaction?.(message.id, r.emoji, mine)}
                      title={`${r.userIds.length}`}
                      className={`px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                        mine
                          ? "bg-accent/20 border-accent-strong text-accent-strong"
                          : "bg-surface-raised border-line-strong text-content-muted hover:bg-surface-overlay"
                      }`}
                    >
                      {r.emoji} {r.userIds.length}
                    </motion.button>
                  );
                })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {menu.open && (
        <motion.div
          ref={menu.menuRef}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.13, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-50 w-max max-w-[13rem] origin-top-left rounded-lg border border-line bg-surface-raised py-1 shadow-float"
          style={{ top: menu.position.top, left: menu.position.left }}
          onClickCapture={menu.guardClick}
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
                      menu.close();
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
                menu.close();
                onReply(message);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-content hover:bg-surface-overlay transition"
            >
              <Reply size={15} aria-hidden="true" /> Reply
            </button>
          )}
          {message.content && (
            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-content hover:bg-surface-overlay transition"
            >
              <Copy size={15} aria-hidden="true" /> Copy
            </button>
          )}
          {onTogglePin && (
            <button
              type="button"
              onClick={() => {
                menu.close();
                onTogglePin(message.id, Boolean(message.pinnedAt));
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-content hover:bg-surface-overlay transition"
            >
              {message.pinnedAt ? (
                <>
                  <PinOff size={15} aria-hidden="true" /> Unpin
                </>
              ) : (
                <>
                  <Pin size={15} aria-hidden="true" /> Pin
                </>
              )}
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                menu.close();
                onEdit(message.id, message.content ?? "");
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-content hover:bg-surface-overlay transition"
            >
              <Pencil size={15} aria-hidden="true" /> Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                menu.close();
                onDelete(message.id);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-danger hover:bg-surface-overlay transition"
            >
              <Trash2 size={15} aria-hidden="true" /> Delete
            </button>
          )}
        </motion.div>
      )}
    </>
  );
}
