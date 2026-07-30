import { Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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
      <AnimatePresence mode="wait" initial={false}>
        {showError ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1 text-xs text-danger"
          >
            {meta.error}
          </motion.p>
        ) : (
          hint && (
            <p key="hint" className="mt-1 text-xs text-content-subtle">
              {hint}
            </p>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
