import Link from "next/link";
import {
  ClipboardList,
  FileEdit,
  FolderKanban,
  Home,
  Inbox,
  PenLine,
  Ship,
  Upload,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/vessels/lng-portharcourt-ii", label: "LNG PORTHARCOURT II", icon: Ship },
  { href: "/vessels/lpg-alfred-temile", label: "LPG ALFRED TEMILE", icon: Ship },
  { href: "/vessels/lpg-alfred-temile-10", label: "LPG ALFRED TEMILE 10", icon: Ship },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/other", label: "Other", icon: Inbox },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/cases", label: "Cases", icon: ClipboardList },
  { href: "/drafts", label: "Drafts", icon: FileEdit },
  { href: "/settings/writing-style", label: "Writing Style", icon: PenLine },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-900 bg-[var(--nav)] p-5 text-[var(--nav-foreground)] md:block">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
          NSML WorkDesk
        </p>
        <p className="mt-2 text-2xl font-bold">Operations command centre</p>
      </div>

      <nav aria-label="Primary navigation" className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-[var(--nav-soft)] hover:text-white"
            >
              <Icon aria-hidden size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-5 left-5 right-5 rounded-md border border-slate-600 bg-[var(--nav-soft)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
          Boundary
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-200">
          No Outlook connection, email sending, database, or AI workflow in Sprint 000.
        </p>
      </div>
    </aside>
  );
}

export { navItems };
