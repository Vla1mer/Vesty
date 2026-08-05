import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetChatByIdQuery } from "../store/chatsApi";
import { ChatInfoContent } from "../components/ChatInfoContent";
import { FormError } from "../components/FormError";
import { PageShell } from "../components/ui/PageShell";

export function ChatInfoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const chatId = Number(id);
  const isValidChat = Number.isFinite(chatId);

  const [busy, setBusy] = useState(false);

  const { data: chat, isLoading } = useGetChatByIdQuery(chatId, {
    skip: !isValidChat,
  });

  function goBack() {
    if (busy) return;
    navigate(isValidChat ? `/chats/${chatId}` : "/chats");
  }

  return (
    <PageShell title="Chat info" onBack={goBack} backDisabled={busy}>
      {!isValidChat ? (
        <FormError message="Invalid chat id" />
      ) : isLoading ? (
        <p className="py-6 text-center text-sm text-content-subtle">
          Loading...
        </p>
      ) : !chat ? (
        <FormError message="Chat not found" />
      ) : (
        <ChatInfoContent
          chat={chat}
          onOpenSettings={() => navigate(`/chats/${chatId}/settings`)}
          onBusyChange={setBusy}
        />
      )}
    </PageShell>
  );
}
