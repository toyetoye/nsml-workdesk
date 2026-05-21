import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  icon: Icon,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  items: string[];
}) {
  return (
    <section className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-800"
      >
        <ArrowLeft aria-hidden size={16} />
        Dashboard
      </Link>

      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-4xl font-bold text-slate-950">{title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          {description}
        </p>
      </header>

      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-800">
            <Icon aria-hidden size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-950">Sprint 000 placeholder</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This screen is intentionally limited to shell structure and mock labels.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <div key={item} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-800">{item}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">Mock state</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
