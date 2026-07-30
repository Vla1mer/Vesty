import { MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllUsersQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import type { UserDto } from "../types/api";
import { FormError } from "./FormError";
import { Modal } from "./ui/Modal";
import { TextInput } from "./ui/TextInput";

interface Props {
  onClose: () => void;
}

export function SelectUserModal({ onClose }: Props) {
  const navigate = useNavigate();
  const { userId: currentUserId } = useAuth();
  const [search, setSearch] = useState("");
  const { data: users = [], isFetching, isError } = useGetAllUsersQuery(
    undefined,
    { skip: search.trim().length === 0 }
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return users
      .filter((u) => u.id !== currentUserId)
      .filter((u) => u.userName.toLowerCase().includes(term));
  }, [users, search, currentUserId]);

  function handleSelect(user: UserDto) {
    navigate(`/chats/new/${user.id}`);
  }

  return (
    <Modal title="Start a chat" onClose={onClose} size="md" layout="column">
      <div className="shrink-0 space-y-3 pb-3">
        <TextInput
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username..."
          autoFocus
        />
        {isError && <FormError message="Failed to load users" />}
      </div>

      <div className="flex-1 overflow-y-auto">
          {search.trim().length === 0 ? (
            <p className="text-sm text-content-subtle text-center py-6">
              Start typing to find someone
            </p>
          ) : isFetching ? (
            <p className="text-content-muted text-center py-8">Searching...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-content-subtle text-center py-6">
              No users match your search
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(u)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-surface-overlay transition text-left"
                  >
                    <div>
                      <p className="text-content text-sm font-medium">
                        {u.userName}
                      </p>
                      {(u.name || u.surname) && (
                        <p className="text-xs text-content-muted">
                          {[u.name, u.surname].filter(Boolean).join(" ")}
                        </p>
                      )}
                    </div>
                    <MessageSquare size={14} aria-hidden="true" className="shrink-0 text-accent-strong" />
                  </button>
                </li>
              ))}
            </ul>
          )}
      </div>
    </Modal>
  );
}
