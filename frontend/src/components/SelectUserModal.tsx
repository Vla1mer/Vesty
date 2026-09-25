import { useNavigate } from "react-router-dom";
import { Modal } from "./ui/Modal";
import { SelectUserContent } from "./SelectUserContent";
import { useLanguage } from "../context/useLanguage";

interface Props {
  onClose: () => void;
}

export function SelectUserModal({ onClose }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <Modal title={t("chats.startChat")} onClose={onClose} size="md" layout="column">
      <div className="flex-1 overflow-y-auto">
        <SelectUserContent
          onSelected={(userId) => {
            onClose();
            navigate(`/chats/new/${userId}`);
          }}
        />
      </div>
    </Modal>
  );
}
