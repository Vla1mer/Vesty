import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetChatByIdQuery, useGetChatMembersQuery } from "../store/chatApi";
import {
  useGetMessagesByChatQuery,
  useCreateMessageMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
} from "../store/messageApi";
import { useAuth } from "../context/useAuth";
import { MessageBubble } from "../components/MessageBubble";
import { ChatInfoModal } from "../components/ChatInfoModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { getChatDisplayName } from "../utils/chats";
import { onChatDeleted } from "../lib/signalr";
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import type { AxiosBaseQueryError } from "../api/axiosBaseQuery";

function typingText(names: string[]): string {
  if (names.length === 1) return `${names[0]} is typing`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
  return "Several people are typing";
}

export function ChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const chatId = Number(id);
  const isValidChat = Number.isFinite(chatId);

  const [input, setInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const { data: chat, isLoading: chatLoading, error: chatError } =
    useGetChatByIdQuery(chatId, { skip: !isValidChat });
  const { data: members = [] } = useGetChatMembersQuery(chatId, {
    skip: !isValidChat,
  });
  const {
    data: messages = [],
    isLoading: messagesLoading,
    isError: messagesError,
  } = useGetMessagesByChatQuery(chatId, { skip: !isValidChat });
  const [createMessage, { isLoading: sending }] = useCreateMessageMutation();
  const [updateMessage] = useUpdateMessageMutation();
  const [deleteMessage, { isLoading: deletingMessage }] =
    useDeleteMessageMutation();
  const { typingNames, notifyTyping } = useTypingIndicator(chatId, isValidChat);

  const bottomRef = useRef<HTMLDivElement>(null);

  const userNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of members) map.set(m.userId, m.userName);
    return map;
  }, [members]);

  const loadError = useMemo(() => {
    if (!isValidChat) return "Invalid chat id";
    if (!chatError) return null;
    const status = (chatError as AxiosBaseQueryError).status;
    if (status === 403) return "You don't have access to this chat";
    if (status === 404) return "Chat not found";
    return "Failed to load chat";
  }, [isValidChat, chatError]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    try {
      await createMessage({ chatId, content }).unwrap();
      setInput("");
    } catch {
      setActionError("Failed to send message");
    }
  }

  async function handleEditMessage(id: number, content: string) {
    await updateMessage({ chatId, id, content }).unwrap();
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

  const title = chat ? getChatDisplayName(chat) : `Chat #${chatId}`;

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto">
      <header className="flex items-center gap-4 p-4 border-b border-slate-700 bg-slate-900 sticky top-0 z-10">
        <button
          onClick={() => navigate("/chats")}
          className="text-slate-400 hover:text-slate-100 text-2xl"
          aria-label="Back"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => chat && setIsInfoOpen(true)}
          disabled={!chat}
          className="group flex-1 flex items-center gap-2 text-left rounded px-2 py-1 -mx-2 hover:bg-slate-800 transition disabled:cursor-default disabled:hover:bg-transparent"
        >
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-100">{title}</h1>
            {chat && (
              <p className="text-xs text-slate-400">
                {members.length > 0
                  ? `${members.length} ${members.length === 1 ? "member" : "members"}`
                  : "Loading..."}
              </p>
            )}
          </div>
          {chat && (
            <span
              className="text-slate-500 group-hover:text-amber-400 transition text-3xl leading-none"
              aria-hidden="true"
            >
              ›
            </span>
          )}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(chatLoading || messagesLoading) && (
          <p className="text-slate-400 text-center">Loading...</p>
        )}

        {(loadError || actionError || messagesError) && (
          <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-3">
            {loadError ?? actionError ?? "Failed to load messages"}
          </div>
        )}

        {!chatLoading &&
          !messagesLoading &&
          !loadError &&
          !actionError &&
          !messagesError &&
          messages.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p>No messages yet. Be the first to write something!</p>
            </div>
          )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.userId === userId}
            authorName={userNameById.get(msg.userId)}
            onEdit={msg.userId === userId ? handleEditMessage : undefined}
            onDelete={
              msg.userId === userId ? (id) => setDeleteTargetId(id) : undefined
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {isInfoOpen && chat && (
        <ChatInfoModal
          chat={chat}
          onClose={() => setIsInfoOpen(false)}
          onDeleted={() => navigate("/chats", { replace: true })}
        />
      )}

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

      {!loadError && !actionError && (
        <div className="relative border-t border-slate-700 bg-slate-900 sticky bottom-0">
          {typingNames.length > 0 && (
            <p className="absolute bottom-full mb-1 left-0 right-0 px-4 py-1 text-xs text-amber-400 italic bg-slate-950">
              {typingText(typingNames)}
              <span className="typing-dots" />
            </p>
          )}
          <form onSubmit={handleSend} className="flex gap-2 p-4">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                notifyTyping();
              }}
              placeholder="Type a message..."
              maxLength={2000}
              disabled={sending}
              className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-600 text-slate-100 focus:outline-none focus:border-amber-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white disabled:bg-slate-700 disabled:cursor-not-allowed font-medium transition"
            >
              {sending ? "..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
