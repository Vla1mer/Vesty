import { useLanguage } from "../context/useLanguage";
import { MessageSquare } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetFriendsQuery } from "../store/friendApi";
import { useGetUsersByIdsQuery } from "../store/userApi";
import { getChatDisplayName } from "../utils/chats";
import { isDirectChat } from "../types/api";
import type { ChatDto, FriendDto } from "../types/api";
import { ChatListItem } from "./ChatListItem";
import { Avatar } from "./Avatar";

interface Props {
  query: string;
  chats: ChatDto[];
  isChatOnline: (chat: ChatDto) => boolean;
  onPicked: () => void;
}

const fullName = (friend: FriendDto) =>
  [friend.name, friend.surname].filter(Boolean).join(" ");

export function SearchResults({ query, chats, isChatOnline, onPicked }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: friends = [], isLoading: loadingFriends } = useGetFriendsQuery();

  const term = query.trim().toLowerCase();

  const directPartnerIds = useMemo(
    () => new Set(chats.filter(isDirectChat).map((c) => c.partnerUserId)),
    [chats]
  );

  const friendsWithoutChat = useMemo(
    () => friends.filter((f) => !directPartnerIds.has(f.userId)),
    [friends, directPartnerIds]
  );

  const friendIdsMatchingByName = useMemo(() => {
    if (!term) return new Set<number>();
    return new Set(
      friends
        .filter((f) => fullName(f).toLowerCase().includes(term))
        .map((f) => f.userId)
    );
  }, [friends, term]);

  const matchedChats = useMemo(() => {
    if (!term) return [];
    return chats.filter(
      (c) =>
        getChatDisplayName(c).toLowerCase().includes(term) ||
        (isDirectChat(c) &&
          !!c.partnerUserId &&
          friendIdsMatchingByName.has(c.partnerUserId))
    );
  }, [chats, term, friendIdsMatchingByName]);

  const matchedFriends = useMemo(() => {
    if (!term) return [];
    return friendsWithoutChat.filter(
      (f) =>
        f.userName.toLowerCase().includes(term) ||
        fullName(f).toLowerCase().includes(term)
    );
  }, [friendsWithoutChat, term]);

  const friendIdsWithoutChat = useMemo(
    () => friendsWithoutChat.map((f) => f.userId).sort((a, b) => a - b),
    [friendsWithoutChat]
  );
  const { data: friendProfiles = [] } = useGetUsersByIdsQuery(friendIdsWithoutChat, {
    skip: !term || friendIdsWithoutChat.length === 0,
  });
  const closedIds = new Set(
    friendProfiles.filter((u) => u.canMessage === false).map((u) => u.id)
  );

  if (matchedChats.length === 0 && matchedFriends.length === 0 && !loadingFriends) {
    return (
      <div className="text-center py-12 text-content-muted">
        <p>{t("search.noMatches", { query })}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {matchedChats.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-content-subtle font-semibold mb-2 px-5">
            {t("search.chats")}
          </h2>
          <div>
            {matchedChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                online={isChatOnline(chat)}
                onClick={onPicked}
              />
            ))}
          </div>
        </section>
      )}

      {matchedFriends.length > 0 && (
        <section className="px-4">
          <h2 className="text-xs uppercase tracking-wide text-content-subtle font-semibold mb-2 px-1">
            {t("search.friends")}
          </h2>
          <div className="space-y-2">
            {matchedFriends.map((f) => {
              const canMessage = !closedIds.has(f.userId);
              return (
                <button
                  key={f.userId}
                  type="button"
                  disabled={!canMessage}
                  onClick={() => {
                    onPicked();
                    navigate(`/chats/new/${f.userId}`);
                  }}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-line bg-surface-raised hover:bg-surface-overlay hover:border-accent-strong transition text-left disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-surface-raised disabled:hover:border-line"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      userId={f.userId}
                      userName={f.userName}
                      name={f.name ?? undefined}
                      surname={f.surname ?? undefined}
                      avatarUpdatedAt={f.avatarUpdatedAt}
                    />
                    <div className="min-w-0">
                      <p className="text-content font-medium truncate">{f.userName}</p>
                      {canMessage ? (
                        fullName(f) && (
                          <p className="text-xs text-content-muted truncate">{fullName(f)}</p>
                        )
                      ) : (
                        <p className="text-xs text-content-subtle truncate">
                          {t("users.messagesClosed")}
                        </p>
                      )}
                    </div>
                  </div>
                  {canMessage && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-accent-strong">
                      <MessageSquare size={13} aria-hidden="true" /> {t("friends.message")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {loadingFriends && matchedChats.length === 0 && (
        <p className="text-content-muted text-center py-4">{t("info.searching")}</p>
      )}
    </div>
  );
}
