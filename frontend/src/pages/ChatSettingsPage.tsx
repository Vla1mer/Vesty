import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetChatByIdQuery } from "../store/chatApi";
import {
  ChatSettingsContent,
  type ChatSettingsView,
} from "../components/ChatSettingsContent";
import { FormError } from "../components/FormError";
import { PageShell } from "../components/ui/PageShell";

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
    <PageShell
      title={view === "admins" ? "Administrators" : "Settings"}
      onBack={goBack}
    >
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
    </PageShell>
  );
}
