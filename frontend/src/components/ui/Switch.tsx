interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  className?: string;
}

export function Switch({ checked, onChange, ariaLabel, className = "" }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong ${
        checked
          ? "border-accent-strong bg-accent-soft"
          : "border-line bg-surface-raised hover:border-line-strong"
      } ${className}`}
    >
      <span
        className={`absolute left-0 h-6 w-6 rounded-full shadow-raised transition-transform duration-200 ease-swift ${
          checked
            ? "translate-x-7 bg-accent"
            : "translate-x-1 bg-content-subtle"
        }`}
      />
    </button>
  );
}
