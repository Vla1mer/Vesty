import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetAllUsersQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { getChatDisplayName } from "../utils/chats";
import { isDirectChat } from "../types/api";
import type { ChatDto } from "../types/api";

interface Props {
  query: string;
  chats: ChatDto[];
}

export function SearchResults({ query, chats }: Props) {
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
      <div className="text-center py-12 text-slate-400">
        <p>No matches for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {matchedChats.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2 px-1">
            Chats
          </h2>
          <div className="space-y-2">
            {matchedChats.map((chat) => (
              <Link
                key={chat.id}
                to={`/chats/${chat.id}`}
                className="block rounded-lg border border-slate-700 bg-slate-800 p-3 hover:bg-slate-700 hover:border-amber-500 transition"
              >
                <h3 className="text-slate-100 font-medium">
                  {getChatDisplayName(chat)}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {matchedUsers.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2 px-1">
            Users
          </h2>
          <div className="space-y-2">
            {matchedUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => navigate(`/chats/new/${u.id}`)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-amber-500 transition text-left"
              >
                <div>
                  <p className="text-slate-100 font-medium">{u.userName}</p>
                  {(u.name || u.surname) && (
                    <p className="text-xs text-slate-400">
                      {[u.name, u.surname].filter(Boolean).join(" ")}
                    </p>
                  )}
                </div>
                <span className="text-xs text-amber-400">💬 Message</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {loadingUsers && matchedChats.length === 0 && (
        <p className="text-slate-400 text-center py-4">Searching...</p>
      )}
    </div>
  );
}
