import { useEffect, useMemo, useState } from "react";
import {
  addChatMember,
  deleteChat,
  getChatMembers,
  removeChatMember,
} from "../api/chats";
import { getAllUsers } from "../api/users";
import { useAuth } from "../context/useAuth";
import { ConfirmDialog } from "./ConfirmDialog";
import { isDirectChat } from "../types/api";
import { getChatDisplayName } from "../utils/chats";
import type { ChatDto, UserDto } from "../types/api";
import type { AxiosError } from "axios";

interface Props {
  chat: ChatDto;
  onClose: () => void;
  onDeleted: () => void;
}

export function ChatInfoModal({ chat, onClose, onDeleted }: Props) {
  const { userId: currentUserId } = useAuth();
  const [members, setMembers] = useState<UserDto[]>([]);
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isGroup = !chat.isPrivate;
  const canDelete = chat.isPrivate || chat.creatorId === currentUserId;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const requests: Promise<unknown>[] = [getChatMembers(chat.id)];
        if (isGroup) requests.push(getAllUsers());
        const results = await Promise.all(requests);
        if (cancelled) return;
        setMembers(results[0] as UserDto[]);
        if (isGroup && results[1]) setAllUsers(results[1] as UserDto[]);
      } catch {
        if (!cancelled) setError("Failed to load chat info");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chat.id, isGroup]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && busyUserId === null && !deleting) onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [busyUserId, deleting, onClose]);

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  const filteredCandidates = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allUsers
      .filter((u) => !memberIds.has(u.id))
      .filter((u) => (term ? u.userName.toLowerCase().includes(term) : true));
  }, [allUsers, memberIds, search]);

  async function handleAdd(user: UserDto) {
    setBusyUserId(user.id);
    setError(null);
    try {
      await addChatMember(chat.id, user.id);
      setMembers((prev) => [...prev, user]);
    } catch (err) {
      const axiosErr = err as AxiosError;
      setError(
        axiosErr.response?.status === 403
          ? "Only owners or admins can add members"
          : "Failed to add member"
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRemove(user: UserDto) {
    setBusyUserId(user.id);
    setError(null);
    try {
      await removeChatMember(chat.id, user.id);
      setMembers((prev) => prev.filter((m) => m.id !== user.id));
    } catch (err) {
      const axiosErr = err as AxiosError;
      setError(
        axiosErr.response?.status === 403
          ? "You don't have permission to remove this member"
          : "Failed to remove member"
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteChat(chat.id);
      onDeleted();
    } catch (err) {
      const axiosErr = err as AxiosError;
      setError(
        axiosErr.response?.status === 403
          ? "You don't have permission to delete this chat"
          : "Failed to delete chat"
      );
      setIsDeleteOpen(false);
      setDeleting(false);
    }
  }

  const title = getChatDisplayName(chat);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4"
        onClick={busyUserId !== null || deleting ? undefined : onClose}
      >
        <div
          className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-2">
              <h2 className="text-2xl font-bold text-slate-100 break-words">
                {title}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {loading ? "Loading..." : `Members (${members.length})`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busyUserId !== null || deleting}
              className="text-slate-400 hover:text-slate-100 text-2xl leading-none disabled:opacity-50"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-2 mb-3">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-slate-400 text-center py-8">Loading...</p>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4">
              <section>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">
                  In this chat
                </h3>
                {members.length === 0 ? (
                  <p className="text-sm text-slate-500">No members yet</p>
                ) : (
                  <ul className="space-y-1">
                    {members.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between rounded bg-slate-900 px-3 py-2"
                      >
                        <div>
                          <p className="text-slate-100 text-sm">
                            {m.userName}
                            {m.id === currentUserId && (
                              <span className="text-xs text-amber-400 ml-2">
                                (you)
                              </span>
                            )}
                          </p>
                          {(m.name || m.surname) && (
                            <p className="text-xs text-slate-400">
                              {[m.name, m.surname].filter(Boolean).join(" ")}
                            </p>
                          )}
                        </div>
                        {isGroup && m.id !== currentUserId && (
                          <button
                            type="button"
                            onClick={() => handleRemove(m)}
                            disabled={busyUserId !== null}
                            className="text-xs px-2 py-1 rounded bg-red-900 hover:bg-red-800 text-red-100 disabled:opacity-50 transition"
                          >
                            {busyUserId === m.id ? "..." : "Remove"}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {isGroup && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">
                    Add a user
                  </h3>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by username..."
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:border-amber-500 mb-2"
                  />
                  {filteredCandidates.length === 0 ? (
                    <p className="text-sm text-slate-500 py-2 text-center">
                      {search ? "No users match your search" : "No more users to add"}
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {filteredCandidates.map((u) => (
                        <li
                          key={u.id}
                          className="flex items-center justify-between rounded bg-slate-900 px-3 py-2"
                        >
                          <div>
                            <p className="text-slate-100 text-sm">{u.userName}</p>
                            {(u.name || u.surname) && (
                              <p className="text-xs text-slate-400">
                                {[u.name, u.surname].filter(Boolean).join(" ")}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAdd(u)}
                            disabled={busyUserId !== null}
                            className="text-xs px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 transition"
                          >
                            {busyUserId === u.id ? "..." : "+ Add"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {canDelete && (
                <section className="pt-2 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsDeleteOpen(true)}
                    disabled={busyUserId !== null || deleting}
                    className="w-full px-4 py-2 rounded bg-red-900 hover:bg-red-800 text-red-100 disabled:opacity-50 transition font-medium"
                  >
                    🗑️ Delete chat
                  </button>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {isDeleteOpen && (
        <ConfirmDialog
          title="Delete chat?"
          message={
            isDirectChat(chat)
              ? `Are you sure you want to delete this conversation with ${
                  chat.partnerUserName ?? "this user"
                }? All messages will be permanently lost.`
              : `Are you sure you want to delete "${
                  chat.name ?? `chat #${chat.id}`
                }"? All messages and members will be permanently lost.`
          }
          confirmText="Delete"
          variant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}
    </>
  );
}
