import type { ReactNode } from "react";

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 border-b border-line pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-content-subtle">
      {children}
    </h3>
  );
}
