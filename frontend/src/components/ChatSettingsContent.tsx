import { ChevronRight, Crown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useGetChatMembersQuery,
  useUpdateChatPermissionsMutation,
} from "../store/chatApi";
import { useChatDangerActions } from "../hooks/useChatDangerActions";
import { useChatProfileDraft } from "../hooks/useChatProfileDraft";
import { ChatDangerZone } from "./ChatDangerZone";
import { ChatAvatarEditor } from "./ChatAvatarEditor";
import { TextInput } from "./ui/TextInput";
import {
  CHAT_DESCRIPTION_LIMIT,
  CHAT_NAME_LIMIT,
} from "../validation/chatSchemas";
import { useAuth } from "../context/useAuth";
import { getApiErrorMessage } from "../utils/apiError";
import { getChatDisplayName } from "../utils/chats";
import { ChatPermission, permissionAllows, UserRole } from "../types/api";
import type { ChatDto, ChatPermissionsDto } from "../types/api";
import { Button } from "./ui/Button";
import { ChatInviteSection } from "./ChatInviteSection";
import { ChatAdminsSection } from "./ChatAdminsSection";
import { FormError } from "./FormError";

export type ChatSettingsView = "settings" | "admins";

const permissionFields = [
  { key: "whoCanInvite", label: "Who can add members" },
  { key: "whoCanEdit", label: "Who can edit name and photo" },
  { key: "whoCanPost", label: "Who can send and edit messages" },
] as const;

function CharCounter({ value, max }: { value: string; max: number }) {
  const left = max - value.length;

  return (
    <p
      aria-live="polite"
      className={`text-right text-xs tabular-nums ${
        left === 0 ? "text-danger" : "text-content-subtle"
      }`}
    >
      {value.length} / {max}
    </p>
  );
}

interface Props {
  chat: ChatDto;
  view: ChatSettingsView;
  onViewChange: (view: ChatSettingsView) => void;
  onDeleted: () => void;
  onBusyChange?: (busy: boolean) => void;
}

export function ChatSettingsContent({
  chat,
  view,
  onViewChange,
  onDeleted,
  onBusyChange,
}: Props) {
  const { userId: currentUserId } = useAuth();
  const [updateChatPermissions] = useUpdateChatPermissionsMutation();

  const [saved, setSaved] = useState<
    ({ chatId: number } & ChatPermissionsDto) | null
  >(null);
  const [savingPermission, setSavingPermission] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const profile = useChatProfileDraft(chat, setError);
  const danger = useChatDangerActions({
    chatId: chat.id,
    currentUserId,
    onError: setError,
    onDone: onDeleted,
  });

  const { data: members = [], isLoading: loading } = useGetChatMembersQuery(chat.id);

  const isGroup = !chat.isPrivate;
  const myRoleId = useMemo(
    () => members.find((m) => m.userId === currentUserId)?.roleId,
    [members, currentUserId]
  );
  const isOwner = myRoleId === UserRole.Owner;
  const canInvite =
    isGroup && myRoleId !== undefined && permissionAllows(chat.whoCanInvite, myRoleId);
  const canDelete = chat.isPrivate || isOwner;
  const canEditProfile =
    isGroup && myRoleId !== undefined && permissionAllows(chat.whoCanEdit, myRoleId);

  const adminCount = members.filter((m) => m.roleId === UserRole.Admin).length;

  const busy =
    savingPermission !== null || profile.saving || danger.busy;

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  useEffect(() => {
    setError(null);
  }, [view]);

  useEffect(() => {
    setSaved(null);
  }, [chat.whoCanInvite, chat.whoCanEdit, chat.whoCanPost]);

  const permissions =
    saved?.chatId === chat.id
      ? saved
      : {
          chatId: chat.id,
          whoCanInvite: chat.whoCanInvite,
          whoCanEdit: chat.whoCanEdit,
          whoCanPost: chat.whoCanPost,
        };

  async function handlePermissionChange(
    key: (typeof permissionFields)[number]["key"],
    value: number
  ) {
    const next = { ...permissions, [key]: value };
    setSavingPermission(key);
    setError(null);
    try {
      await updateChatPermissions(next).unwrap();
      setSaved(next);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update permissions"));
    } finally {
      setSavingPermission(null);
    }
  }

  return (
    <>
      {view === "admins" ? (
        <ChatAdminsSection chatId={chat.id} members={members} />
      ) : (
        <div className="space-y-4">
          <FormError message={error} />

          {loading && (
            <p className="py-6 text-center text-sm text-content-subtle">
              Loading settings...
            </p>
          )}

          {!loading && canEditProfile && (
            <section className="space-y-3">
              <ChatAvatarEditor
                chatId={chat.id}
                name={getChatDisplayName(chat)}
                avatarUpdatedAt={chat.avatarUpdatedAt}
              />
              <div className="space-y-1">
                <TextInput
                  type="text"
                  value={profile.name}
                  onChange={(e) => profile.setName(e.target.value)}
                  maxLength={CHAT_NAME_LIMIT}
                  placeholder="Chat name"
                  className="font-semibold"
                />
                <CharCounter value={profile.name} max={CHAT_NAME_LIMIT} />
              </div>

              <div className="space-y-1">
                <textarea
                  value={profile.description}
                  onChange={(e) => profile.setDescription(e.target.value)}
                  maxLength={CHAT_DESCRIPTION_LIMIT}
                  rows={3}
                  placeholder="Description (optional)"
                  className="w-full resize-none rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content placeholder:text-content-subtle focus:border-accent focus:outline-none"
                />
                <CharCounter value={profile.description} max={CHAT_DESCRIPTION_LIMIT} />
              </div>
              <Button
                size="xs"
                onClick={profile.save}
                disabled={busy || !profile.changed || !profile.name.trim()}
              >
                {profile.saving ? "..." : "Save"}
              </Button>
            </section>
          )}

          {!loading && isOwner && isGroup && (
            <section className="space-y-2 border-t border-line pt-3">
              <h3 className="text-sm font-semibold text-content-muted">
                Permissions
              </h3>
              {permissionFields.map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-content">{label}</span>
                  <select
                    value={permissions[key]}
                    onChange={(e) =>
                      handlePermissionChange(key, Number(e.target.value))
                    }
                    disabled={busy}
                    className="rounded-lg border border-line bg-surface-sunken px-2 py-1 text-sm text-content focus:border-accent focus:outline-none disabled:opacity-60"
                  >
                    <option value={ChatPermission.Owner}>Owner only</option>
                    <option value={ChatPermission.Admins}>Admins</option>
                    <option value={ChatPermission.Members}>All members</option>
                  </select>
                </label>
              ))}
            </section>
          )}

          {!loading && isOwner && isGroup && (
            <button
              type="button"
              onClick={() => onViewChange("admins")}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm text-content transition-colors hover:bg-surface-muted"
            >
              <span className="flex items-center gap-2">
                <Crown size={15} aria-hidden="true" />
                Administrators
              </span>
              <span className="flex items-center gap-1 text-content-muted">
                {adminCount}
                <ChevronRight size={15} aria-hidden="true" />
              </span>
            </button>
          )}

          {!loading && canInvite && <ChatInviteSection chatId={chat.id} />}

          <ChatDangerZone
            chat={chat}
            isOwner={isOwner}
            canDelete={canDelete}
            memberCount={members.length}
            loading={loading}
            busy={busy}
            actions={danger}
          />
        </div>
      )}
    </>
  );
}
