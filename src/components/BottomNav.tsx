import Link from "next/link";
import { navItems } from "@/components/Sidebar";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 shadow-lg backdrop-blur md:hidden">
      <div className="flex gap-1 overflow-x-auto px-2 py-2" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-24 flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-teal-800"
            >
              <Icon aria-hidden size={18} />
              <span className="text-center leading-4">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
