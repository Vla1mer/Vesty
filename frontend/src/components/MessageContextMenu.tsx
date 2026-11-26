import type { MouseEvent, RefObject } from "react";
import { Copy, Pencil, Pin, PinOff, Reply, Trash2 } from "lucide-react";
import { useLanguage } from "../context/useLanguage";
import { ContextMenuItem as MenuItem, ContextMenuPanel } from "./ui/ContextMenu";
import type { MessageDto } from "../types/api";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

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
  const { t } = useLanguage();

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
    <ContextMenuPanel
      menuRef={menuRef}
      position={position}
      onClickCapture={onClickCapture}
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
          <Reply size={15} aria-hidden="true" /> {t("chat.reply")}
        </MenuItem>
      )}
      {message.content && (
        <MenuItem
          onClick={() =>
            run(() => navigator.clipboard?.writeText(message.content!))
          }
        >
          <Copy size={15} aria-hidden="true" /> {t("chat.copy")}
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
              <PinOff size={15} aria-hidden="true" /> {t("chat.unpin")}
            </>
          ) : (
            <>
              <Pin size={15} aria-hidden="true" /> {t("chat.pin")}
            </>
          )}
        </MenuItem>
      )}
      {onEdit && (
        <MenuItem
          onClick={() => run(() => onEdit(message.id, message.content ?? ""))}
        >
          <Pencil size={15} aria-hidden="true" /> {t("chat.edit")}
        </MenuItem>
      )}
      {onDelete && (
        <MenuItem danger onClick={() => run(() => onDelete(message.id))}>
          <Trash2 size={15} aria-hidden="true" /> {t("chat.delete")}
        </MenuItem>
      )}
    </ContextMenuPanel>
  );
}
