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
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-100">Start a chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-2xl leading-none"
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
          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 mb-3"
        />

        {isError && (
          <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-2 mb-3">
            Failed to load users
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {search.trim().length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              Start typing to find someone
            </p>
          ) : isFetching ? (
            <p className="text-slate-400 text-center py-8">Searching...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              No users match your search
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(u)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-slate-700 transition text-left"
                  >
                    <div>
                      <p className="text-slate-100 text-sm font-medium">
                        {u.userName}
                      </p>
                      {(u.name || u.surname) && (
                        <p className="text-xs text-slate-400">
                          {[u.name, u.surname].filter(Boolean).join(" ")}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-amber-400">💬</span>
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
