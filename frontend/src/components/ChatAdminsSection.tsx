import { AnimatePresence } from "framer-motion";
import { Crown, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useTransferChatOwnershipMutation,
  useUpdateMemberRoleMutation,
} from "../store/chatApi";
import { getApiErrorMessage } from "../utils/apiError";
import { UserRole } from "../types/api";
import type { ChatMemberWithRoleDto } from "../types/api";
import { Avatar } from "./Avatar";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormError } from "./FormError";

interface Props {
  chatId: number;
  members: ChatMemberWithRoleDto[];
}

function displayName(member: ChatMemberWithRoleDto): string {
  return (
    [member.name, member.surname].filter(Boolean).join(" ") || member.userName
  );
}

function Row({
  member,
  label,
  action,
}: {
  member: ChatMemberWithRoleDto;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5 rounded px-3 py-2">
      <Avatar
        userId={member.userId}
        userName={member.userName}
        name={member.name}
        surname={member.surname}
        avatarUpdatedAt={member.avatarUpdatedAt}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-content">{displayName(member)}</p>
        <p className="truncate text-xs text-content-muted">@{member.userName}</p>
      </div>
      <span className="shrink-0 text-xs text-content-muted">{label}</span>
      {action}
    </li>
  );
}

export function ChatAdminsSection({ chatId, members }: Props) {
  const [updateMemberRole] = useUpdateMemberRoleMutation();
  const [transferChatOwnership] = useTransferChatOwnershipMutation();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [promoting, setPromoting] = useState<ChatMemberWithRoleDto | null>(null);
  const [handingOver, setHandingOver] = useState<ChatMemberWithRoleDto | null>(
    null
  );

  const owner = useMemo(
    () => members.find((m) => m.roleId === UserRole.Owner),
    [members]
  );
  const admins = useMemo(
    () => members.filter((m) => m.roleId === UserRole.Admin),
    [members]
  );
  const plainMembers = useMemo(
    () => members.filter((m) => m.roleId === UserRole.User),
    [members]
  );

  async function run(action: () => Promise<unknown>, fallback: string) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(getApiErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  }

  async function confirmPromote() {
    if (!promoting) return;
    const target = promoting;
    setPromoting(null);
    setIsPicking(false);
    await run(
      () =>
        updateMemberRole({
          chatId,
          userId: target.userId,
          roleId: UserRole.Admin,
        }).unwrap(),
      "Failed to grant admin rights"
    );
  }

  async function confirmHandOver() {
    if (!handingOver) return;
    const target = handingOver;
    setHandingOver(null);
    await run(
      () => transferChatOwnership({ chatId, userId: target.userId }).unwrap(),
      "Failed to transfer ownership"
    );
  }

  return (
    <div className="space-y-3">
      <FormError message={error} />

      <ul>
        {owner && <Row member={owner} label="Owner" />}

        {admins.map((admin) => (
          <Row
            key={admin.userId}
            member={admin}
            label="Admin"
            action={
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="xs"
                  variant="neutral"
                  disabled={busy}
                  onClick={() => setHandingOver(admin)}
                  aria-label="Make owner"
                  title="Make owner"
                >
                  <Crown size={12} />
                </Button>
                <Button
                  size="xs"
                  variant="danger"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () =>
                        updateMemberRole({
                          chatId,
                          userId: admin.userId,
                          roleId: UserRole.User,
                        }).unwrap(),
                      "Failed to remove admin rights"
                    )
                  }
                  aria-label="Remove admin"
                  title="Remove admin"
                >
                  <X size={12} />
                </Button>
              </div>
            }
          />
        ))}
      </ul>

      {admins.length === 0 && (
        <p className="px-3 text-sm text-content-subtle">
          No administrators yet.
        </p>
      )}

      {isPicking ? (
        <section className="space-y-1 border-t border-line pt-3">
          <h4 className="px-3 text-sm font-semibold text-content-muted">
            Choose a member
          </h4>
          {plainMembers.length === 0 ? (
            <p className="px-3 py-2 text-sm text-content-subtle">
              Everyone here is already an administrator.
            </p>
          ) : (
            <ul>
              {plainMembers.map((member) => (
                <li key={member.userId}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPromoting(member)}
                    className="flex w-full items-center gap-2.5 rounded px-3 py-2 text-left transition-colors hover:bg-surface-muted disabled:opacity-60"
                  >
                    <Avatar
                      userId={member.userId}
                      userName={member.userName}
                      name={member.name}
                      surname={member.surname}
                      avatarUpdatedAt={member.avatarUpdatedAt}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-content">
                        {displayName(member)}
                      </p>
                      <p className="truncate text-xs text-content-muted">
                        @{member.userName}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="px-3 pt-1">
            <Button
              size="xs"
              variant="neutral"
              onClick={() => setIsPicking(false)}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        </section>
      ) : (
        <Button
          variant="neutral"
          fullWidth
          disabled={busy}
          onClick={() => setIsPicking(true)}
        >
          <Plus size={15} aria-hidden="true" />
          Add administrator
        </Button>
      )}

      <AnimatePresence>
        {promoting && (
          <ConfirmDialog
            title="Grant admin rights?"
            message={`${displayName(
              promoting
            )} will be able to add and remove members, and edit the chat name and photo.`}
            confirmText="Make admin"
            variant="primary"
            loading={busy}
            onConfirm={confirmPromote}
            onCancel={() => setPromoting(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {handingOver && (
          <ConfirmDialog
            title="Make owner?"
            message={`${displayName(
              handingOver
            )} will own this chat and you become an admin. Only they will be able to hand it back.`}
            confirmText="Make owner"
            variant="primary"
            loading={busy}
            onConfirm={confirmHandOver}
            onCancel={() => setHandingOver(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
