import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGetChatByIdQuery } from "../store/chatApi";
import {
  ChatSettingsContent,
  type ChatSettingsView,
} from "../components/ChatSettingsContent";
import { FormError } from "../components/FormError";

export function ChatSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const chatId = Number(id);
  const isValidChat = Number.isFinite(chatId);

  const [view, setView] = useState<ChatSettingsView>("settings");

  const { data: chat, isLoading } = useGetChatByIdQuery(chatId, {
    skip: !isValidChat,
  });

  function goBack() {
    if (view === "admins") {
      setView("settings");
      return;
    }
    navigate(`/chats/${chatId}`);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-3">
        <button
          type="button"
          onClick={goBack}
          className="text-content-muted transition hover:text-content"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-content">
          {view === "admins" ? "Administrators" : "Settings"}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {!isValidChat ? (
          <FormError message="Invalid chat id" />
        ) : isLoading ? (
          <p className="py-6 text-center text-sm text-content-subtle">
            Loading settings...
          </p>
        ) : !chat ? (
          <FormError message="Chat not found" />
        ) : (
          <ChatSettingsContent
            chat={chat}
            view={view}
            onViewChange={setView}
            onDeleted={() => navigate("/chats", { replace: true })}
          />
        )}
      </div>
    </div>
  );
}
