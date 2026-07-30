import { SettingsContent } from "./SettingsContent";
import { Modal } from "./ui/Modal";

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  return (
    <Modal title="Settings" onClose={onClose} size="md" layout="scroll">
      <SettingsContent />
    </Modal>
  );
}
