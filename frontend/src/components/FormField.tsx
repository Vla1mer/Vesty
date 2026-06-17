import { useField } from "formik";

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  maxLength?: number;
  hint?: string;
}

export function FormField({
  label,
  name,
  type = "text",
  autoFocus,
  autoComplete,
  maxLength,
  hint,
}: FormFieldProps) {
  const [field, meta] = useField(name);
  const showError = Boolean(meta.touched && meta.error);

  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      <input
        {...field}
        type={type}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={`w-full px-3 py-2 rounded bg-slate-900 border text-slate-100 focus:outline-none ${
          showError
            ? "border-red-500 focus:border-red-500"
            : "border-slate-600 focus:border-amber-500"
        }`}
      />
      {showError ? (
        <p className="text-xs text-red-400 mt-1">{meta.error}</p>
      ) : (
        hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>
      )}
    </div>
  );
}
