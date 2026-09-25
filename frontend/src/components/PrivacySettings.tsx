import { Globe, Lock, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useGetPrivacySettingsQuery,
  useUpdatePrivacySettingsMutation,
} from "../store/userApi";
import { FormError } from "./FormError";
import { Skeleton } from "./ui/Skeleton";
import { PRIVACY_LEVEL } from "../types/api";
import { useLanguage } from "../context/useLanguage";
import { SectionHeading } from "./ui/SectionHeading";
import type { TranslationKey } from "../i18n/translations";
import type { PrivacySettingsDto } from "../types/api";

const OPTIONS: Array<{ value: number; label: TranslationKey; Icon: LucideIcon }> = [
  { value: PRIVACY_LEVEL.EVERYONE, label: "privacy.everyone", Icon: Globe },
  { value: PRIVACY_LEVEL.FRIENDS_ONLY, label: "privacy.friendsOnly", Icon: Users },
  { value: PRIVACY_LEVEL.NOBODY, label: "privacy.nobody", Icon: Lock },
];

interface ChoiceProps {
  title: TranslationKey;
  description: TranslationKey;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

function Choice({ title, description, value, disabled, onChange }: ChoiceProps) {
  const { t } = useLanguage();

  return (
    <div>
      <p className="text-sm font-medium text-content">{t(title)}</p>
      <p className="mb-2 text-xs text-content-subtle">{t(description)}</p>

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
              {t(label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PrivacySettings() {
  const { t } = useLanguage();
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
    return <FormError message={t("privacy.loadFailed")} />;
  }

  function save(patch: Partial<PrivacySettingsDto>) {
    if (!settings) return;
    updateSettings({ ...settings, ...patch });
  }

  return (
    <section className="space-y-6">
      <SectionHeading>{t("privacy.title")}</SectionHeading>

      <Choice
        title="privacy.message"
        description="privacy.messageHint"
        value={settings.whoCanMessage}
        disabled={saving}
        onChange={(whoCanMessage) => save({ whoCanMessage })}
      />

      <Choice
        title="privacy.invite"
        description="privacy.inviteHint"
        value={settings.whoCanInvite}
        disabled={saving}
        onChange={(whoCanInvite) => save({ whoCanInvite })}
      />

      <Choice
        title="privacy.profile"
        description="privacy.profileHint"
        value={settings.whoCanSeeProfile}
        disabled={saving}
        onChange={(whoCanSeeProfile) => save({ whoCanSeeProfile })}
      />

      <Choice
        title="privacy.online"
        description="privacy.onlineHint"
        value={settings.whoCanSeeOnline}
        disabled={saving}
        onChange={(whoCanSeeOnline) => save({ whoCanSeeOnline })}
      />

      {saveFailed && <FormError message={t("privacy.saveFailed")} />}
    </section>
  );
}
