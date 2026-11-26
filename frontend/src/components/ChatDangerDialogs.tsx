import { AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/useLanguage";
import { getChatDisplayName } from "../utils/chats";
import type { useChatDangerActions } from "../hooks/useChatDangerActions";
import type { ChatDto } from "../types/api";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  chat: ChatDto;
  actions: ReturnType<typeof useChatDangerActions>;
}

export function ChatDangerDialogs({ chat, actions }: Props) {
  const { t } = useLanguage();
  const isGroup = !chat.isPrivate;

  return (
    <>
      <AnimatePresence>
        {actions.clear.open && (
          <ConfirmDialog
            title={t("danger.clearTitle")}
            message={t("danger.clearWarning")}
            confirmText={t("danger.clearConfirm")}
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
            title={t("danger.leaveTitle")}
            message={t("danger.leaveWarning", { chat: getChatDisplayName(chat) })}
            confirmText={t("danger.leaveConfirm")}
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
            title={t("danger.deleteTitle")}
            message={
              isGroup
                ? t("danger.deleteGroupWarning", { chat: getChatDisplayName(chat) })
                : t("danger.deleteDirectWarning")
            }
            confirmText={t("danger.deleteConfirm")}
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
