import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, Props>(function TextInput(
  { invalid = false, className = "", ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded bg-surface-sunken px-3 py-2 text-content placeholder-content-muted
        border transition focus:outline-none disabled:opacity-50
        ${invalid ? "border-danger focus:border-danger" : "border-line-strong focus:border-accent-strong"}
        ${className}`}
      {...rest}
    />
  );
});
