import { AnimatePresence } from "framer-motion";
import { Eraser, LogOut, Trash2 } from "lucide-react";
import { getChatDisplayName } from "../utils/chats";
import type { useChatDangerActions } from "../hooks/useChatDangerActions";
import type { ChatDto } from "../types/api";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  chat: ChatDto;
  isOwner: boolean;
  canDelete: boolean;
  memberCount: number;
  loading: boolean;
  busy: boolean;
  actions: ReturnType<typeof useChatDangerActions>;
}

export function ChatDangerZone({
  chat,
  isOwner,
  canDelete,
  memberCount,
  loading,
  busy,
  actions,
}: Props) {
  const isGroup = !chat.isPrivate;

  return (
    <>
      {!loading && chat.isPrivate && (
        <section className="space-y-2 border-t border-line pt-3">
          <Button
            variant="neutral"
            fullWidth
            onClick={actions.clear.ask}
            disabled={busy}
          >
            <Eraser size={15} aria-hidden="true" />
            Delete for me
          </Button>
        </section>
      )}

      {isGroup && !loading && !(isOwner && memberCount === 1) && (
        <section className="space-y-2 border-t border-line pt-3">
          {isOwner ? (
            <p className="text-xs text-content-subtle">
              To leave this chat, hand ownership to another member first.
            </p>
          ) : (
            <Button
              variant="neutral"
              fullWidth
              onClick={actions.leave.ask}
              disabled={busy}
            >
              <LogOut size={15} aria-hidden="true" />
              Leave chat
            </Button>
          )}
        </section>
      )}

      {!loading && canDelete && (
        <section className="border-t border-line pt-3">
          <Button
            variant="danger"
            fullWidth
            onClick={actions.remove.ask}
            disabled={busy}
          >
            <Trash2 size={15} aria-hidden="true" />
            Delete chat
          </Button>
        </section>
      )}

      <AnimatePresence>
        {actions.clear.open && (
          <ConfirmDialog
            title="Delete for me?"
            message="The conversation will disappear from your list. The other person keeps their copy, and the chat comes back if they write again."
            confirmText="Delete"
            variant="danger"
            loading={actions.clear.loading}
            onConfirm={actions.clear.confirm}
            onCancel={actions.clear.cancel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {actions.leave.open && (
          <ConfirmDialog
            title="Leave chat?"
            message={`You will stop receiving messages from "${getChatDisplayName(
              chat
            )}". Someone will have to add you back to return.`}
            confirmText="Leave"
            variant="danger"
            loading={actions.leave.loading}
            onConfirm={actions.leave.confirm}
            onCancel={actions.leave.cancel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {actions.remove.open && (
          <ConfirmDialog
            title="Delete chat?"
            message={
              isGroup
                ? `Are you sure you want to delete "${getChatDisplayName(
                    chat
                  )}"? All messages and members will be permanently lost.`
                : `Are you sure you want to delete this conversation? All messages will be permanently lost.`
            }
            confirmText="Delete"
            variant="danger"
            loading={actions.remove.loading}
            onConfirm={actions.remove.confirm}
            onCancel={actions.remove.cancel}
          />
        )}
      </AnimatePresence>
    </>
  );
}
