import { FriendsContent } from "./FriendsContent";
import { Modal } from "./ui/Modal";
import { useLanguage } from "../context/useLanguage";

interface Props {
  onClose: () => void;
}

export function FriendsModal({ onClose }: Props) {
  const { t } = useLanguage();
  return (
    <Modal title={t("nav.friends")} onClose={onClose} size="md" layout="scroll">
      <FriendsContent />
    </Modal>
  );
}
