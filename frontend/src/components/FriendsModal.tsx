import { FriendsContent } from "./FriendsContent";
import { Modal } from "./ui/Modal";

interface Props {
  onClose: () => void;
}

export function FriendsModal({ onClose }: Props) {
  return (
    <Modal title="Friends" onClose={onClose} size="md" layout="scroll">
      <FriendsContent />
    </Modal>
  );
}
