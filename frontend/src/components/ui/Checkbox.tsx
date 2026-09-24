import { useId } from "react";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Checkbox({ checked, onChange, label }: Props) {
  const id = useId();

  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border border-line-strong bg-surface-sunken accent-accent
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
      />
      <label htmlFor={id} className="select-none text-sm text-content-muted">
        {label}
      </label>
    </div>
  );
}
