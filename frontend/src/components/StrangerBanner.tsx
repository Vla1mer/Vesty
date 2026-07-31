import { AnimatePresence, motion } from "framer-motion";
import { Ban, Clock, ShieldOff, UserPlus } from "lucide-react";
import type { ReactNode } from "react";
import {
  useBlockUserMutation,
  useGetBlockedUsersQuery,
  useUnblockUserMutation,
} from "../store/blockApi";
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
  const { data: friends = [] } = useGetFriendsQuery();
  const { data: requests = [] } = useGetFriendRequestsQuery();
  const { data: blocked = [] } = useGetBlockedUsersQuery();
  const [sendRequest, sendState] = useSendFriendRequestMutation();
  const [blockUser, blockState] = useBlockUserMutation();
  const [unblockUser, unblockState] = useUnblockUserMutation();

  const isFriend = friends.some((f) => f.userId === partnerUserId);
  const isBlocked = blocked.some((b) => b.userId === partnerUserId);
  const requested = requests.some((r) => r.userId === partnerUserId);
  const busy =
    sendState.isLoading || blockState.isLoading || unblockState.isLoading;

  const name = <span className="font-medium text-content">{partnerName}</span>;

  return (
    <AnimatePresence mode="wait">
      {isBlocked ? (
        <Banner
          key="blocked"
          text={<>You blocked {name}. They cannot message you.</>}
          actions={
            <Button
              size="xs"
              variant="neutral"
              disabled={busy}
              onClick={() => unblockUser(partnerUserId)}
            >
              <ShieldOff size={13} /> Unblock
            </Button>
          }
        />
      ) : !isFriend ? (
        <Banner
          key="stranger"
          text={<>{name} is not in your friends.</>}
          actions={
            <>
              {requested ? (
                <span className="flex items-center gap-1 text-xs text-content-muted">
                  <Clock size={13} aria-hidden="true" /> Request sent
                </span>
              ) : (
                <Button
                  size="xs"
                  disabled={busy}
                  onClick={() => sendRequest(partnerUserId)}
                >
                  <UserPlus size={13} /> Add friend
                </Button>
              )}

              <Button
                size="xs"
                variant="danger"
                disabled={busy}
                onClick={() => blockUser(partnerUserId)}
              >
                <Ban size={13} /> Block
              </Button>
            </>
          }
        />
      ) : null}
    </AnimatePresence>
  );
}
