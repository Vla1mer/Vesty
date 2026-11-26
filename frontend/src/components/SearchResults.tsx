import { useLanguage } from "../context/useLanguage";
import { MessageSquare } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllUsersQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { getChatDisplayName } from "../utils/chats";
import { isDirectChat } from "../types/api";
import type { ChatDto } from "../types/api";
import { ChatListItem } from "./ChatListItem";
import { Avatar } from "./Avatar";

interface Props {
  query: string;
  chats: ChatDto[];
  isChatOnline: (chat: ChatDto) => boolean;
}

export function SearchResults({ query, chats, isChatOnline }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { userId: currentUserId } = useAuth();
  const { data: allUsers = [], isLoading: loadingUsers } = useGetAllUsersQuery();

  const term = query.trim().toLowerCase();

  const matchedChats = useMemo(() => {
    if (!term) return [];
    return chats.filter((c) => {
      const name = getChatDisplayName(c).toLowerCase();
      return name.includes(term);
    });
  }, [chats, term]);

  const dmPartnerIds = useMemo(
    () =>
      new Set(
        chats
          .filter(isDirectChat)
          .filter((c) => c.partnerUserName)
          .map((c) => c.partnerUserName!.toLowerCase())
      ),
    [chats]
  );

  const matchedUsers = useMemo(() => {
    if (!term) return [];
    return allUsers
      .filter((u) => u.id !== currentUserId)
      .filter((u) => u.userName.toLowerCase().includes(term))
      .filter((u) => !dmPartnerIds.has(u.userName.toLowerCase()))
      .slice(0, 20);
  }, [allUsers, term, currentUserId, dmPartnerIds]);

  if (matchedChats.length === 0 && matchedUsers.length === 0 && !loadingUsers) {
    return (
      <div className="text-center py-12 text-content-muted">
        <p>No matches for "{query}"</p>
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
              <ChatListItem key={chat.id} chat={chat} online={isChatOnline(chat)} />
            ))}
          </div>
        </section>
      )}

      {matchedUsers.length > 0 && (
        <section className="px-4">
          <h2 className="text-xs uppercase tracking-wide text-content-subtle font-semibold mb-2 px-1">
            {t("search.users")}
          </h2>
          <div className="space-y-2">
            {matchedUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => navigate(`/chats/new/${u.id}`)}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-line bg-surface-raised hover:bg-surface-overlay hover:border-accent-strong transition text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    userId={u.id}
                    userName={u.userName}
                    name={u.name}
                    surname={u.surname}
                    avatarUpdatedAt={u.avatarUpdatedAt}
                  />
                  <div className="min-w-0">
                    <p className="text-content font-medium truncate">{u.userName}</p>
                    {(u.name || u.surname) && (
                      <p className="text-xs text-content-muted truncate">
                        {[u.name, u.surname].filter(Boolean).join(" ")}
                      </p>
                    )}
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-accent-strong">
                  <MessageSquare size={13} aria-hidden="true" /> Message
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {loadingUsers && matchedChats.length === 0 && (
        <p className="text-content-muted text-center py-4">{t("info.searching")}</p>
      )}
    </div>
  );
}
