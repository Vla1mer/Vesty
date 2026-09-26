import { ChatPermission } from "../types/api";
import { useLanguage } from "../context/useLanguage";
import { SectionHeading } from "./ui/SectionHeading";
import type { TranslationKey } from "../i18n/translations";
import type { ChatPermissionsDto } from "../types/api";

type PermissionKey = keyof ChatPermissionsDto;

const fields: { key: PermissionKey; label: TranslationKey }[] = [
  { key: "whoCanInvite", label: "chatSettings.whoCanInvite" },
  { key: "whoCanEdit", label: "chatSettings.whoCanEdit" },
  { key: "whoCanPost", label: "chatSettings.whoCanPost" },
];

interface Props {
  levels: ChatPermissionsDto;
  disabled: boolean;
  onChange: (key: PermissionKey, value: number) => void;
}

export function ChatPermissionsSection({ levels, disabled, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <section className="space-y-2 pt-3">
      <SectionHeading>{t("chatSettings.permissions")}</SectionHeading>
      {fields.map(({ key, label }) => (
        <label key={key} className="flex items-center justify-between gap-3">
          <span className="text-sm text-content">{t(label)}</span>
          <select
            value={levels[key]}
            onChange={(e) => onChange(key, Number(e.target.value))}
            disabled={disabled}
            className="rounded-lg border border-line bg-surface-sunken px-2 py-1 text-sm text-content focus:border-accent focus:outline-none disabled:opacity-60"
          >
            <option value={ChatPermission.Owner}>{t("chatSettings.ownerOnly")}</option>
            <option value={ChatPermission.Admins}>{t("chatSettings.admins")}</option>
            <option value={ChatPermission.Members}>{t("chatSettings.allMembers")}</option>
          </select>
        </label>
      ))}
    </section>
  );
}
