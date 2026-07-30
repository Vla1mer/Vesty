import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  Icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ Icon, title, description, action, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-content-subtle">
        <Icon size={28} aria-hidden="true" />
      </span>
      <p className="text-base font-medium text-content">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-content-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
