interface FormErrorProps {
  message?: string | null;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-2">
      {message}
    </div>
  );
}
