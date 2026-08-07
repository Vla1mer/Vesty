import { useRef } from "react";
import type { FormEvent, RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Paperclip, Pencil, Reply, X } from "lucide-react";
import { EmojiPickerButton } from "./EmojiPickerButton";
import { insertAtSelection } from "../utils/text";
import { AttachmentDrafts } from "./AttachmentDrafts";
import { FormError } from "./FormError";
import { Button } from "./ui/Button";
import { TextInput } from "./ui/TextInput";
import type { MessageDto } from "../types/api";
import type { useAttachmentUploads } from "../hooks/useAttachmentUploads";

type Attachments = ReturnType<typeof useAttachmentUploads>;

const MESSAGE_LIMIT = 2000;

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  attachments: Attachments;
  editingMessage?: MessageDto;
  isEditing: boolean;
  onCancelEdit: () => void;
  replyTo: MessageDto | null;
  replyAuthorName?: string;
  onCancelReply: () => void;
  error: string | null;
  busy: boolean;
  blocked: boolean;
}

export function MessageComposer({
  value,
  onChange,
  onSubmit,
  inputRef,
  attachments,
  editingMessage,
  isEditing,
  onCancelEdit,
  replyTo,
  replyAuthorName,
  onCancelReply,
  error,
  busy,
  blocked,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative border-t border-line bg-surface sticky bottom-0">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden px-4 pt-3"
          >
            <FormError message={error} />
          </motion.div>
        )}
      </AnimatePresence>

      {editingMessage && (
        <div className="flex items-center gap-3 px-4 pt-3 -mb-1">
          <Pencil size={18} aria-hidden="true" className="shrink-0 text-accent-strong" />
          <div className="flex-1 min-w-0 border-l-2 border-accent-strong pl-3">
            <p className="text-xs font-medium text-accent-strong">Editing</p>
            <p className="text-sm text-content-muted truncate">
              {editingMessage.content}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelEdit}
            aria-label="Cancel editing"
            className="text-content-muted hover:text-content"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {replyTo && !editingMessage && (
        <div className="flex items-center gap-3 px-4 pt-3 -mb-1">
          <Reply size={18} aria-hidden="true" className="shrink-0 text-accent-strong" />
          <div className="flex-1 min-w-0 border-l-2 border-accent-strong pl-3">
            <p className="text-xs font-medium text-accent-strong">
              Reply to {replyAuthorName ?? `User #${replyTo.userId}`}
            </p>
            <p className="text-sm text-content-muted truncate">{replyTo.content}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="text-content-muted hover:text-content"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <AttachmentDrafts uploads={attachments.uploads} onRemove={attachments.remove} />

      <form onSubmit={onSubmit} className="flex gap-2 p-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach file"
          title="Attach file"
          className="shrink-0 px-2 text-content-muted hover:text-accent-strong transition"
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            attachments.add(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
          className="hidden"
        />
        <EmojiPickerButton
          disabled={busy || blocked}
          onPick={(emoji) => {
            const input = inputRef.current;
            const start = input?.selectionStart ?? value.length;
            const end = input?.selectionEnd ?? value.length;
            const next = insertAtSelection(value, emoji, start, end, MESSAGE_LIMIT);

            onChange(next.value);
            requestAnimationFrame(() => {
              input?.focus();
              input?.setSelectionRange(next.caret, next.caret);
            });
          }}
        />
        <TextInput
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && isEditing) onCancelEdit();
          }}
          placeholder={
            blocked ? "Unblock this user to send messages" : "Type a message..."
          }
          maxLength={MESSAGE_LIMIT}
          disabled={busy || blocked}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={
            busy ||
            blocked ||
            attachments.isUploading ||
            (!value.trim() && attachments.readyIds.length === 0)
          }
          className="px-5"
        >
          {busy ? "..." : isEditing ? "Save" : "Send"}
        </Button>
      </form>
    </div>
  );
}
