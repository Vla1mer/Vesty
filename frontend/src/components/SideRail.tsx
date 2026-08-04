import type { ReactNode } from "react";
import { LogOut, Settings, Users } from "lucide-react";
import { useRailLabels } from "../hooks/useRailLabels";

interface RailButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
  danger?: boolean;
}

function RailButton({ icon, label, onClick, badge = 0, danger = false }: RailButtonProps) {
  const showLabels = useRailLabels();

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex w-full flex-col items-center gap-1 rounded-card px-1 py-2 transition-colors hover:bg-surface-muted ${
        danger ? "text-danger" : "text-content-muted hover:text-content"
      }`}
    >
      <span className="relative flex items-center justify-center">
        {icon}
        {badge > 0 && (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-contrast">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      {showLabels && <span className="text-[11px] leading-none">{label}</span>}
    </button>
  );
}

interface Props {
  avatar: ReactNode;
  incomingRequests: number;
  onProfile: () => void;
  onFriends: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export function SideRail({
  avatar,
  incomingRequests,
  onProfile,
  onFriends,
  onSettings,
  onLogout,
}: Props) {
  const showLabels = useRailLabels();

  return (
    <nav
      className={`hidden shrink-0 flex-col items-center gap-1 border-r border-line bg-surface px-1.5 py-3 md:flex ${
        showLabels ? "w-[72px]" : "w-16"
      }`}
    >
      <RailButton icon={avatar} label="Profile" onClick={onProfile} />
      <RailButton
        icon={<Users size={22} aria-hidden="true" />}
        label="Friends"
        onClick={onFriends}
        badge={incomingRequests}
      />
      <RailButton
        icon={<Settings size={22} aria-hidden="true" />}
        label="Settings"
        onClick={onSettings}
      />

      <div className="flex-1" />

      <RailButton
        icon={<LogOut size={22} aria-hidden="true" />}
        label="Logout"
        onClick={onLogout}
        danger
      />
    </nav>
  );
}
