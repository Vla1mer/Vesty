import { useLanguage } from "../context/useLanguage";
import { MessageSquare } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetFriendsQuery } from "../store/friendApi";
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

  const matchedChats = useMemo(() => {
    if (!term) return [];
    return chats.filter((c) => getChatDisplayName(c).toLowerCase().includes(term));
  }, [chats, term]);

  const directPartnerIds = useMemo(
    () => new Set(chats.filter(isDirectChat).map((c) => c.partnerUserId)),
    [chats]
  );

  const matchedFriends = useMemo(() => {
    if (!term) return [];
    return friends
      .filter((f) => !directPartnerIds.has(f.userId))
      .filter(
        (f) =>
          f.userName.toLowerCase().includes(term) ||
          fullName(f).toLowerCase().includes(term)
      );
  }, [friends, term, directPartnerIds]);

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
            {matchedFriends.map((f) => (
              <button
                key={f.userId}
                type="button"
                onClick={() => {
                  onPicked();
                  navigate(`/chats/new/${f.userId}`);
                }}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-line bg-surface-raised hover:bg-surface-overlay hover:border-accent-strong transition text-left"
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
                    {fullName(f) && (
                      <p className="text-xs text-content-muted truncate">{fullName(f)}</p>
                    )}
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-accent-strong">
                  <MessageSquare size={13} aria-hidden="true" /> {t("friends.message")}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {loadingFriends && matchedChats.length === 0 && (
        <p className="text-content-muted text-center py-4">{t("info.searching")}</p>
      )}
    </div>
  );
}
