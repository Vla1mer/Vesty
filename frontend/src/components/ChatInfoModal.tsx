import { ArrowDown, ArrowUp, Crown, Eraser, LogOut, Pencil, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useClearChatForMeMutation,
  useDeleteChatMutation,
  useRenameChatMutation,
  useGetChatMembersQuery,
  useAddChatMemberMutation,
  useRemoveChatMemberMutation,
  useUpdateMemberRoleMutation,
  useTransferChatOwnershipMutation,
} from "../store/chatApi";
import { useGetAllUsersQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { Avatar } from "./Avatar";
import { ChatAvatarEditor } from "./ChatAvatarEditor";
import { Button } from "./ui/Button";
import { TextInput } from "./ui/TextInput";
import { Modal } from "./ui/Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { isDirectChat, UserRole } from "../types/api";
import { getChatDisplayName } from "../utils/chats";
import { chatNameSchema } from "../validation/chatSchemas";
import { ValidationError } from "yup";
import type { ChatDto, UserDto, ChatMemberWithRoleDto } from "../types/api";
import type { AxiosBaseQueryError } from "../api/axiosBaseQuery";
import { FormError } from "./FormError";
import { AnimatePresence } from "framer-motion";
import { getApiErrorMessage } from "../utils/apiError";

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
  const [clearChatForMe, { isLoading: clearing }] = useClearChatForMeMutation();
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [renameChat] = useRenameChatMutation();
  const [addChatMember] = useAddChatMemberMutation();
  const [removeChatMember] = useRemoveChatMemberMutation();
  const [updateMemberRole] = useUpdateMemberRoleMutation();
  const [transferChatOwnership] = useTransferChatOwnershipMutation();
  const [transferTarget, setTransferTarget] =
    useState<ChatMemberWithRoleDto | null>(null);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [search, setSearch] = useState("");
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(chat.name ?? "");
  const [renaming, setRenaming] = useState(false);

  const isGroup = !chat.isPrivate;

  const {
    data: members = [],
    isLoading: loading,
    isFetching: membersFetching,
    isError: membersError,
  } = useGetChatMembersQuery(chat.id);
  const { data: allUsers = [], isFetching: usersFetching } = useGetAllUsersQuery(
    undefined,
    { skip: !isGroup || search.trim().length === 0 }
  );

  const isCallerOwner = useMemo(
    () =>
      members.some(
        (m) => m.userId === currentUserId && m.roleId === UserRole.Owner
      ),
    [members, currentUserId]
  );

  const canDelete = chat.isPrivate || isCallerOwner;
  const canRename = isGroup && isCallerOwner;

  const canManageAvatar = useMemo(
    () =>
      isGroup &&
      members.some(
        (m) =>
          m.userId === currentUserId &&
          (m.roleId === UserRole.Owner || m.roleId === UserRole.Admin)
      ),
    [isGroup, members, currentUserId]
  );

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.userId)),
    [members]
  );

  const filteredCandidates = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return allUsers
      .filter((u) => !memberIds.has(u.id))
      .filter((u) => u.userName.toLowerCase().includes(term));
  }, [allUsers, memberIds, search]);

  async function handleAdd(user: UserDto) {
    setBusyUserId(user.id);
    setError(null);
    try {
      await addChatMember({ chatId: chat.id, userId: user.id }).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to add member"));
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

  async function handleTransferOwnership() {
    if (!transferTarget) return;
    setBusyUserId(transferTarget.userId);
    setError(null);
    try {
      await transferChatOwnership({
        chatId: chat.id,
        userId: transferTarget.userId,
      }).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to transfer ownership"));
    } finally {
      setTransferTarget(null);
      setBusyUserId(null);
    }
  }

  async function handleLeave() {
    if (currentUserId === null) return;
    setLeaving(true);
    setError(null);
    try {
      await removeChatMember({ chatId: chat.id, userId: currentUserId }).unwrap();
      setIsLeaveOpen(false);
      onDeleted();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to leave the chat"));
      setIsLeaveOpen(false);
    } finally {
      setLeaving(false);
    }
  }

  async function handleClearForMe() {
    setError(null);
    try {
      await clearChatForMe(chat.id).unwrap();
      setIsClearOpen(false);
      onClose();
      onDeleted?.();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete the chat"));
      setIsClearOpen(false);
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
      <Modal
        onClose={onClose}
        closeDisabled={busyUserId !== null || deleting || leaving}
        ariaLabel="Chat info"
        size="md"
        layout="column"
        layer="base"
        title={
          <div className="flex-1 pr-2">
              {isRenaming ? (
                <div className="flex flex-col gap-2">
                  <TextInput
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    autoFocus
                    maxLength={200}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename();
                      if (e.key === "Escape") setIsRenaming(false);
                    }}
                    className="text-xl font-bold"
                  />
                  <div className="flex gap-2">
                    <Button size="xs" onClick={handleRename} disabled={renaming || !nameDraft.trim()}>
                      {renaming ? "..." : "Save"}
                    </Button>
                    <Button size="xs" variant="neutral" onClick={() => setIsRenaming(false)} disabled={renaming}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-content break-words">
                    {title}
                  </h2>
                  {canRename && (
                    <button
                      type="button"
                      onClick={() => {
                        setNameDraft(chat.name ?? "");
                        setIsRenaming(true);
                      }}
                      className="text-content-muted hover:text-accent-strong transition text-sm"
                      aria-label="Rename chat"
                      title="Rename chat"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              )}
              {!isRenaming && (
                <p className="text-sm text-content-muted mt-1">
                  {loading ? "Loading..." : `Members (${members.length})`}
                </p>
              )}
              {canManageAvatar && (
                <div className="mt-4">
                  <ChatAvatarEditor
                    chatId={chat.id}
                    name={title}
                    avatarUpdatedAt={chat.avatarUpdatedAt}
                  />
                </div>
              )}
          </div>
        }
      >

          {(error || membersError) && (
            <FormError
              className="mb-3"
              message={error ?? "Failed to load chat info"}
            />
          )}

          {loading ? (
            <p className="text-content-muted text-center py-8">Loading...</p>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4">
              <section>
                <h3 className="text-sm font-semibold text-content-muted mb-2">
                  In this chat
                </h3>
                {members.length === 0 ? (
                  <p className="text-sm text-content-subtle">No members yet</p>
                ) : (
                  <ul className="space-y-1">
                    {members.map((m) => (
                      <li
                        key={m.userId}
                        className="flex items-center justify-between rounded bg-surface px-3 py-2 gap-2"
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <Avatar
                            userId={m.userId}
                            userName={m.userName}
                            name={m.name}
                            surname={m.surname}
                            avatarUpdatedAt={m.avatarUpdatedAt}
                            size="sm"
                          />
                          <div className="min-w-0">
                          <p className="text-content text-sm truncate">
                            {m.userName}
                            {m.userId === currentUserId && (
                              <span className="text-xs text-accent-strong ml-2">
                                (you)
                              </span>
                            )}
                          </p>
                          {(m.name || m.surname) && (
                            <p className="text-xs text-content-muted truncate">
                              {[m.name, m.surname].filter(Boolean).join(" ")}
                            </p>
                          )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Бейдж роли */}
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              m.roleId === UserRole.Owner
                                ? "bg-accent-soft text-accent-strong"
                                : m.roleId === UserRole.Admin
                                ? "bg-info-soft text-info"
                                : "bg-surface-overlay text-content-muted"
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
                                  <Button
                                    size="xs"
                                    variant="info"
                                    className="py-0.5"
                                    onClick={() => handleChangeRole(m, UserRole.Admin)}
                                    disabled={busyUserId !== null}
                                    title="Make admin"
                                  >
                                    <ArrowUp size={11} aria-hidden="true" /> Admin
                                  </Button>
                                ) : (
                                  <Button
                                    size="xs"
                                    variant="neutral"
                                    className="py-0.5"
                                    onClick={() => handleChangeRole(m, UserRole.User)}
                                    disabled={busyUserId !== null}
                                    title="Remove admin"
                                  >
                                    <ArrowDown size={11} aria-hidden="true" /> Member
                                  </Button>
                                )}
                              </>
                            )}

                          {isGroup &&
                            isCallerOwner &&
                            m.userId !== currentUserId &&
                            m.roleId !== UserRole.Owner && (
                              <Button
                                size="xs"
                                variant="neutral"
                                className="py-0.5"
                                onClick={() => setTransferTarget(m)}
                                disabled={busyUserId !== null}
                                aria-label="Make owner"
                                title="Make owner"
                              >
                                <Crown size={11} aria-hidden="true" />
                              </Button>
                            )}

                          {/* Удалить участника */}
                          {isGroup && m.userId !== currentUserId && (
                            <Button
                              size="xs"
                              variant="danger"
                              onClick={() => handleRemove(m)}
                              disabled={busyUserId !== null}
                              aria-label="Remove member"
                            >
                              {busyUserId === m.userId ? "..." : <X size={12} />}
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {isGroup && (
                <section>
                  <h3 className="text-sm font-semibold text-content-muted mb-2">
                    Add a user
                  </h3>
                  <TextInput
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by username..."
                    className="mb-2 text-sm"
                  />
                  {search.trim().length === 0 ? (
                    <p className="text-sm text-content-subtle py-2 text-center">
                      Start typing to find users
                    </p>
                  ) : filteredCandidates.length === 0 ? (
                    <p className="text-sm text-content-subtle py-2 text-center">
                      {usersFetching ? "Searching..." : "No users match your search"}
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {filteredCandidates.map((u) => (
                        <li
                          key={u.id}
                          className="flex items-center justify-between rounded bg-surface px-3 py-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              userId={u.id}
                              userName={u.userName}
                              name={u.name}
                              surname={u.surname}
                              avatarUpdatedAt={u.avatarUpdatedAt}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-content text-sm truncate">
                                {u.userName}
                              </p>
                              {(u.name || u.surname) && (
                                <p className="text-xs text-content-muted truncate">
                                  {[u.name, u.surname].filter(Boolean).join(" ")}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button size="xs" onClick={() => handleAdd(u)} disabled={busyUserId !== null}>
                            {busyUserId === u.id ? "..." : "+ Add"}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {chat.isPrivate && (
                <section className="space-y-2 border-t border-line pt-2">
                  <Button
                    variant="neutral"
                    fullWidth
                    onClick={() => setIsClearOpen(true)}
                    disabled={busyUserId !== null || deleting || clearing}
                  >
                    <Eraser size={15} aria-hidden="true" />
                    Delete for me
                  </Button>
                </section>
              )}

              {isGroup && !loading && !(isCallerOwner && members.length === 1) && (
                <section className="space-y-2 border-t border-line pt-2">
                  {isCallerOwner ? (
                    <p className="text-xs text-content-subtle">
                      To leave this chat, hand ownership to another member first.
                    </p>
                  ) : (
                    <Button
                      variant="neutral"
                      fullWidth
                      onClick={() => setIsLeaveOpen(true)}
                      disabled={busyUserId !== null || deleting || leaving}
                    >
                      <LogOut size={15} aria-hidden="true" />
                      Leave chat
                    </Button>
                  )}
                </section>
              )}

              {canDelete && (
                <section className="pt-2">
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={() => setIsDeleteOpen(true)}
                    disabled={busyUserId !== null || deleting || membersFetching}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    Delete chat
                  </Button>
                </section>
              )}
            </div>
          )}
      </Modal>

      <AnimatePresence>
        {isClearOpen && (
          <ConfirmDialog
            title="Delete for me?"
            message="The conversation will disappear from your list. The other person keeps their copy, and the chat comes back if they write again."
            confirmText="Delete"
            variant="danger"
            loading={clearing}
            onConfirm={handleClearForMe}
            onCancel={() => setIsClearOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {transferTarget && (
          <ConfirmDialog
            title="Make owner?"
            message={`${transferTarget.userName} will own this chat and you become an admin. Only they will be able to hand it back.`}
            confirmText="Make owner"
            variant="primary"
            loading={busyUserId === transferTarget.userId}
            onConfirm={handleTransferOwnership}
            onCancel={() => setTransferTarget(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLeaveOpen && (
          <ConfirmDialog
            title="Leave chat?"
            message={`You will stop receiving messages from "${getChatDisplayName(
              chat
            )}". Someone will have to add you back to return.`}
            confirmText="Leave"
            variant="danger"
            loading={leaving}
            onConfirm={handleLeave}
            onCancel={() => setIsLeaveOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
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
      </AnimatePresence>
    </>
  );
}
