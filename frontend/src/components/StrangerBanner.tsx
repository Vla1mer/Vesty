import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "../context/useLanguage";
import { Ban, Clock, ShieldOff, UserPlus } from "lucide-react";
import type { ReactNode } from "react";
import {
  useGetBlockedUsersQuery,
  useUnblockUserMutation,
} from "../store/blockApi";
import { useBlockWithChatPrompt } from "../hooks/useBlockWithChatPrompt";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormError } from "./FormError";
import {
  useGetFriendRequestsQuery,
  useGetFriendsQuery,
  useSendFriendRequestMutation,
} from "../store/friendApi";
import { Button } from "./ui/Button";

interface Props {
  partnerUserId: number;
  partnerName: string;
}

function Banner({ text, actions }: { text: ReactNode; actions: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="mb-3 flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface-muted px-4 py-3"
    >
      <p className="min-w-0 flex-1 text-sm text-content-muted">{text}</p>
      {actions}
    </motion.div>
  );
}

export function StrangerBanner({ partnerUserId, partnerName }: Props) {
  const { t } = useLanguage();
  const { data: friends = [] } = useGetFriendsQuery();
  const { data: requests = [] } = useGetFriendRequestsQuery();
  const { data: blocked = [] } = useGetBlockedUsersQuery();
  const [sendRequest, sendState] = useSendFriendRequestMutation();
  const blocking = useBlockWithChatPrompt();
  const [unblockUser, unblockState] = useUnblockUserMutation();

  const isFriend = friends.some((f) => f.userId === partnerUserId);
  const isBlocked = blocked.some((b) => b.userId === partnerUserId);
  const requested = requests.some((r) => r.userId === partnerUserId);
  const busy =
    sendState.isLoading || blocking.isBlocking || unblockState.isLoading;

  return (
    <>
    <AnimatePresence>
      {blocking.askedForChatId !== null && (
        <ConfirmDialog
          title={t("friends.blockedChatTitle")}
          message={t("friends.blockedChatWarning")}
          confirmText={t("friends.blockedChatConfirm")}
          cancelText="Keep"
          variant="danger"
          loading={blocking.isClearing}
          error={blocking.clearError}
          onConfirm={blocking.confirmClear}
          onCancel={blocking.dismissClear}
        />
      )}
    </AnimatePresence>

    <FormError message={blocking.error} className="mb-3" />

    <AnimatePresence mode="wait">
      {isBlocked ? (
        <Banner
          key="blocked"
          text={<>{t("stranger.blocked", { name: partnerName })}</>}
          actions={
            <Button
              size="xs"
              variant="neutral"
              disabled={busy}
              onClick={() => unblockUser(partnerUserId)}
            >
              <ShieldOff size={13} /> {t("stranger.unblock")}
            </Button>
          }
        />
      ) : !isFriend ? (
        <Banner
          key="stranger"
          text={<>{t("stranger.notFriend", { name: partnerName })}</>}
          actions={
            <>
              {requested ? (
                <span className="flex items-center gap-1 text-xs text-content-muted">
                  <Clock size={13} aria-hidden="true" /> {t("stranger.requestSent")}
                </span>
              ) : (
                <Button
                  size="xs"
                  disabled={busy}
                  onClick={() => sendRequest(partnerUserId)}
                >
                  <UserPlus size={13} /> {t("stranger.addFriend")}
                </Button>
              )}

              <Button
                size="xs"
                variant="danger"
                disabled={busy}
                onClick={() => blocking.block(partnerUserId)}
              >
                <Ban size={13} /> {t("stranger.block")}
              </Button>
            </>
          }
        />
      ) : null}
    </AnimatePresence>
    </>
  );
}
