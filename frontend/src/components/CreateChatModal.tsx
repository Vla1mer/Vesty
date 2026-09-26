import { useLanguage } from "../context/useLanguage";
import { useState } from "react";
import { Modal } from "./ui/Modal";
import {
  CreateChatContent,
  type CreateChatStep,
} from "./CreateChatContent";

interface Props {
  onClose: () => void;
}

export function CreateChatModal({ onClose }: Props) {
  const { t } = useLanguage();
  const [step, setStep] = useState<CreateChatStep>(1);
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      title={step === 1 ? t("createChat.title") : t("createChat.addMembers")}
      onClose={onClose}
      closeDisabled={busy}
      layout="column"
    >
      <div className="flex-1 overflow-y-auto">
        <CreateChatContent
          step={step}
          onStepChange={setStep}
          onCancel={onClose}
          onCreated={onClose}
          onBusyChange={setBusy}
        />
      </div>
    </Modal>
  );
}
