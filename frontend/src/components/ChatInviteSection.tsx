import { Check, Copy, Link2, RefreshCw, Trash2 } from "lucide-react";
import { useLanguage } from "../context/useLanguage";
import { useState } from "react";
import {
  useCreateChatInviteMutation,
  useGetChatInviteQuery,
  useRevokeChatInviteMutation,
} from "../store/chatInvitesApi";
import { getApiErrorMessage } from "../utils/apiError";
import { useDates } from "../hooks/useDates";
import { Button } from "./ui/Button";
import { FormError } from "./FormError";

interface Props {
  chatId: number;
}

const lifetimes = [
  { label: "invite.never", days: null },
  { label: "invite.day", days: 1 },
  { label: "invite.week", days: 7 },
] as const;

export function ChatInviteSection({ chatId }: Props) {
  const { t } = useLanguage();
  const dates = useDates();
  const { data: invite, isLoading } = useGetChatInviteQuery(chatId);
  const [createInvite, { isLoading: creating }] = useCreateChatInviteMutation();
  const [revokeInvite, { isLoading: revoking }] = useRevokeChatInviteMutation();

  const [days, setDays] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const link = invite ? `${window.location.origin}/join/${invite.code}` : null;
  const busy = creating || revoking;

  async function handleCreate() {
    setError(null);
    try {
      await createInvite({ chatId, expiresInDays: days }).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, t("invite.createFailed")));
    }
  }

  async function handleRevoke() {
    setError(null);
    try {
      await revokeInvite(chatId).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, t("invite.revokeFailed")));
    }
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("invite.copyFailed"));
    }
  }

  return (
    <section className="space-y-2 border-t border-line pt-3">
      <h3 className="text-sm font-semibold text-content-muted">Invite link</h3>

      <FormError message={error} />

      {isLoading ? (
        <p className="text-sm text-content-subtle">Loading...</p>
      ) : link ? (
        <>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content"
            />
            <Button size="xs" variant="neutral" onClick={handleCopy} title={t("invite.copy")}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>

          {invite?.expiresAt && (
            <p className="text-xs text-content-subtle">
              {t("invite.expires", { when: dates.dateTime(invite.expiresAt) })}
            </p>
          )}

          <div className="flex gap-2">
            <Button size="xs" variant="neutral" onClick={handleCreate} disabled={busy}>
              <RefreshCw size={13} aria-hidden="true" /> {t("invite.replace")}
            </Button>
            <Button size="xs" variant="danger" onClick={handleRevoke} disabled={busy}>
              <Trash2 size={13} aria-hidden="true" /> {t("invite.revoke")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-content-subtle">
            {t("invite.hint")}
          </p>
          <div className="flex items-center gap-2">
            <select
              value={days ?? ""}
              onChange={(e) =>
                setDays(e.target.value === "" ? null : Number(e.target.value))
              }
              className="rounded-lg border border-line bg-surface-sunken px-2 py-1 text-sm text-content focus:border-accent focus:outline-none"
            >
              {lifetimes.map(({ label, days: value }) => (
                <option key={label} value={value ?? ""}>
                  {t(label)}
                </option>
              ))}
            </select>
            <Button size="xs" onClick={handleCreate} disabled={busy}>
              <Link2 size={13} aria-hidden="true" />
              {creating ? "..." : t("invite.create")}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
