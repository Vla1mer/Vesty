import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageSquare, UserPlus, UserX, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useAcceptFriendRequestMutation,
  useGetFriendRequestsQuery,
  useGetFriendsQuery,
  useRemoveFriendMutation,
} from "../store/friendApi";
import { Avatar } from "./Avatar";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { FormError } from "./FormError";
import { ChatListSkeleton } from "./ui/Skeleton";
import type { FriendDto } from "../types/api";

function displayName(friend: FriendDto): string {
  return [friend.name, friend.surname].filter(Boolean).join(" ") || friend.userName;
}

interface RowProps {
  friend: FriendDto;
  actions: React.ReactNode;
}

function FriendRow({ friend, actions }: RowProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 rounded-card px-3 py-2 transition-colors hover:bg-surface-muted"
    >
      <Avatar
        userId={friend.userId}
        userName={friend.userName}
        name={friend.name ?? undefined}
        surname={friend.surname ?? undefined}
        avatarUpdatedAt={friend.avatarUpdatedAt}
        size="lg"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-content">
          {displayName(friend)}
        </p>
        <p className="truncate text-xs text-content-muted">@{friend.userName}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </motion.li>
  );
}

export function FriendsContent() {
  const navigate = useNavigate();
  const { data: friends = [], isLoading, isError } = useGetFriendsQuery();
  const { data: requests = [] } = useGetFriendRequestsQuery();
  const [acceptRequest, { isLoading: accepting }] = useAcceptFriendRequestMutation();
  const [removeFriend, { isLoading: removing }] = useRemoveFriendMutation();

  const busy = accepting || removing;
  const incoming = requests.filter((r) => r.isIncoming);
  const outgoing = requests.filter((r) => !r.isIncoming);

  if (isLoading) return <ChatListSkeleton rows={4} />;
  if (isError) return <FormError message="Failed to load friends" />;

  return (
    <div className="space-y-8">
      {incoming.length > 0 && (
        <section>
          <h2 className="mb-2 px-3 text-sm font-semibold text-content">
            Requests
            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-contrast">
              {incoming.length}
            </span>
          </h2>
          <ul>
            <AnimatePresence initial={false}>
              {incoming.map((request) => (
                <FriendRow
                  key={request.userId}
                  friend={request}
                  actions={
                    <>
                      <Button
                        size="xs"
                        disabled={busy}
                        onClick={() => acceptRequest(request.userId)}
                        aria-label="Accept request"
                      >
                        <Check size={14} /> Accept
                      </Button>
                      <Button
                        size="xs"
                        variant="neutral"
                        disabled={busy}
                        onClick={() => removeFriend(request.userId)}
                        aria-label="Decline request"
                      >
                        <X size={14} />
                      </Button>
                    </>
                  }
                />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-2 px-3 text-sm font-semibold text-content">Sent</h2>
          <ul>
            <AnimatePresence initial={false}>
              {outgoing.map((request) => (
                <FriendRow
                  key={request.userId}
                  friend={request}
                  actions={
                    <Button
                      size="xs"
                      variant="neutral"
                      disabled={busy}
                      onClick={() => removeFriend(request.userId)}
                    >
                      Cancel
                    </Button>
                  }
                />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 px-3 text-sm font-semibold text-content">
          Friends
          {friends.length > 0 && (
            <span className="ml-2 text-content-muted">{friends.length}</span>
          )}
        </h2>

        {friends.length === 0 ? (
          <EmptyState
            Icon={UserPlus}
            title="No friends yet"
            description="Find people through search and send them a request."
          />
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {friends.map((friend) => (
                <FriendRow
                  key={friend.userId}
                  friend={friend}
                  actions={
                    <>
                      <Button
                        size="xs"
                        variant="neutral"
                        onClick={() => navigate(`/chats/new/${friend.userId}`)}
                        aria-label="Message"
                        title="Message"
                      >
                        <MessageSquare size={14} />
                      </Button>
                      <Button
                        size="xs"
                        variant="danger"
                        disabled={busy}
                        onClick={() => removeFriend(friend.userId)}
                        aria-label="Remove friend"
                        title="Remove friend"
                      >
                        <UserX size={14} />
                      </Button>
                    </>
                  }
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  );
}
