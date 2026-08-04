import type { RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { StrangerBanner } from "./StrangerBanner";
import { FormError } from "./FormError";
import { EmptyState } from "./ui/EmptyState";
import { MessageListSkeleton } from "./ui/Skeleton";
import { formatDateSeparator, isSameDay } from "../utils/date";
import { isDirectChat } from "../types/api";
import type { ChatDto, ChatMemberWithRoleDto, MessageDto } from "../types/api";

export interface MessageSelection {
  mode: boolean;
  ids: Set<number>;
  onStart: (id: number) => void;
  onToggle: (id: number) => void;
}

export interface MessageActions {
  onReply: (message: MessageDto) => void;
  onToggleReaction: (messageId: number, emoji: string, active: boolean) => void;
  onTogglePin?: (messageId: number, pinned: boolean) => void;
  onJumpTo: (messageId: number) => void;
  onEdit: (messageId: number, content: string) => void;
  onDelete: (messageId: number) => void;
}

interface Props {
  chat?: ChatDto;
  messages: MessageDto[];
  members: Map<number, ChatMemberWithRoleDto>;
  currentUserId: number | null;
  loading: boolean;
  error: string | null;
  firstUnreadId: number | null;
  highlightedId: number | null;
  editingId: number | null;
  selection: MessageSelection;
  actions: MessageActions;
  containerRef: RefObject<HTMLDivElement | null>;
  bottomRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  compact: boolean;
}

export function MessageList({
  chat,
  messages,
  members,
  currentUserId,
  loading,
  error,
  firstUnreadId,
  highlightedId,
  editingId,
  selection,
  actions,
  containerRef,
  bottomRef,
  onScroll,
  compact,
}: Props) {
  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className={`flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col ${
        compact ? "pt-[88px]" : "pt-[140px]"
      }`}
    >
      {chat && isDirectChat(chat) && chat.partnerUserId && (
        <StrangerBanner
          partnerUserId={chat.partnerUserId}
          partnerName={chat.partnerUserName ?? "This user"}
        />
      )}

      {loading && <MessageListSkeleton />}

      {error && <FormError className="mt-auto" message={error} />}

      {!loading && !error && messages.length === 0 && (
        <EmptyState
          className="m-auto"
          Icon={MessageCircle}
          title="No messages yet"
          description="Say hello — your first message will appear here."
        />
      )}

      <div className={messages.length > 0 ? "mt-auto space-y-3" : "space-y-3"}>
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const showDate =
              !previous || !isSameDay(previous.createdAt, message.createdAt);
            const isOwn = message.userId === currentUserId;

            return (
              <motion.div
                key={message.id}
                layout="position"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {showDate && (
                  <div className="flex justify-center my-2">
                    <span className="text-xs text-content-muted bg-surface-raised px-3 py-1 rounded-full">
                      {formatDateSeparator(message.createdAt)}
                    </span>
                  </div>
                )}

                {message.id === firstUnreadId && (
                  <div className="my-3 flex items-center gap-3">
                    <span className="h-px flex-1 bg-accent-strong/40" />
                    <span className="text-xs font-medium text-accent-strong">
                      Unread messages
                    </span>
                    <span className="h-px flex-1 bg-accent-strong/40" />
                  </div>
                )}

                <MessageBubble
                  message={message}
                  isOwn={isOwn}
                  authorName={members.get(message.userId)?.userName}
                  authorAvatarUpdatedAt={
                    members.get(message.userId)?.avatarUpdatedAt
                  }
                  replyAuthorName={
                    message.replyTo
                      ? members.get(message.replyTo.userId)?.userName
                      : undefined
                  }
                  onReply={actions.onReply}
                  currentUserId={currentUserId}
                  onToggleReaction={actions.onToggleReaction}
                  onTogglePin={actions.onTogglePin}
                  onJumpToMessage={actions.onJumpTo}
                  highlighted={highlightedId === message.id}
                  showAuthor={chat ? !chat.isPrivate : false}
                  isEditing={editingId === message.id}
                  selectionMode={selection.mode}
                  selected={selection.ids.has(message.id)}
                  onSelectStart={selection.onStart}
                  onToggleSelect={selection.onToggle}
                  onEdit={isOwn ? actions.onEdit : undefined}
                  onDelete={isOwn ? actions.onDelete : undefined}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
