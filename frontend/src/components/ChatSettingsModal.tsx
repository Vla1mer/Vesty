import { useState } from "react";
import type { ChatDto } from "../types/api";
import { Modal } from "./ui/Modal";
import {
  ChatSettingsContent,
  type ChatSettingsView,
} from "./ChatSettingsContent";

interface Props {
  chat: ChatDto;
  onBack: () => void;
  onDeleted: () => void;
}

export function ChatSettingsModal({ chat, onBack, onDeleted }: Props) {
  const [view, setView] = useState<ChatSettingsView>("settings");
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      onClose={view === "admins" ? () => setView("settings") : onBack}
      size="md"
      layout="column"
      layer="base"
      closeIcon="back"
      closeSide="left"
      closeDisabled={busy}
      ariaLabel="Chat settings"
      title={
        <h2 className="min-w-0 flex-1 text-xl font-bold text-content">
          {view === "admins" ? "Administrators" : "Settings"}
        </h2>
      }
    >
      <div className="flex-1 overflow-y-auto">
        <ChatSettingsContent
          chat={chat}
          view={view}
          onViewChange={setView}
          onDeleted={onDeleted}
          onBusyChange={setBusy}
        />
      </div>
    </Modal>
  );
}
