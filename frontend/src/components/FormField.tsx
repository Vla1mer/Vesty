import { Eye, EyeOff } from "lucide-react";
import { TextInput } from "./ui/TextInput";
import { useState } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
  const showError = Boolean(meta.touched && meta.error);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div>
      <label className="block text-sm text-content-muted mb-1">{label}</label>
      <div className="relative">
        <TextInput
          {...field}
          type={inputType}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          maxLength={maxLength}
          invalid={showError}
          className={isPassword ? "pr-10" : ""}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-content-muted hover:text-content transition"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {showError ? (
        <p className="text-xs text-danger mt-1">{meta.error}</p>
      ) : (
        hint && <p className="text-xs text-content-subtle mt-1">{hint}</p>
      )}
    </div>
  );
}
