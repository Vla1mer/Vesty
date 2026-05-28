import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "../api/users";
import { useAuth } from "../context/useAuth";
import type { UserDto } from "../types/api";

export function UserSearch() {
  const navigate = useNavigate();
  const { userId: currentUserId } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load users");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return users
      .filter((u) => u.id !== currentUserId)
      .filter((u) => u.userName.toLowerCase().includes(term))
      .slice(0, 10);
  }, [users, query, currentUserId]);

  function handleSelect(user: UserDto) {
    navigate(`/chats/new/${user.id}`);
  }

  return (
    <div className="relative mb-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Search users to start a chat..."
        className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
      />

      {error && (
        <div className="absolute left-0 right-0 mt-2 text-sm text-red-400 bg-red-950 border border-red-900 rounded p-2 z-20">
          {error}
        </div>
      )}

      {query.trim() && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-slate-400 text-center">
              No users match your search
            </p>
          ) : (
            <ul>
              {filtered.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(u)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 transition text-left"
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
                    <span className="text-xs text-amber-400">💬 Message</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
