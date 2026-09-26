import { AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/useLanguage";
import { Crown, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useTransferChatOwnershipMutation,
  useUpdateMemberRoleMutation,
} from "../store/chatMembersApi";
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
  const { t } = useLanguage();
  const [updateMemberRole] = useUpdateMemberRoleMutation();
  const [transferChatOwnership] = useTransferChatOwnershipMutation();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [promoting, setPromoting] = useState<ChatMemberWithRoleDto | null>(null);
  const [handingOver, setHandingOver] = useState<ChatMemberWithRoleDto | null>(
    null
  );
  const [demoting, setDemoting] = useState<ChatMemberWithRoleDto | null>(null);

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
      t("admins.grantFailed")
    );
  }

  async function confirmDemote() {
    if (!demoting) return;
    const target = demoting;
    setDemoting(null);
    await run(
      () =>
        updateMemberRole({
          chatId,
          userId: target.userId,
          roleId: UserRole.User,
        }).unwrap(),
      t("admins.revokeFailed")
    );
  }

  async function confirmHandOver() {
    if (!handingOver) return;
    const target = handingOver;
    setHandingOver(null);
    await run(
      () => transferChatOwnership({ chatId, userId: target.userId }).unwrap(),
      t("admins.transferFailed")
    );
  }

  return (
    <div className="space-y-3">
      <FormError message={error} />

      <ul>
        {owner && <Row member={owner} label={t("admins.owner")} />}

        {admins.map((admin) => (
          <Row
            key={admin.userId}
            member={admin}
            label={t("admins.admin")}
            action={
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="xs"
                  variant="neutral"
                  disabled={busy}
                  onClick={() => setHandingOver(admin)}
                  aria-label={t("admins.makeOwner")}
                  title={t("admins.makeOwner")}
                >
                  <Crown size={12} />
                </Button>
                <Button
                  size="xs"
                  variant="danger"
                  disabled={busy}
                  onClick={() => setDemoting(admin)}
                  aria-label={t("admins.removeAdmin")}
                  title={t("admins.removeAdmin")}
                >
                  <X size={12} />
                </Button>
              </div>
            }
          />
        ))}
      </ul>

      {admins.length === 0 ? (
        <p className="px-3 text-sm text-content-subtle">
          {t("admins.empty")}
        </p>
      ) : (
        <p className="px-3 text-xs text-content-subtle">
          {t("admins.ownerHint")}
        </p>
      )}

      {isPicking ? (
        <section className="space-y-1 border-t border-line pt-3">
          <h4 className="px-3 text-sm font-semibold text-content-muted">
            {t("admins.choose")}
          </h4>
          {plainMembers.length === 0 ? (
            <p className="px-3 py-2 text-sm text-content-subtle">
              {t("admins.allAdmins")}
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
              {t("common.cancel")}
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
          {t("admins.add")}
        </Button>
      )}

      <AnimatePresence>
        {promoting && (
          <ConfirmDialog
            title={t("admins.grantTitle")}
            message={t("admins.grantWarning", { name: displayName(promoting) })}
            confirmText={t("admins.grantConfirm")}
            variant="primary"
            loading={busy}
            onConfirm={confirmPromote}
            onCancel={() => setPromoting(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {demoting && (
          <ConfirmDialog
            title={t("admins.revokeTitle")}
            message={t("admins.revokeWarning", { name: displayName(demoting) })}
            confirmText={t("admins.revokeConfirm")}
            variant="danger"
            loading={busy}
            onConfirm={confirmDemote}
            onCancel={() => setDemoting(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {handingOver && (
          <ConfirmDialog
            title={t("admins.transferTitle")}
            message={t("admins.transferWarning", { name: displayName(handingOver) })}
            confirmText={t("admins.makeOwner")}
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
