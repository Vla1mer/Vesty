import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreateChatContent,
  type CreateChatStep,
} from "../components/CreateChatContent";
import { PageShell } from "../components/ui/PageShell";

export function CreateChatPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<CreateChatStep>(1);
  const [busy, setBusy] = useState(false);

  function goBack() {
    if (busy) return;
    if (step === 2) {
      setStep(1);
      return;
    }
    navigate("/chats");
  }

  return (
    <PageShell
      title={step === 1 ? "New group chat" : "Add members"}
      onBack={goBack}
      backDisabled={busy}
    >
      <CreateChatContent
        step={step}
        onStepChange={setStep}
        onCancel={() => navigate("/chats")}
        onCreated={(chatId) => navigate(`/chats/${chatId}`, { replace: true })}
        onBusyChange={setBusy}
      />
    </PageShell>
  );
}
