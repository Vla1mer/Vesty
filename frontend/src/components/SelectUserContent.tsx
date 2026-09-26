import { Check, Clock, MessageSquare, UserPlus } from "lucide-react";
import { useLanguage } from "../context/useLanguage";
import { useMemo, useState } from "react";
import { useSearchUsersQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { FormError } from "./FormError";
import { Button } from "./ui/Button";
import {
  useGetFriendRequestsQuery,
  useGetFriendsQuery,
  useSendFriendRequestMutation,
} from "../store/friendApi";
import { TextInput } from "./ui/TextInput";

interface Props {
  onSelected: (userId: number) => void;
}

export function SelectUserContent({ onSelected }: Props) {
  const { t } = useLanguage();
  const { userId: currentUserId } = useAuth();
  const [search, setSearch] = useState("");
  const term = search.trim();
  const { data: users = [], isFetching, isError } = useSearchUsersQuery(term, {
    skip: term.length === 0,
  });

  const filtered = useMemo(
    () => users.filter((u) => u.id !== currentUserId),
    [users, currentUserId]
  );

  const { data: friends = [] } = useGetFriendsQuery();
  const { data: requests = [] } = useGetFriendRequestsQuery();
  const [sendRequest, sendState] = useSendFriendRequestMutation();

  const friendIds = new Set(friends.map((f) => f.userId));
  const requestedIds = new Set(requests.map((r) => r.userId));

  return (
    <>
      <div className="space-y-3 pb-3">
        <TextInput
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("info.searchUsers")}
          autoFocus
        />
        {isError && <FormError message={t("users.loadFailed")} />}
      </div>

      {term.length === 0 ? (
        <p className="text-sm text-content-subtle text-center py-6">
          {t("users.startTyping")}
        </p>
      ) : isFetching ? (
        <p className="text-content-muted text-center py-8">{t("info.searching")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-content-subtle text-center py-6">
          {t("info.noUsers")}
        </p>
      ) : (
        <ul className="space-y-1">
          {filtered.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-2 rounded px-3 py-2 transition-colors hover:bg-surface-muted"
            >
              <button
                type="button"
                onClick={() => onSelected(u.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-content">
                    {u.userName}
                  </p>
                  {(u.name || u.surname) && (
                    <p className="truncate text-xs text-content-muted">
                      {[u.name, u.surname].filter(Boolean).join(" ")}
                    </p>
                  )}
                </div>
              </button>

              {friendIds.has(u.id) ? (
                <span
                  title={t("users.alreadyFriends")}
                  className="flex items-center gap-1 text-xs text-content-muted"
                >
                  <Check size={13} aria-hidden="true" /> {t("friends.alreadyFriend")}
                </span>
              ) : requestedIds.has(u.id) ? (
                <span
                  title={t("users.requestPending")}
                  className="flex items-center gap-1 text-xs text-content-muted"
                >
                  <Clock size={13} aria-hidden="true" /> {t("friends.pending")}
                </span>
              ) : (
                <Button
                  size="xs"
                  variant="neutral"
                  disabled={sendState.isLoading && sendState.originalArgs === u.id}
                  onClick={() => sendRequest(u.id)}
                  aria-label={`Add ${u.userName} to friends`}
                  title={t("users.addFriend")}
                >
                  <UserPlus size={13} />
                </Button>
              )}

              <button
                type="button"
                onClick={() => onSelected(u.id)}
                aria-label={`Message ${u.userName}`}
                title={t("friends.message")}
                className="shrink-0 rounded p-1.5 text-accent-strong transition-colors hover:bg-surface-overlay"
              >
                <MessageSquare size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
