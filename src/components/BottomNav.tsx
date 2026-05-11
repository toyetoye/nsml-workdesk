import Link from "next/link";
import { Briefcase, Database, Home, Settings, Users } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/evidence", label: "Evidence", icon: Database },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[#233450] bg-[#101B2E]/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-5 px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs text-slate-300 hover:bg-[#142238] hover:text-white"
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}