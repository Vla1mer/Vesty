interface FormErrorProps {
  message?: string | null;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <div className="text-sm text-danger bg-danger-soft border border-danger/40 rounded p-2">
      {message}
    </div>
  );
}
