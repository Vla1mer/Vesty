import { Settings, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { ConfirmDialog } from "./ConfirmDialog";
import { useEffect, useMemo, useState } from "react";
import {
  useGetChatMembersQuery,
  useAddChatMemberMutation,
  useRemoveChatMemberMutation,
} from "../store/chatApi";
import { useGetAllUsersQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { Avatar, ChatAvatar } from "./Avatar";
import { Button } from "./ui/Button";
import { TextInput } from "./ui/TextInput";
import { UserRole } from "../types/api";
import { getChatDisplayName } from "../utils/chats";
import type { ChatDto, UserDto, ChatMemberWithRoleDto } from "../types/api";
import { FormError } from "./FormError";
import { getApiErrorMessage } from "../utils/apiError";

const roleLabel: Record<number, string> = {
  [UserRole.Owner]: "Owner",
  [UserRole.Admin]: "Admin",
  [UserRole.User]: "Member",
};

interface Props {
  chat: ChatDto;
  onOpenSettings: () => void;
  onBusyChange?: (busy: boolean) => void;
}

export function ChatInfoContent({ chat, onOpenSettings, onBusyChange }: Props) {
  const { userId: currentUserId } = useAuth();
  const [addChatMember] = useAddChatMemberMutation();
  const [removeChatMember] = useRemoveChatMemberMutation();
  const [search, setSearch] = useState("");
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [removing, setRemoving] = useState<ChatMemberWithRoleDto | null>(null);
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

  useEffect(() => {
    onBusyChange?.(busyUserId !== null);
  }, [busyUserId, onBusyChange]);

  const myRoleId = useMemo(
    () => members.find((m) => m.userId === currentUserId)?.roleId,
    [members, currentUserId]
  );

  function canRemove(member: ChatMemberWithRoleDto): boolean {
    if (!isGroup || member.userId === currentUserId) return false;
    if (myRoleId === UserRole.Owner) return member.roleId !== UserRole.Owner;
    return myRoleId === UserRole.Admin && member.roleId === UserRole.User;
  }

  async function handleRemove() {
    const member = removing;
    if (!member) return;
    setBusyUserId(member.userId);
    setError(null);
    try {
      await removeChatMember({ chatId: chat.id, userId: member.userId }).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to remove member"));
    } finally {
      setRemoving(null);
      setBusyUserId(null);
    }
  }

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

  const title = getChatDisplayName(chat);

  return (
    <>
      <div className="relative mb-4">
        <button
          type="button"
          onClick={onOpenSettings}
          className="absolute right-0 top-0 text-content-muted transition hover:text-accent-strong"
          aria-label="Chat settings"
          title="Chat settings"
        >
          <Settings size={20} />
        </button>

        <div className="flex w-full min-w-0 flex-col items-center px-[38px] text-center">
          {isGroup && (
            <ChatAvatar
              chatId={chat.id}
              name={title}
              avatarUpdatedAt={chat.avatarUpdatedAt}
              size="xl"
              className="mb-3"
            />
          )}

          <h2 className="w-full min-w-0 break-words text-2xl font-bold text-content">
            {title}
          </h2>

          {isGroup && chat.description && (
            <p className="mt-1 max-h-24 w-full overflow-y-auto whitespace-pre-line break-words text-sm text-content-muted">
              {chat.description}
            </p>
          )}

          <p className="mt-1 text-sm text-content-muted">
            {loading ? "Loading..." : `Members (${members.length})`}
          </p>
        </div>
      </div>

      {(error || membersError) && (
        <FormError
          className="mb-3"
          message={error ?? "Failed to load chat info"}
        />
      )}

      {loading ? (
        <p className="text-content-muted text-center py-8">Loading...</p>
      ) : (
        <div className="space-y-4">
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
                    className="flex items-center justify-between gap-2 rounded px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar
                        userId={m.userId}
                        userName={m.userName}
                        name={m.name}
                        surname={m.surname}
                        avatarUpdatedAt={m.avatarUpdatedAt}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-content">
                          {m.userName}
                          {m.userId === currentUserId && (
                            <span className="ml-2 text-xs text-accent-strong">
                              (you)
                            </span>
                          )}
                        </p>
                        {(m.name || m.surname) && (
                          <p className="truncate text-xs text-content-muted">
                            {[m.name, m.surname].filter(Boolean).join(" ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          m.roleId === UserRole.Owner
                            ? "bg-accent-soft text-accent-strong"
                            : m.roleId === UserRole.Admin
                            ? "bg-info-soft text-info"
                            : "bg-surface-overlay text-content-muted"
                        }`}
                      >
                        {roleLabel[m.roleId]}
                      </span>

                      {canRemove(m) && (
                        <Button
                          size="xs"
                          variant="danger"
                          disabled={busyUserId !== null}
                          onClick={() => setRemoving(m)}
                          aria-label="Remove member"
                          title="Remove from chat"
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
                      <Button
                        size="xs"
                        onClick={() => handleAdd(u)}
                        disabled={busyUserId !== null}
                      >
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

      <AnimatePresence>
        {removing && (
          <ConfirmDialog
            title="Remove from chat?"
            message={`${
              [removing.name, removing.surname].filter(Boolean).join(" ") ||
              removing.userName
            } will lose access to this chat and its history. They can be added back later.`}
            confirmText="Remove"
            variant="danger"
            loading={busyUserId === removing.userId}
            onConfirm={handleRemove}
            onCancel={() => setRemoving(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
