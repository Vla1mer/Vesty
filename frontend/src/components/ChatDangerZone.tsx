import { useLanguage } from "../context/useLanguage";
import { Eraser, LogOut, Trash2 } from "lucide-react";
import type { useChatDangerActions } from "../hooks/useChatDangerActions";
import type { ChatDto } from "../types/api";
import { Button } from "./ui/Button";
import { ChatDangerDialogs } from "./ChatDangerDialogs";

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
  const { t } = useLanguage();
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
            {t("danger.clear")}
          </Button>
        </section>
      )}

      {isGroup && !loading && !(isOwner && memberCount === 1) && (
        <section className="space-y-2 border-t border-line pt-3">
          {isOwner ? (
            <p className="text-xs text-content-subtle">
              {t("danger.ownerFirst")}
            </p>
          ) : (
            <Button
              variant="neutral"
              fullWidth
              onClick={actions.leave.ask}
              disabled={busy}
            >
              <LogOut size={15} aria-hidden="true" />
              {t("danger.leave")}
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
            {t("danger.delete")}
          </Button>
        </section>
      )}

      <ChatDangerDialogs chat={chat} actions={actions} />
    </>
  );
}
