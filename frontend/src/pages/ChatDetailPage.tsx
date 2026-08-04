import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetChatByIdQuery,
  useGetChatMembersQuery,
  useMarkChatReadMutation,
} from "../store/chatApi";
import {
  useGetMessagesByChatQuery,
  useCreateMessageMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
  useToggleReactionMutation,
  useTogglePinMutation,
} from "../store/messageApi";
import { useAuth } from "../context/useAuth";
import { ChatTopBar } from "../components/ChatTopBar";
import { MessageList } from "../components/MessageList";
import { ChatInfoModal } from "../components/ChatInfoModal";
import { ChatSettingsModal } from "../components/ChatSettingsModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { getChatDisplayName } from "../utils/chats";
import { onChatDeleted } from "../lib/signalr";
import { setActiveChat } from "../lib/activeChat";
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import { useAttachmentUploads } from "../hooks/useAttachmentUploads";
import { useMessageSelection } from "../hooks/useMessageSelection";
import { useChatScroll } from "../hooks/useChatScroll";
import { useIsMobile } from "../hooks/useIsMobile";
import { ArrowDown } from "lucide-react";
import { MessageComposer } from "../components/MessageComposer";
import type { AxiosBaseQueryError } from "../api/axiosBaseQuery";
import { isDirectChat, UserRole, type ChatMemberWithRoleDto, type MessageDto } from "../types/api";
import { AnimatePresence, motion } from "framer-motion";
import { getApiErrorMessage } from "../utils/apiError";
import { useGetBlockedUsersQuery } from "../store/blockApi";

