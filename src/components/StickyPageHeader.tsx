import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type HeaderAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type StickyPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  context?: string;
  primaryAction?: HeaderAction;
  secondaryActions?: HeaderAction[];
  trailing?: ReactNode;
};

export function StickyPageHeader({
  eyebrow,
  title,
  description,
  context,
  primaryAction,
  secondaryActions = [],
  trailing,
}: StickyPageHeaderProps) {
  return (
    <header className="sticky top-16 z-10 -mx-4 border-b border-slate-200 bg-[var(--background)]/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{eyebrow}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">{title}</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{description}</p>
          {context ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {context}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {primaryAction ? (
            <HeaderButton action={primaryAction} />
          ) : null}
          {secondaryActions.map((action) => (
            <HeaderButton key={`${action.href}-${action.label}`} action={action} />
          ))}
          {trailing}
        </div>
      </div>
    </header>
  );
}

function HeaderButton({ action }: { action: HeaderAction }) {
  const className =
    action.variant === "primary"
      ? "btn-primary"
      : "inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50";

  return (
    <Link href={action.href} className={className}>
      {action.label}
      <ArrowRight aria-hidden size={16} />
    </Link>
  );
}
