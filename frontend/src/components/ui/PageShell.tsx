import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { BottomNav } from "../BottomNav";

interface Props {
  title: string;
  onBack?: () => void;
  backDisabled?: boolean;
  showNav?: boolean;
  children: ReactNode;
}

export function PageShell({
  title,
  onBack,
  backDisabled = false,
  showNav = false,
  children,
}: Props) {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={backDisabled}
            aria-label="Back"
            className="text-content-muted transition hover:text-content disabled:opacity-50"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-content">
          {title}
        </h1>
      </header>

      <div className={`flex-1 overflow-y-auto p-4 ${showNav ? "pb-24" : ""}`}>
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </div>

      {showNav && <BottomNav />}
    </div>
  );
}
