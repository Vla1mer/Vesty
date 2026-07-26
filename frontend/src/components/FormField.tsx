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
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      <div className="relative">
        <input
          {...field}
          type={inputType}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={`w-full px-3 py-2 ${
            isPassword ? "pr-10" : ""
          } rounded bg-slate-900 border text-slate-100 focus:outline-none ${
            showError
              ? "border-red-500 focus:border-red-500"
              : "border-slate-600 focus:border-amber-500"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-200 transition"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {showError ? (
        <p className="text-xs text-red-400 mt-1">{meta.error}</p>
      ) : (
        hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>
      )}
    </div>
  );
}
