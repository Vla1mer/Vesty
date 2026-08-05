import { ChatPermission } from "../types/api";
import type { ChatPermissionsDto } from "../types/api";

type PermissionKey = keyof ChatPermissionsDto;

const fields: { key: PermissionKey; label: string }[] = [
  { key: "whoCanInvite", label: "Who can add members" },
  { key: "whoCanEdit", label: "Who can edit name and photo" },
  { key: "whoCanPost", label: "Who can send and edit messages" },
];

interface Props {
  levels: ChatPermissionsDto;
  disabled: boolean;
  onChange: (key: PermissionKey, value: number) => void;
}

export function ChatPermissionsSection({ levels, disabled, onChange }: Props) {
  return (
    <section className="space-y-2 border-t border-line pt-3">
      <h3 className="text-sm font-semibold text-content-muted">Permissions</h3>
      {fields.map(({ key, label }) => (
        <label key={key} className="flex items-center justify-between gap-3">
          <span className="text-sm text-content">{label}</span>
          <select
            value={levels[key]}
            onChange={(e) => onChange(key, Number(e.target.value))}
            disabled={disabled}
            className="rounded-lg border border-line bg-surface-sunken px-2 py-1 text-sm text-content focus:border-accent focus:outline-none disabled:opacity-60"
          >
            <option value={ChatPermission.Owner}>Owner only</option>
            <option value={ChatPermission.Admins}>Admins</option>
            <option value={ChatPermission.Members}>All members</option>
          </select>
        </label>
      ))}
    </section>
  );
}
