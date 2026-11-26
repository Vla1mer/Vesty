import { MessageSquare } from "lucide-react";
import { useLanguage } from "../context/useLanguage";
import { useMemo, useState } from "react";
import { useSearchUsersQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { FormError } from "./FormError";
import { TextInput } from "./ui/TextInput";
import { Avatar } from "./Avatar";

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
    () => users.filter((u) => u.id !== currentUserId && u.canMessage !== false),
    [users, currentUserId]
  );

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
          {filtered.map((u) => {
            const fullName = [u.name, u.surname].filter(Boolean).join(" ");
            return (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onSelected(u.id)}
                  aria-label={t("a11y.messageUser", { name: u.userName })}
                  className="flex w-full items-center gap-3 rounded px-3 py-2 text-left transition-colors hover:bg-surface-muted"
                >
                  <Avatar
                    userId={u.id}
                    userName={u.userName}
                    name={u.name}
                    surname={u.surname}
                    avatarUpdatedAt={u.avatarUpdatedAt}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content">{u.userName}</p>
                    {fullName && (
                      <p className="truncate text-xs text-content-muted">{fullName}</p>
                    )}
                  </div>
                  <MessageSquare
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 text-accent-strong"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
