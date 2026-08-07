import { Globe, Lock, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useGetPrivacySettingsQuery,
  useUpdatePrivacySettingsMutation,
} from "../store/userApi";
import { FormError } from "./FormError";
import { Skeleton } from "./ui/Skeleton";
import { PRIVACY_LEVEL } from "../types/api";
import type { PrivacySettingsDto } from "../types/api";

const OPTIONS: Array<{ value: number; label: string; Icon: LucideIcon }> = [
  { value: PRIVACY_LEVEL.EVERYONE, label: "Everyone", Icon: Globe },
  { value: PRIVACY_LEVEL.FRIENDS_ONLY, label: "Friends only", Icon: Users },
  { value: PRIVACY_LEVEL.NOBODY, label: "Nobody", Icon: Lock },
];

interface ChoiceProps {
  title: string;
  description: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

function Choice({ title, description, value, disabled, onChange }: ChoiceProps) {
  return (
    <div>
      <p className="text-sm font-medium text-content">{title}</p>
      <p className="mb-2 text-xs text-content-subtle">{description}</p>

      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map(({ value: option, label, Icon }) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(option)}
              className={`flex items-center gap-2 rounded-card border p-3 text-left text-sm transition disabled:opacity-50 ${
                selected
                  ? "border-accent-strong bg-accent-soft text-content"
                  : "border-line bg-surface-muted text-content-muted hover:border-line-strong"
              }`}
            >
              <Icon size={16} aria-hidden="true" className="shrink-0" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PrivacySettings() {
  const { data: settings, isLoading, isError } = useGetPrivacySettingsQuery();
  const [updateSettings, { isLoading: saving, isError: saveFailed }] =
    useUpdatePrivacySettingsMutation();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  if (isError || !settings) {
    return <FormError message="Failed to load privacy settings" />;
  }

  function save(patch: Partial<PrivacySettingsDto>) {
    if (!settings) return;
    updateSettings({ ...settings, ...patch });
  }

  return (
    <section className="space-y-6">
      <h3 className="text-sm font-semibold text-content">Privacy</h3>

      <Choice
        title="Who can message me"
        description="Applies to new conversations. Existing chats stay open."
        value={settings.whoCanMessage}
        disabled={saving}
        onChange={(whoCanMessage) => save({ whoCanMessage })}
      />

      <Choice
        title="Who can add me to groups"
        description="Controls who may invite you into group chats."
        value={settings.whoCanInvite}
        disabled={saving}
        onChange={(whoCanInvite) => save({ whoCanInvite })}
      />

      <Choice
        title="Who can see my profile"
        description="Hidden profiles still show the username, but not the name."
        value={settings.whoCanSeeProfile}
        disabled={saving}
        onChange={(whoCanSeeProfile) => save({ whoCanSeeProfile })}
      />

      <Choice
        title="Who can see when I am online"
        description="Also hides when you were last seen."
        value={settings.whoCanSeeOnline}
        disabled={saving}
        onChange={(whoCanSeeOnline) => save({ whoCanSeeOnline })}
      />

      {saveFailed && <FormError message="Could not save privacy settings" />}
    </section>
  );
}
