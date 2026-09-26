import { ProfileContent } from "./ProfileContent";
import { Modal } from "./ui/Modal";
import { useLanguage } from "../context/useLanguage";

interface Props {
  onClose: () => void;
}

export function ProfileModal({ onClose }: Props) {
  const { t } = useLanguage();
  return (
    <Modal title={t("nav.profile")} onClose={onClose} size="md" layout="scroll">
      <ProfileContent />
    </Modal>
  );
}
