import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

interface Props {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      closeDisabled={loading}
    >
      <p className="text-sm text-content-muted">{message}</p>

      <div className="flex justify-end gap-2 pt-6">
        <Button variant="neutral" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === "danger" ? "dangerSolid" : "primary"}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "..." : confirmText}
        </Button>
      </div>
    </Modal>
  );
}
