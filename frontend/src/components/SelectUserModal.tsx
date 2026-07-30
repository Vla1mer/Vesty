import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllUsersQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import type { UserDto } from "../types/api";

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

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

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
    <div
      className="fixed inset-0 bg-scrim/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-line rounded-card shadow-modal p-6 w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-content">Start a chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-content-muted hover:text-content text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by username..."
          autoFocus
          className="w-full px-3 py-2 rounded bg-surface border border-line-strong text-content placeholder-content-muted focus:outline-none focus:border-accent-strong mb-3"
        />

        {isError && (
          <div className="text-sm text-danger bg-danger-soft border border-danger/40 rounded p-2 mb-3">
            Failed to load users
          </div>
        )}

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
                    <span className="text-xs text-accent-strong">💬</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
