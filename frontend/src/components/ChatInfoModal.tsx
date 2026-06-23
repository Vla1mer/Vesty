import { useEffect, useMemo, useState } from "react";
import {
  useDeleteChatMutation,
  useRenameChatMutation,
  useGetChatMembersQuery,
  useAddChatMemberMutation,
  useRemoveChatMemberMutation,
  useUpdateMemberRoleMutation,
} from "../store/chatApi";
import { useGetAllUsersQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { ConfirmDialog } from "./ConfirmDialog";
import { isDirectChat, UserRole } from "../types/api";
import { getChatDisplayName } from "../utils/chats";
import { chatNameSchema } from "../validation/chatSchemas";
import { ValidationError } from "yup";
import type { ChatDto, UserDto, ChatMemberWithRoleDto } from "../types/api";
import type { AxiosBaseQueryError } from "../api/axiosBaseQuery";

interface Props {
  chat: ChatDto;
  onClose: () => void;
  onDeleted: () => void;
}

const roleLabel: Record<number, string> = {
  [UserRole.Owner]: "Owner",
  [UserRole.Admin]: "Admin",
  [UserRole.User]: "Member",
};

export function ChatInfoModal({ chat, onClose, onDeleted }: Props) {
  const { userId: currentUserId } = useAuth();
  const [deleteChat] = useDeleteChatMutation();
  const [renameChat] = useRenameChatMutation();
  const [addChatMember] = useAddChatMemberMutation();
  const [removeChatMember] = useRemoveChatMemberMutation();
  const [updateMemberRole] = useUpdateMemberRoleMutation();
  const [search, setSearch] = useState("");
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(chat.name ?? "");
  const [renaming, setRenaming] = useState(false);

  const isGroup = !chat.isPrivate;
  const canDelete = chat.isPrivate || chat.creatorId === currentUserId;
  const canRename = isGroup && chat.creatorId === currentUserId;

  const {
    data: members = [],
    isLoading: loading,
    isError: membersError,
  } = useGetChatMembersQuery(chat.id);
  const { data: allUsers = [] } = useGetAllUsersQuery(undefined, {
    skip: !isGroup,
  });

  const isCallerOwner = useMemo(
    () =>
      members.some(
        (m) => m.userId === currentUserId && m.roleId === UserRole.Owner
      ),
    [members, currentUserId]
  );

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && busyUserId === null && !deleting) onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [busyUserId, deleting, onClose]);

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.userId)),
    [members]
  );

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
      await addChatMember({ chatId: chat.id, userId: user.id }).unwrap();
    } catch (err) {
      const status = (err as AxiosBaseQueryError).status;
      setError(
        status === 403
          ? "Only owners or admins can add members"
          : "Failed to add member"
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRemove(member: ChatMemberWithRoleDto) {
    setBusyUserId(member.userId);
    setError(null);
    try {
      await removeChatMember({ chatId: chat.id, userId: member.userId }).unwrap();
    } catch (err) {
      const status = (err as AxiosBaseQueryError).status;
      setError(
        status === 403
          ? "You don't have permission to remove this member"
          : "Failed to remove member"
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleChangeRole(member: ChatMemberWithRoleDto, newRole: number) {
    setBusyUserId(member.userId);
    setError(null);
    try {
      await updateMemberRole({
        chatId: chat.id,
        userId: member.userId,
        roleId: newRole,
      }).unwrap();
    } catch (err) {
      const status = (err as AxiosBaseQueryError).status;
      setError(
        status === 403
          ? "Only the owner can change roles"
          : "Failed to change role"
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteChat(chat.id).unwrap();
      onDeleted();
    } catch (err) {
      const status = (err as AxiosBaseQueryError).status;
      setError(
        status === 403
          ? "You don't have permission to delete this chat"
          : "Failed to delete chat"
      );
      setIsDeleteOpen(false);
      setDeleting(false);
    }
  }

  async function handleRename() {
    if (renaming) return;
    const newName = nameDraft.trim();

    try {
      await chatNameSchema.validate({ name: newName });
    } catch (validationErr) {
      setError((validationErr as ValidationError).message);
      return;
    }

    setRenaming(true);
    setError(null);
    try {
      await renameChat({ chatId: chat.id, name: newName }).unwrap();
      setIsRenaming(false);
    } catch (err) {
      const status = (err as AxiosBaseQueryError).status;
      setError(
        status === 403
          ? "Only the owner can rename this chat"
          : "Failed to rename chat"
      );
    } finally {
      setRenaming(false);
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
              {isRenaming ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    autoFocus
                    maxLength={200}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename();
                      if (e.key === "Escape") setIsRenaming(false);
                    }}
                    className="text-xl font-bold bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRename}
                      disabled={renaming || !nameDraft.trim()}
                      className="text-xs px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
                    >
                      {renaming ? "..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRenaming(false)}
                      disabled={renaming}
                      className="text-xs px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-100 break-words">
                    {title}
                  </h2>
                  {canRename && (
                    <button
                      type="button"
                      onClick={() => {
                        setNameDraft(chat.name ?? "");
                        setIsRenaming(true);
                      }}
                      className="text-slate-400 hover:text-amber-400 transition text-sm"
                      aria-label="Rename chat"
                      title="Rename chat"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              )}
              {!isRenaming && (
                <p className="text-sm text-slate-400 mt-1">
                  {loading ? "Loading..." : `Members (${members.length})`}
                </p>
              )}
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

          {(error || membersError) && (
            <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-2 mb-3">
              {error ?? "Failed to load chat info"}
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
                        key={m.userId}
                        className="flex items-center justify-between rounded bg-slate-900 px-3 py-2 gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-slate-100 text-sm truncate">
                            {m.userName}
                            {m.userId === currentUserId && (
                              <span className="text-xs text-amber-400 ml-2">
                                (you)
                              </span>
                            )}
                          </p>
                          {(m.name || m.surname) && (
                            <p className="text-xs text-slate-400 truncate">
                              {[m.name, m.surname].filter(Boolean).join(" ")}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Бейдж роли */}
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              m.roleId === UserRole.Owner
                                ? "bg-amber-900 text-amber-200"
                                : m.roleId === UserRole.Admin
                                ? "bg-blue-900 text-blue-200"
                                : "bg-slate-700 text-slate-300"
                            }`}
                          >
                            {roleLabel[m.roleId]}
                          </span>

                          {/* Управление ролью — только Owner, не для себя и не для Owner */}
                          {isGroup &&
                            isCallerOwner &&
                            m.userId !== currentUserId &&
                            m.roleId !== UserRole.Owner && (
                              <>
                                {m.roleId === UserRole.User ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleChangeRole(m, UserRole.Admin)
                                    }
                                    disabled={busyUserId !== null}
                                    className="text-xs px-2 py-0.5 rounded bg-blue-900 hover:bg-blue-800 text-blue-100 disabled:opacity-50 transition"
                                    title="Make admin"
                                  >
                                    ↑ Admin
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleChangeRole(m, UserRole.User)
                                    }
                                    disabled={busyUserId !== null}
                                    className="text-xs px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50 transition"
                                    title="Remove admin"
                                  >
                                    ↓ Member
                                  </button>
                                )}
                              </>
                            )}

                          {/* Удалить участника */}
                          {isGroup && m.userId !== currentUserId && (
                            <button
                              type="button"
                              onClick={() => handleRemove(m)}
                              disabled={busyUserId !== null}
                              className="text-xs px-2 py-0.5 rounded bg-red-900 hover:bg-red-800 text-red-100 disabled:opacity-50 transition"
                            >
                              {busyUserId === m.userId ? "..." : "✕"}
                            </button>
                          )}
                        </div>
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
