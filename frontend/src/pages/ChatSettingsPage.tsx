import { useLanguage } from "../context/useLanguage";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetChatByIdQuery } from "../store/chatsApi";
import {
  ChatSettingsContent,
  type ChatSettingsView,
} from "../components/ChatSettingsContent";
import { FormError } from "../components/FormError";
import { PageShell } from "../components/ui/PageShell";

export function ChatSettingsPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const chatId = Number(id);
  const isValidChat = Number.isFinite(chatId);

  const [view, setView] = useState<ChatSettingsView>("settings");
  const [busy, setBusy] = useState(false);

  const { data: chat, isLoading } = useGetChatByIdQuery(chatId, {
    skip: !isValidChat,
  });

  function goBack() {
    if (busy) return;

    if (view === "admins") {
      setView("settings");
      return;
    }
    navigate(isValidChat ? `/chats/${chatId}/info` : "/chats");
  }

  return (
    <PageShell
      title={view === "admins" ? t("admins.title") : t("nav.settings")}
      onBack={goBack}
      backDisabled={busy}
    >
      {!isValidChat ? (
        <FormError message={t("common.invalidChat")} />
      ) : isLoading ? (
        <p className="py-6 text-center text-sm text-content-subtle">
          Loading settings...
        </p>
      ) : !chat ? (
        <FormError message={t("common.chatNotFound")} />
      ) : (
        <ChatSettingsContent
          chat={chat}
          view={view}
          onViewChange={setView}
          onDeleted={() => navigate("/chats", { replace: true })}
          onBusyChange={setBusy}
        />
      )}
    </PageShell>
  );
}
