import { Button } from "./ui/Button";
import { FormError } from "./FormError";
import { Modal } from "./ui/Modal";

interface Props {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  error?: string | null;
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
  error = null,
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
      <FormError message={error} className="mt-4" />

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
