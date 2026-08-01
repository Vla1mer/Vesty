import { ArrowDown, ArrowUp, Crown, Settings, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useGetChatMembersQuery,
  useAddChatMemberMutation,
  useRemoveChatMemberMutation,
  useUpdateMemberRoleMutation,
  useTransferChatOwnershipMutation,
} from "../store/chatApi";
import { useGetAllUsersQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { Avatar, ChatAvatar } from "./Avatar";
import { Button } from "./ui/Button";
import { TextInput } from "./ui/TextInput";
import { Modal } from "./ui/Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { UserRole } from "../types/api";
import { getChatDisplayName } from "../utils/chats";
import type { ChatDto, UserDto, ChatMemberWithRoleDto } from "../types/api";
import type { AxiosBaseQueryError } from "../api/axiosBaseQuery";
import { FormError } from "./FormError";
import { AnimatePresence } from "framer-motion";
import { getApiErrorMessage } from "../utils/apiError";

interface Props {
  chat: ChatDto;
  onClose: () => void;
  onOpenSettings: () => void;
}

const roleLabel: Record<number, string> = {
  [UserRole.Owner]: "Owner",
  [UserRole.Admin]: "Admin",
  [UserRole.User]: "Member",
};

export function ChatInfoModal({ chat, onClose, onOpenSettings }: Props) {
  const { userId: currentUserId } = useAuth();
  const [addChatMember] = useAddChatMemberMutation();
  const [removeChatMember] = useRemoveChatMemberMutation();
  const [updateMemberRole] = useUpdateMemberRoleMutation();
  const [transferChatOwnership] = useTransferChatOwnershipMutation();
  const [transferTarget, setTransferTarget] =
    useState<ChatMemberWithRoleDto | null>(null);
  const [search, setSearch] = useState("");
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isGroup = !chat.isPrivate;

  const {
    data: members = [],
    isLoading: loading,
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

  const title = getChatDisplayName(chat);

  return (
    <>
      <Modal
        onClose={onClose}
        closeDisabled={busyUserId !== null}
        ariaLabel="Chat info"
        size="md"
        layout="column"
        layer="base"
        title={
          <div className="relative flex-1">
            <button
              type="button"
              onClick={onOpenSettings}
              className="absolute left-0 top-0 text-content-muted transition hover:text-accent-strong"
              aria-label="Chat settings"
              title="Chat settings"
            >
              <Settings size={20} />
            </button>

            <div className="flex flex-col items-center pl-[38px] text-center">
              {isGroup && (
                <ChatAvatar
                  chatId={chat.id}
                  name={title}
                  avatarUpdatedAt={chat.avatarUpdatedAt}
                  size="xl"
                  className="mb-3"
                />
              )}

              <h2 className="break-words text-2xl font-bold text-content">
                {title}
              </h2>

              {isGroup && chat.description && (
                <p className="mt-1 whitespace-pre-line text-sm text-content-muted">
                  {chat.description}
                </p>
              )}

              <p className="mt-1 text-sm text-content-muted">
                {loading ? "Loading..." : `Members (${members.length})`}
              </p>
            </div>
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

            </div>
          )}
      </Modal>

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

    </>
  );
}
