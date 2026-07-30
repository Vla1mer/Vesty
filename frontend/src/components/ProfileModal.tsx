import { ProfileContent } from "./ProfileContent";
import { Modal } from "./ui/Modal";

interface Props {
  onClose: () => void;
}

export function ProfileModal({ onClose }: Props) {
  return (
    <Modal title="Profile" onClose={onClose} size="md" layout="scroll">
      <ProfileContent />
    </Modal>
  );
}
