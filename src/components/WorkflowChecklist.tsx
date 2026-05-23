import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CollapsibleSection } from "@/components/CollapsibleSection";

export type WorkflowChecklistItem = {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
  links?: Array<{ href: string; label: string }>;
};

type WorkflowChecklistProps = {
  title: string;
  description: string;
  items: WorkflowChecklistItem[];
  note?: string;
  compact?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function WorkflowChecklist({
  title,
  description,
  items,
  note,
  compact = false,
  collapsible = false,
  defaultOpen = true,
}: WorkflowChecklistProps) {
  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Next best action
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {note ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {note}
          </div>
        ) : null}
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "md:grid-cols-2" : "xl:grid-cols-2"}`}>
        {items.map((item, index) => (
          <article key={`${item.title}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-sm font-bold text-slate-950">{item.title}</h3>
              </div>
              {item.href ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
                >
                  {item.actionLabel ?? "Open"}
                  <ArrowRight aria-hidden size={14} />
                </Link>
              ) : null}
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>

            {item.links && item.links.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );

  if (collapsible) {
    return (
      <CollapsibleSection
        title={title}
        description={description}
        defaultOpen={defaultOpen}
        summaryBadge={note ? <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{note}</span> : undefined}
        className="overflow-hidden"
        bodyClassName="p-4 pt-0"
      >
        {content}
      </CollapsibleSection>
    );
  }

  return <section className="card p-4">{content}</section>;
}
