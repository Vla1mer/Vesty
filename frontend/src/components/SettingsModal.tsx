import { SettingsContent } from "./SettingsContent";
import { Modal } from "./ui/Modal";
import { useLanguage } from "../context/useLanguage";

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const { t } = useLanguage();
  return (
    <Modal title={t("nav.settings")} onClose={onClose} size="md" layout="scroll">
      <SettingsContent />
    </Modal>
  );
}
