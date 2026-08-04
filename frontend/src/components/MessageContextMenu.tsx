import type { MouseEvent, ReactNode, RefObject } from "react";
import { Copy, Pencil, Pin, PinOff, Reply, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { MessageDto } from "../types/api";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface ItemProps {
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}

function MenuItem({ onClick, danger = false, children }: ItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-overlay transition ${
        danger ? "text-danger" : "text-content"
      }`}
    >
      {children}
    </button>
  );
}

interface Props {
  message: MessageDto;
  currentUserId?: number | null;
  menuRef: RefObject<HTMLDivElement | null>;
  position: { top: number; left: number };
  onClickCapture: (e: MouseEvent) => void;
  onClose: () => void;
  onEdit?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
  onReply?: (message: MessageDto) => void;
  onToggleReaction?: (messageId: number, emoji: string, active: boolean) => void;
  onTogglePin?: (messageId: number, pinned: boolean) => void;
}

export function MessageContextMenu({
  message,
  currentUserId,
  menuRef,
  position,
  onClickCapture,
  onClose,
  onEdit,
  onDelete,
  onReply,
  onToggleReaction,
  onTogglePin,
}: Props) {
  function run(action: () => void) {
    onClose();
    action();
  }

  function hasReacted(emoji: string) {
    return Boolean(
      currentUserId != null &&
        message.reactions?.some(
          (r) => r.emoji === emoji && r.userIds.includes(currentUserId)
        )
    );
  }

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.13, ease: [0.22, 1, 0.36, 1] }}
      className="fixed z-50 w-max max-w-[13rem] origin-top-left rounded-lg border border-line bg-surface-raised py-1 shadow-float"
      style={{ top: position.top, left: position.left }}
      onClickCapture={onClickCapture}
      onClick={(e) => e.stopPropagation()}
    >
      {onToggleReaction && (
        <div className="flex gap-0.5 px-1.5 py-1.5 border-b border-line">
          {QUICK_REACTIONS.map((emoji) => {
            const mine = hasReacted(emoji);
            return (
              <button
                key={emoji}
                type="button"
                onClick={() =>
                  run(() => onToggleReaction(message.id, emoji, mine))
                }
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
        <MenuItem onClick={() => run(() => onReply(message))}>
          <Reply size={15} aria-hidden="true" /> Reply
        </MenuItem>
      )}
      {message.content && (
        <MenuItem
          onClick={() =>
            run(() => navigator.clipboard?.writeText(message.content!))
          }
        >
          <Copy size={15} aria-hidden="true" /> Copy
        </MenuItem>
      )}
      {onTogglePin && (
        <MenuItem
          onClick={() =>
            run(() => onTogglePin(message.id, Boolean(message.pinnedAt)))
          }
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
        </MenuItem>
      )}
      {onEdit && (
        <MenuItem
          onClick={() => run(() => onEdit(message.id, message.content ?? ""))}
        >
          <Pencil size={15} aria-hidden="true" /> Edit
        </MenuItem>
      )}
      {onDelete && (
        <MenuItem danger onClick={() => run(() => onDelete(message.id))}>
          <Trash2 size={15} aria-hidden="true" /> Delete
        </MenuItem>
      )}
    </motion.div>
  );
}