export function ChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const chatId = Number(id);
  const isValidChat = Number.isFinite(chatId);

  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { data: blockedUsers = [] } = useGetBlockedUsersQuery();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data: chat, isLoading: chatLoading, error: chatError } =
    useGetChatByIdQuery(chatId, {
      skip: !isValidChat,
      refetchOnMountOrArgChange: true,
    });
  const { data: members = [] } = useGetChatMembersQuery(chatId, {
    skip: !isValidChat,
    refetchOnMountOrArgChange: true,
  });
  const {
    data: messages = [],
    isLoading: messagesLoading,
    isError: messagesError,
  } = useGetMessagesByChatQuery(chatId, {
    skip: !isValidChat,
    refetchOnMountOrArgChange: true,
  });
  const [createMessage, { isLoading: sending }] = useCreateMessageMutation();
  const [updateMessage, { isLoading: saving }] = useUpdateMessageMutation();
  const [deleteMessage, { isLoading: deletingMessage }] =
    useDeleteMessageMutation();
  const [markChatRead] = useMarkChatReadMutation();
  const [toggleReaction] = useToggleReactionMutation();
  const [togglePin] = useTogglePinMutation();
  const attachments = useAttachmentUploads(chatId);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const { typingNames, notifyTyping } = useTypingIndicator(chatId, isValidChat);
  const isMobile = useIsMobile();

  const [replyTo, setReplyTo] = useState<MessageDto | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const editingMessage =
    editingId !== null ? messages.find((m) => m.id === editingId) : undefined;

  const selection = useMessageSelection(messages, userId);
  const scroll = useChatScroll({
    chatId,
    messages,
    chat,
    chatFailed: Boolean(chatError),
  });

  const memberById = useMemo(() => {
    const map = new Map<number, ChatMemberWithRoleDto>();
    for (const m of members) map.set(m.userId, m);
    return map;
  }, [members]);

  const canPin = useMemo(() => {
    if (!chat) return false;
    if (chat.isPrivate) return true;
    const me = members.find((m) => m.userId === userId);
    return me?.roleId === UserRole.Owner || me?.roleId === UserRole.Admin;
  }, [chat, members, userId]);

  const pinnedMessages = useMemo(
    () =>
      messages
        .filter((m) => m.pinnedAt)
        .sort((a, b) => (a.pinnedAt! < b.pinnedAt! ? 1 : -1)),
    [messages]
  );

  const activePinned =
    pinnedMessages.length > 0
      ? pinnedMessages[pinnedIndex % pinnedMessages.length]
      : undefined;

  function showNextPinned() {
    if (!activePinned) return;
    scroll.jumpToMessage(activePinned.id);
    if (pinnedMessages.length > 1) {
      setPinnedIndex((prev) => (prev + 1) % pinnedMessages.length);
    }
  }

  const loadError = useMemo(() => {
    if (!isValidChat) return "Invalid chat id";
    if (!chatError) return null;
    const status = (chatError as AxiosBaseQueryError).status;
    if (status === 403) return "You don't have access to this chat";
    if (status === 404) return "Chat not found";
    return "Failed to load chat";
  }, [isValidChat, chatError]);

  const blockedPartner =
    chat && isDirectChat(chat) && chat.partnerUserId
      ? blockedUsers.some((b) => b.userId === chat.partnerUserId)
      : false;

  useEffect(() => {
    if (!isValidChat) return;
    setActiveChat(chatId);
    return () => setActiveChat(null);
  }, [chatId, isValidChat]);

  useEffect(() => {
    setPinnedIndex(0);
  }, [chatId]);

  useEffect(() => {
    if (isValidChat && scroll.initialScrollDone) markChatRead(chatId);
  }, [chatId, isValidChat, scroll.initialScrollDone, messages.length, markChatRead]);

  useEffect(() => {
    if (!isValidChat) return;

    const unsubscribeChatDeleted = onChatDeleted(({ chatId: deletedChatId }) => {
      if (deletedChatId !== chatId) return;
      navigate("/chats", { replace: true });
    });

    return () => {
      unsubscribeChatDeleted();
    };
  }, [chatId, isValidChat, navigate]);

  function startEdit(id: number, content: string) {
    setEditingId(id);
    setInput(content);
    inputRef.current?.focus();
  }

  function cancelEdit() {
    setEditingId(null);
    setInput("");
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (sending || saving || attachments.isUploading) return;
    if (!content && attachments.readyIds.length === 0) return;

    setActionError(null);

    if (editingId !== null) {
      if (content === editingMessage?.content) {
        cancelEdit();
        return;
      }
      try {
        await updateMessage({ chatId, id: editingId, content }).unwrap();
        cancelEdit();
      } catch (error) {
        setActionError(getApiErrorMessage(error, "Failed to edit message"));
      }
      return;
    }

    try {
      await createMessage({
        chatId,
        content,
        replyToMessageId: replyTo?.id,
        attachmentIds: attachments.readyIds.length ? attachments.readyIds : undefined,
      }).unwrap();
      setInput("");
      setReplyTo(null);
      attachments.clear();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Failed to send message"));
    }
  }

  async function confirmDeleteMessage() {
    if (deleteTargetId === null) return;
    try {
      await deleteMessage({ chatId, id: deleteTargetId }).unwrap();
      setDeleteTargetId(null);
    } catch {
      setActionError("Failed to delete message");
    }
  }


  function editSelected() {
    const target = selection.selected[0];
    if (target && target.userId === userId) {
      startEdit(target.id, target.content ?? "");
    }
    selection.clear();
  }

  async function confirmBulkDelete() {
    try {
      await Promise.all(
        selection.ownIds.map((id) => deleteMessage({ chatId, id }).unwrap())
      );
      setBulkDeleteOpen(false);
      selection.clear();
    } catch {
      setActionError("Failed to delete messages");
      setBulkDeleteOpen(false);
    }
  }

  const title = chat ? getChatDisplayName(chat) : `Chat #${chatId}`;

  return (
    <div
      className="relative h-full flex flex-col"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingFile(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setIsDraggingFile(false);
        attachments.add(Array.from(e.dataTransfer.files));
      }}
      onPaste={(e) => {
        const files = Array.from(e.clipboardData.files);
        if (files.length > 0) attachments.add(files);
      }}
    >
      {isDraggingFile && (
        <div className="absolute inset-0 z-30 flex items-center justify-center border-2 border-dashed border-accent-strong bg-surface/80 pointer-events-none">
          <p className="text-lg font-medium text-accent-strong">Drop files to attach</p>
        </div>
      )}
      <ChatTopBar
        chat={chat}
        title={title}
        memberCount={members.length}
        typingNames={typingNames}
        onBack={() => navigate("/chats")}
        onOpenInfo={() => {
          if (!chat) return;
          if (isMobile) navigate(`/chats/${chatId}/info`);
          else setIsInfoOpen(true);
        }}
        selection={{
          mode: selection.mode,
          count: selection.ids.size,
          ownCount: selection.ownIds.length,
          onClear: selection.clear,
          onCopy: selection.copy,
          onEdit: editSelected,
          onDelete: () => setBulkDeleteOpen(true),
        }}
        pinned={{
          message: activePinned,
          index: pinnedMessages.length > 0 ? pinnedIndex % pinnedMessages.length : 0,
          total: pinnedMessages.length,
          onNext: showNextPinned,
        }}
      />

      <MessageList
        chat={chat}
        messages={messages}
        members={memberById}
        currentUserId={userId}
        loading={chatLoading || messagesLoading}
        error={
          loadError ?? (messagesError ? "Failed to load messages" : null)
        }
        firstUnreadId={scroll.firstUnreadId}
        highlightedId={scroll.highlightedId}
        editingId={editingId}
        selection={{
          mode: selection.mode,
          ids: selection.ids,
          onStart: selection.start,
          onToggle: selection.toggle,
        }}
        actions={{
          onReply: setReplyTo,
          onToggleReaction: (messageId, emoji, active) =>
            toggleReaction({ chatId, messageId, emoji, active }),
          onTogglePin: canPin
            ? (messageId, pinned) => togglePin({ chatId, messageId, pinned })
            : undefined,
          onJumpTo: scroll.jumpToMessage,
          onEdit: startEdit,
          onDelete: (id) => setDeleteTargetId(id),
        }}
        containerRef={scroll.containerRef}
        bottomRef={scroll.bottomRef}
        onScroll={scroll.handleScroll}
        compact={!activePinned || selection.mode}
      />

      <AnimatePresence>
        {isInfoOpen && chat && (
          <ChatInfoModal
            chat={chat}
            onClose={() => setIsInfoOpen(false)}
            onOpenSettings={() => {
              setIsInfoOpen(false);
              if (isMobile) navigate(`/chats/${chatId}/settings`);
              else setIsSettingsOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && chat && (
          <ChatSettingsModal
            chat={chat}
            onBack={() => {
              setIsSettingsOpen(false);
              setIsInfoOpen(true);
            }}
            onDeleted={() => navigate("/chats", { replace: true })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTargetId !== null && (
          <ConfirmDialog
            title="Delete message?"
            message="This message will be permanently deleted."
            confirmText="Delete"
            variant="danger"
            loading={deletingMessage}
            onConfirm={confirmDeleteMessage}
            onCancel={() => setDeleteTargetId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bulkDeleteOpen && (
          <ConfirmDialog
            title={`Delete ${selection.ownIds.length} ${
              selection.ownIds.length === 1 ? "message" : "messages"
            }?`}
            message="The selected messages will be permanently deleted."
            confirmText="Delete"
            variant="danger"
            loading={deletingMessage}
            onConfirm={confirmBulkDelete}
            onCancel={() => setBulkDeleteOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scroll.showJumpToBottom && (
          <motion.button
            type="button"
            onClick={scroll.jumpToBottom}
            aria-label="Jump to latest message"
            title="Jump to latest message"
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="absolute bottom-24 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface-overlay text-content shadow-float transition-colors hover:bg-surface-raised"
          >
            <ArrowDown size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {!loadError && (
        <MessageComposer
          value={input}
          onChange={(next) => {
            setInput(next);
            notifyTyping();
          }}
          onSubmit={handleSend}
          inputRef={inputRef}
          attachments={attachments}
          editingMessage={editingMessage}
          isEditing={editingId !== null}
          onCancelEdit={cancelEdit}
          replyTo={replyTo}
          replyAuthorName={
            replyTo ? memberById.get(replyTo.userId)?.userName : undefined
          }
          onCancelReply={() => setReplyTo(null)}
          error={actionError}
          busy={sending || saving}
          blocked={blockedPartner}
        />
      )}
    </div>
  );
}
