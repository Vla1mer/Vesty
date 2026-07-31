import { AnimatePresence, motion } from "framer-motion";
import { Ban, Check, Clock, MessageSquare, Search, UserPlus, UserX, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchUsersQuery } from "../store/userApi";
import { useBlockWithChatPrompt } from "../hooks/useBlockWithChatPrompt";
import { ConfirmDialog } from "./ConfirmDialog";
import { TextInput } from "./ui/TextInput";
import { useAuth } from "../context/useAuth";
import {
  useAcceptFriendRequestMutation,
  useGetFriendRequestsQuery,
  useGetFriendsQuery,
  useRemoveFriendMutation,
  useSendFriendRequestMutation,
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
  const { userId } = useAuth();
  const [search, setSearch] = useState("");
  const term = search.trim();
  const { data: friends = [], isLoading, isError } = useGetFriendsQuery();
  const { data: requests = [] } = useGetFriendRequestsQuery();
  const [acceptRequest, acceptState] = useAcceptFriendRequestMutation();
  const [removeFriend, removeState] = useRemoveFriendMutation();
  const [sendRequest, sendState] = useSendFriendRequestMutation();
  const blocking = useBlockWithChatPrompt();
  const { data: found = [], isFetching: searching } = useSearchUsersQuery(term, {
    skip: term.length === 0,
  });

  // блокируем только ту строку, по которой идёт запрос, а не весь список
  function isBusy(userId: number): boolean {
    return (
      blocking.blockingUserId === userId ||
      [acceptState, removeState, sendState].some(
        (state) => state.isLoading && state.originalArgs === userId
      )
    );
  }
  const incoming = requests.filter((r) => r.isIncoming);
  const outgoing = requests.filter((r) => !r.isIncoming);

  if (isLoading) return <ChatListSkeleton rows={4} />;
  if (isError) return <FormError message="Failed to load friends" />;

  const friendIds = new Set(friends.map((f) => f.userId));
  const requestedIds = new Set(requests.map((r) => r.userId));
  const candidates = found.filter((u) => u.id !== userId);

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {blocking.askedForChatId !== null && (
          <ConfirmDialog
            title="Delete this chat?"
            message="You blocked this user. The conversation can be removed from your list — they keep their copy."
            confirmText="Delete for me"
            cancelText="Keep"
            variant="danger"
            loading={blocking.isClearing}
            error={blocking.clearError}
            onConfirm={blocking.confirmClear}
            onCancel={blocking.dismissClear}
          />
        )}
      </AnimatePresence>

      <FormError message={blocking.error} />

      <section>
        <div className="relative">
          <Search
            size={16}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
          />
          <TextInput
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find people by username..."
            className="rounded-lg pl-10"
          />
        </div>

        {term.length > 0 && (
          <ul className="mt-2">
            {searching ? (
              <li className="px-3 py-4 text-center text-sm text-content-subtle">
                Searching...
              </li>
            ) : candidates.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-content-subtle">
                No users match your search
              </li>
            ) : (
              candidates.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center gap-3 rounded-card px-3 py-2 transition-colors hover:bg-surface-muted"
                >
                  <Avatar
                    userId={user.id}
                    userName={user.userName}
                    name={user.name}
                    surname={user.surname}
                    avatarUpdatedAt={user.avatarUpdatedAt}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-content">
                      {[user.name, user.surname].filter(Boolean).join(" ") || user.userName}
                    </p>
                    <p className="truncate text-xs text-content-muted">@{user.userName}</p>
                  </div>
                  {friendIds.has(user.id) ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-content-muted">
                      <Check size={13} aria-hidden="true" /> Friend
                    </span>
                  ) : requestedIds.has(user.id) ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-content-muted">
                      <Clock size={13} aria-hidden="true" /> Pending
                    </span>
                  ) : (
                    <Button
                      size="xs"
                      disabled={isBusy(user.id)}
                      onClick={() => sendRequest(user.id)}
                    >
                      <UserPlus size={13} /> Add
                    </Button>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </section>

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
                        disabled={isBusy(request.userId)}
                        onClick={() => acceptRequest(request.userId)}
                        aria-label="Accept request"
                      >
                        <Check size={14} /> Accept
                      </Button>
                      <Button
                        size="xs"
                        variant="neutral"
                        disabled={isBusy(request.userId)}
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
                      disabled={isBusy(request.userId)}
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
                        variant="neutral"
                        disabled={isBusy(friend.userId)}
                        onClick={() => removeFriend(friend.userId)}
                        aria-label="Remove friend"
                        title="Remove friend"
                      >
                        <UserX size={14} />
                      </Button>
                      <Button
                        size="xs"
                        variant="danger"
                        disabled={isBusy(friend.userId)}
                        onClick={() => blocking.block(friend.userId)}
                        aria-label="Block user"
                        title="Block user"
                      >
                        <Ban size={14} />
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
