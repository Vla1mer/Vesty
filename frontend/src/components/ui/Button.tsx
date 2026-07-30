import type { ButtonHTMLAttributes, ReactNode } from "react";

const VARIANTS = {
  primary: "bg-accent hover:bg-accent-hover text-accent-contrast",
  neutral: "bg-surface-overlay hover:bg-line-strong text-content",
  danger: "bg-danger-soft hover:bg-danger/25 text-danger",
  dangerSolid: "bg-danger hover:bg-danger/90 text-danger-contrast",
  info: "bg-info-soft hover:bg-info/25 text-info",
  ghost: "text-content-muted hover:text-content hover:bg-surface-muted",
} as const;

const SIZES = {
  xs: "text-xs px-2 py-1 gap-1",
  sm: "text-sm px-3 py-1.5 gap-1.5",
  md: "px-4 py-2 gap-2",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  glow?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  glow = false,
  type = "button",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded font-medium transition
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong
        ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full" : ""}
        ${glow ? "enabled:hover:shadow-glow" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
