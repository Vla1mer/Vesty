import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useLanguage } from "../context/useLanguage";
import type { useMessageSearch } from "../hooks/useMessageSearch";

interface Props {
  search: ReturnType<typeof useMessageSearch>;
}

export function ChatSearchBar({ search }: Props) {
  const { t } = useLanguage();
  const hasQuery = search.query.trim().length > 0;

  return (
    <div className="absolute top-[88px] inset-x-0 z-10 flex items-center gap-2 px-4 py-2 border-b border-line bg-surface-muted/95 backdrop-blur">
      <Search size={16} aria-hidden="true" className="shrink-0 text-content-muted" />
      <input
        type="search"
        value={search.query}
        autoFocus
        onChange={(e) => search.search(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") search.close();
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) search.newer();
            else search.older();
          }
        }}
        placeholder={t("chat.searchPlaceholder")}
        aria-label={t("chat.search")}
        className="min-w-0 flex-1 bg-transparent text-sm text-content placeholder:text-content-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {hasQuery && (
        <span className="shrink-0 text-xs text-content-muted" aria-live="polite">
          {search.total > 0
            ? t("chat.searchCount", { position: search.position, total: search.total })
            : t("chat.searchNone")}
        </span>
      )}
      <button
        type="button"
        onClick={search.older}
        disabled={search.position >= search.total}
        aria-label={t("chat.searchOlder")}
        title={t("chat.searchOlder")}
        className="shrink-0 rounded p-1 text-content-muted hover:text-content disabled:opacity-40"
      >
        <ChevronUp size={18} />
      </button>
      <button
        type="button"
        onClick={search.newer}
        disabled={search.position <= 1}
        aria-label={t("chat.searchNewer")}
        title={t("chat.searchNewer")}
        className="shrink-0 rounded p-1 text-content-muted hover:text-content disabled:opacity-40"
      >
        <ChevronDown size={18} />
      </button>
      <button
        type="button"
        onClick={search.close}
        aria-label={t("chat.searchClose")}
        title={t("chat.searchClose")}
        className="shrink-0 rounded p-1 text-content-muted hover:text-content"
      >
        <X size={18} />
      </button>
    </div>
  );
}
