import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, Crown, Eraser, LogOut, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useClearChatForMeMutation,
  useDeleteChatMutation,
  useGetChatMembersQuery,
  useRemoveChatMemberMutation,
  useRenameChatMutation,
  useUpdateChatPermissionsMutation,
} from "../store/chatApi";
import { ChatAvatarEditor } from "./ChatAvatarEditor";
import { TextInput } from "./ui/TextInput";
import { chatNameSchema } from "../validation/chatSchemas";
import { ValidationError } from "yup";
import { useAuth } from "../context/useAuth";
import { getApiErrorMessage } from "../utils/apiError";
import { getChatDisplayName } from "../utils/chats";
import { ChatPermission, permissionAllows, UserRole } from "../types/api";
import type { ChatDto, ChatPermissionsDto } from "../types/api";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { ChatInviteSection } from "./ChatInviteSection";
import { ChatAdminsSection } from "./ChatAdminsSection";
import { FormError } from "./FormError";

const permissionFields = [
  { key: "whoCanInvite", label: "Who can add members" },
  { key: "whoCanEdit", label: "Who can edit name and photo" },
  { key: "whoCanPost", label: "Who can send messages" },
] as const;

interface Props {
  chat: ChatDto;
  onBack: () => void;
  onClose: () => void;
  onDeleted: () => void;
}

export function ChatSettingsModal({ chat, onBack, onClose, onDeleted }: Props) {
  const { userId: currentUserId } = useAuth();
  const [updateChatPermissions] = useUpdateChatPermissionsMutation();
  const [removeChatMember] = useRemoveChatMemberMutation();
  const [deleteChat] = useDeleteChatMutation();
  const [clearChatForMe, { isLoading: clearing }] = useClearChatForMeMutation();
  const [renameChat] = useRenameChatMutation();

  const [nameDraft, setNameDraft] = useState(chat.name ?? "");
  const [descriptionDraft, setDescriptionDraft] = useState(chat.description ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [view, setView] = useState<"settings" | "admins">("settings");

  const [saved, setSaved] = useState<
    ({ chatId: number } & ChatPermissionsDto) | null
  >(null);
  const [savingPermission, setSavingPermission] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
  const profileChanged =
    nameDraft.trim() !== (chat.name ?? "") ||
    descriptionDraft.trim() !== (chat.description ?? "");

  const adminCount = members.filter(
    (m) => m.roleId === UserRole.Owner || m.roleId === UserRole.Admin
  ).length;

  const permissions =
    saved?.chatId === chat.id
      ? saved
      : {
          chatId: chat.id,
          whoCanInvite: chat.whoCanInvite,
          whoCanEdit: chat.whoCanEdit,
          whoCanPost: chat.whoCanPost,
        };

  async function handleSaveProfile() {
    if (savingProfile) return;
    const newName = nameDraft.trim();

    try {
      await chatNameSchema.validate({ name: newName });
    } catch (validationErr) {
      setError((validationErr as ValidationError).message);
      return;
    }

    setSavingProfile(true);
    setError(null);
    try {
      await renameChat({
        chatId: chat.id,
        name: newName,
        description: descriptionDraft.trim() || null,
      }).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save the chat profile"));
    } finally {
      setSavingProfile(false);
    }
  }

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
      onDeleted();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete the chat"));
      setIsClearOpen(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteChat(chat.id).unwrap();
      setIsDeleteOpen(false);
      onDeleted();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete the chat"));
      setIsDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  const busy =
    savingPermission !== null || leaving || deleting || clearing || savingProfile;

  return (
    <>
      <Modal
        onClose={onClose}
        size="md"
        layout="column"
        layer="base"
        closeDisabled={busy}
        title={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={view === "admins" ? () => setView("settings") : onBack}
              disabled={busy}
              className="text-content-muted transition hover:text-accent-strong disabled:opacity-50"
              aria-label="Back to chat info"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-xl font-bold text-content">
              {view === "admins" ? "Administrators" : "Settings"}
            </h2>
          </div>
        }
      >
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
              <TextInput
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={200}
                placeholder="Chat name"
                className="font-semibold"
              />
              <textarea
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Description (optional)"
                className="w-full resize-none rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content placeholder:text-content-subtle focus:border-accent focus:outline-none"
              />
              <Button
                size="xs"
                onClick={handleSaveProfile}
                disabled={busy || !profileChanged || !nameDraft.trim()}
              >
                {savingProfile ? "..." : "Save"}
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
              onClick={() => setView("admins")}
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

          {!loading && chat.isPrivate && (
            <section className="space-y-2 border-t border-line pt-3">
              <Button
                variant="neutral"
                fullWidth
                onClick={() => setIsClearOpen(true)}
                disabled={busy}
              >
                <Eraser size={15} aria-hidden="true" />
                Delete for me
              </Button>
            </section>
          )}

          {isGroup && !loading && !(isOwner && members.length === 1) && (
            <section className="space-y-2 border-t border-line pt-3">
              {isOwner ? (
                <p className="text-xs text-content-subtle">
                  To leave this chat, hand ownership to another member first.
                </p>
              ) : (
                <Button
                  variant="neutral"
                  fullWidth
                  onClick={() => setIsLeaveOpen(true)}
                  disabled={busy}
                >
                  <LogOut size={15} aria-hidden="true" />
                  Leave chat
                </Button>
              )}
            </section>
          )}

          {!loading && canDelete && (
            <section className="border-t border-line pt-3">
              <Button
                variant="danger"
                fullWidth
                onClick={() => setIsDeleteOpen(true)}
                disabled={busy}
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
            message={`Are you sure you want to delete "${getChatDisplayName(
              chat
            )}"? All messages will be permanently lost.`}
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
