interface FormErrorProps {
  message?: string | null;
  className?: string;
}

export function FormError({ message, className = "" }: FormErrorProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={`rounded border border-danger/40 bg-danger-soft p-3 text-sm text-danger ${className}`}
    >
      {message}
    </div>
  );
}
