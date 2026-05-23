import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  open?: boolean;
  summaryBadge?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  open,
  summaryBadge,
  children,
  className = "",
  bodyClassName = "",
}: CollapsibleSectionProps) {
  return (
    <details
      className={`group rounded-md border border-slate-200 bg-white ${className}`}
      open={open ?? defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {summaryBadge ? <div className="shrink-0">{summaryBadge}</div> : null}
          <ChevronDown aria-hidden className="mt-1 text-slate-500 transition group-open:rotate-180" size={18} />
        </div>
      </summary>
      <div className={`border-t border-slate-200 p-4 ${bodyClassName}`}>{children}</div>
    </details>
  );
}
