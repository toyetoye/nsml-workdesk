import Link from "next/link";
import {
  Briefcase,
  ClipboardList,
  Database,
  FileText,
  Home,
  Settings,
  Users,
} from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/evidence", label: "Evidence", icon: Database },
  { href: "/memos", label: "Memos", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DesktopSidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-[#233450] bg-[#101B2E] p-5 md:block">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D8A84E]">
          Staff OS
        </p>
        <h2 className="mt-2 text-xl font-bold text-white">Command Center</h2>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-[#142238] hover:text-white"
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-[#233450] bg-[#142238] p-4">
        <p className="text-xs text-slate-400">System Mode</p>
        <p className="mt-1 font-semibold text-white">Design Foundation</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          UI shell active. Database and agents coming next.
        </p>
      </div>
    </aside>
  );
}