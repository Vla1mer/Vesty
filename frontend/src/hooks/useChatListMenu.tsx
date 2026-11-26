import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Ban, CheckCheck, Eraser, LogOut, Trash2, UserRound, UserRoundCheck } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/useLanguage";
import { useContextMenu } from "./useContextMenu";
import { useChatDangerActions } from "./useChatDangerActions";
import { useBlockWithChatPrompt } from "./useBlockWithChatPrompt";
import { useUserProfile } from "./useUserProfile";
import { useMarkChatReadMutation } from "../store/chatsApi";
import { useGetChatMembersQuery } from "../store/chatMembersApi";
import { useGetBlockedUsersQuery, useUnblockUserMutation } from "../store/blockApi";
import { getApiErrorMessage } from "../utils/apiError";
import { isDirectChat, UserRole, type ChatDto } from "../types/api";
import { ContextMenuItem, ContextMenuPanel } from "../components/ui/ContextMenu";
import { ChatDangerDialogs } from "../components/ChatDangerDialogs";
import { ConfirmDialog } from "../components/ConfirmDialog";

export function useChatListMenu() {
  const { t } = useLanguage();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menu = useContextMenu(true);
  const profile = useUserProfile();
  const blocking = useBlockWithChatPrompt();
  const [target, setTarget] = useState<ChatDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [markRead] = useMarkChatReadMutation();
  const [unblockUser] = useUnblockUserMutation();
  const { data: blocked = [] } = useGetBlockedUsersQuery();

  const isGroup = target !== null && !target.isPrivate;
  const { data: members = [] } = useGetChatMembersQuery(target?.id ?? 0, {
    skip: !isGroup,
  });
  const isOwner = members.some((m) => m.userId === userId && m.roleId === UserRole.Owner);

  const danger = useChatDangerActions({
    chatId: target?.id ?? 0,
    currentUserId: userId,
    onError: setError,
    onDone: () => {
      if (target && location.pathname.startsWith(`/chats/${target.id}`)) navigate("/chats");
    },
  });

  const partnerId = target && isDirectChat(target) ? target.partnerUserId ?? null : null;
  const partnerBlocked = partnerId !== null && blocked.some((b) => b.userId === partnerId);

  function openFor(chat: ChatDto, x: number, y: number) {
    setError(null);
    setTarget(chat);
    menu.openAt(x, y);
  }

  function run(action: () => void | Promise<unknown>) {
    menu.close();
    void action();
  }

  async function attempt(action: () => Promise<unknown>, fallback: string) {
    try {
      await action();
    } catch (err) {
      setError(getApiErrorMessage(err, fallback));
    }
  }

  const element = (
    <>
      <AnimatePresence>
        {menu.open && target && (
          <ContextMenuPanel
            menuRef={menu.menuRef}
            position={menu.position}
            onClickCapture={menu.guardClick}
          >
            {partnerId !== null && (
              <ContextMenuItem onClick={() => run(() => profile.open(partnerId))}>
                <UserRound size={15} aria-hidden="true" /> {t("chatMenu.openProfile")}
              </ContextMenuItem>
            )}
            {(target.unreadCount ?? 0) > 0 && (
              <ContextMenuItem
                onClick={() =>
                  run(() =>
                    attempt(() => markRead(target.id).unwrap(), t("chatMenu.markReadFailed"))
                  )
                }
              >
                <CheckCheck size={15} aria-hidden="true" /> {t("chatMenu.markRead")}
              </ContextMenuItem>
            )}
            {partnerId !== null &&
              (partnerBlocked ? (
                <ContextMenuItem
                  onClick={() =>
                    run(() =>
                      attempt(() => unblockUser(partnerId).unwrap(), t("chatMenu.unblockFailed"))
                    )
                  }
                >
                  <UserRoundCheck size={15} aria-hidden="true" /> {t("blocked.unblock")}
                </ContextMenuItem>
              ) : (
                <ContextMenuItem danger onClick={() => run(() => blocking.block(partnerId))}>
                  <Ban size={15} aria-hidden="true" /> {t("friends.block")}
                </ContextMenuItem>
              ))}
            {target.isPrivate && (
              <ContextMenuItem danger onClick={() => run(danger.clear.ask)}>
                <Eraser size={15} aria-hidden="true" /> {t("danger.clear")}
              </ContextMenuItem>
            )}
            {isGroup && !isOwner && (
              <ContextMenuItem danger onClick={() => run(danger.leave.ask)}>
                <LogOut size={15} aria-hidden="true" /> {t("danger.leave")}
              </ContextMenuItem>
            )}
            {isGroup && isOwner && (
              <ContextMenuItem danger onClick={() => run(danger.remove.ask)}>
                <Trash2 size={15} aria-hidden="true" /> {t("danger.delete")}
              </ContextMenuItem>
            )}
          </ContextMenuPanel>
        )}
      </AnimatePresence>

      {target && <ChatDangerDialogs chat={target} actions={danger} />}

      <AnimatePresence>
        {blocking.askedForChatId !== null && (
          <ConfirmDialog
            title={t("friends.blockedChatTitle")}
            message={t("friends.blockedChatWarning")}
            confirmText={t("friends.blockedChatConfirm")}
            cancelText={t("friends.blockedChatCancel")}
            variant="danger"
            loading={blocking.isClearing}
            error={blocking.clearError}
            onConfirm={blocking.confirmClear}
            onCancel={blocking.dismissClear}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{profile.modal}</AnimatePresence>
    </>
  );

  return {
    triggerRef: menu.triggerRef,
    openFor,
    openChatId: menu.open ? target?.id ?? null : null,
    error: error ?? blocking.error,
    element,
  };
}
