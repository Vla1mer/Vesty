import { useState } from "react";
import type { ChatDto } from "../types/api";
import { Modal } from "./ui/Modal";
import { ChatInfoContent } from "./ChatInfoContent";

interface Props {
  chat: ChatDto;
  onClose: () => void;
  onOpenSettings: () => void;
}

export function ChatInfoModal({ chat, onClose, onOpenSettings }: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      onClose={onClose}
      closeDisabled={busy}
      closeIcon="back"
      closeSide="left"
      ariaLabel="Chat info"
      size="md"
      layout="column"
      layer="base"
      title={
        <h2 className="min-w-0 flex-1 text-xl font-bold text-content">
          Chat info
        </h2>
      }
    >
      <div className="flex-1 overflow-y-auto">
        <ChatInfoContent
          chat={chat}
          onOpenSettings={onOpenSettings}
          onBusyChange={setBusy}
        />
      </div>
    </Modal>
  );
}
