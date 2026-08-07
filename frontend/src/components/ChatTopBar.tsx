import { ArrowLeft, ChevronRight, Copy, Pencil, Pin, Trash2, X } from "lucide-react";
import { Avatar, ChatAvatar } from "./Avatar";
import { usePresence } from "../hooks/usePresence";
import { formatLastSeen } from "../utils/date";
import { isDirectChat } from "../types/api";
import type { ChatDto, MessageDto } from "../types/api";

function typingText(names: string[]): string {
  if (names.length === 1) return `${names[0]} is typing`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
  return "Several people are typing";
}

export interface TopBarSelection {
  mode: boolean;
  count: number;
  ownCount: number;
  onClear: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export interface TopBarPinned {
  message?: MessageDto;
  index: number;
  total: number;
  onNext: () => void;
}

interface Props {
  chat?: ChatDto;
  title: string;
  memberCount: number;
  typingNames: string[];
  onBack: () => void;
  onOpenInfo: () => void;
  selection: TopBarSelection;
  pinned: TopBarPinned;
}

export function ChatTopBar({
  chat,
  title,
  memberCount,
  typingNames,
  onBack,
  onOpenInfo,
  selection,
  pinned,
}: Props) {
  const partnerId = chat && isDirectChat(chat) ? chat.partnerUserId : undefined;
  const presence = usePresence(partnerId ? [partnerId] : []);
  const partnerLastSeen = partnerId ? presence.lastSeenAt(partnerId) : null;

  const showPinned = pinned.message && !selection.mode;

  return (
    <>
      <div className="absolute top-0 inset-x-0 overflow-hidden min-h-[88px] z-10">
        <header
          className={`absolute inset-0 flex items-center gap-4 p-4 border-b border-line bg-surface/80 backdrop-blur transition-transform duration-200 ${
            selection.mode ? "-translate-y-full" : "translate-y-0"
          }`}
        >
          <button
            onClick={onBack}
            className="md:hidden text-content-muted hover:text-content"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <button
            type="button"
            onClick={onOpenInfo}
            disabled={!chat}
            className="group flex-1 flex items-center gap-2 text-left rounded px-2 -mx-2 hover:bg-surface-muted transition disabled:cursor-default disabled:hover:bg-transparent"
          >
            {chat &&
              (isDirectChat(chat) && chat.partnerUserId ? (
                <Avatar
                  online={presence.isOnline(chat.partnerUserId)}
                  userId={chat.partnerUserId}
                  userName={chat.partnerUserName ?? undefined}
                  avatarUpdatedAt={chat.partnerAvatarUpdatedAt}
                />
              ) : (
                <ChatAvatar
                  chatId={chat.id}
                  name={title}
                  avatarUpdatedAt={chat.avatarUpdatedAt}
                />
              ))}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-content truncate">{title}</h1>
              {chat &&
                (typingNames.length > 0 ? (
                  <p className="text-xs text-accent-strong italic">
                    {typingText(typingNames)}
                    <span className="typing-dots" />
                  </p>
                ) : !chat.isPrivate ? (
                  <p className="text-xs text-content-muted">
                    {memberCount > 0
                      ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
                      : "Loading..."}
                  </p>
                ) : partnerId && presence.isOnline(partnerId) ? (
                  <p className="text-xs text-success">online</p>
                ) : partnerLastSeen ? (
                  <p className="text-xs text-content-muted">
                    {formatLastSeen(partnerLastSeen)}
                  </p>
                ) : null)}
            </div>
            {chat && (
              <ChevronRight
                size={20}
                aria-hidden="true"
                className="shrink-0 text-content-subtle transition group-hover:translate-x-0.5 group-hover:text-accent-strong"
              />
            )}
          </button>
        </header>

        <header
          className={`absolute inset-0 flex items-center gap-4 p-4 border-b border-line bg-surface/80 backdrop-blur transition-transform duration-200 ${
            selection.mode ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <button
            onClick={selection.onClear}
            className="text-content-muted hover:text-content"
            aria-label="Cancel selection"
          >
            <X size={22} />
          </button>
          <span className="flex-1 font-semibold text-content">
            {selection.count} selected
          </span>
          <div className="flex items-center gap-4 text-content-muted">
            <button onClick={selection.onCopy} aria-label="Copy" title="Copy">
              <Copy size={20} />
            </button>
            {selection.count === 1 && selection.ownCount === 1 && (
              <button onClick={selection.onEdit} aria-label="Edit" title="Edit">
                <Pencil size={20} />
              </button>
            )}
            {selection.ownCount > 0 && (
              <button
                onClick={selection.onDelete}
                aria-label="Delete"
                title="Delete"
                className="text-danger"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </header>
      </div>

      {showPinned && pinned.message && (
        <button
          type="button"
          onClick={pinned.onNext}
          className="absolute top-[88px] inset-x-0 z-10 flex items-center gap-3 px-4 py-2 border-b border-line bg-surface-muted/95 backdrop-blur text-left hover:bg-surface transition"
        >
          <Pin size={15} aria-hidden="true" className="shrink-0 text-accent-strong" />
          <div className="min-w-0 flex-1 border-l-2 border-accent-strong pl-3">
            <p className="text-xs font-medium text-accent-strong">
              {pinned.total > 1
                ? `Pinned message ${pinned.index + 1} of ${pinned.total}`
                : "Pinned message"}
            </p>
            <p className="text-sm text-content-muted truncate">
              {pinned.message.content}
            </p>
          </div>
        </button>
      )}
    </>
  );
}
