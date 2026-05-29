"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FileEdit, Home, Ship, Upload } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Import", href: "/import", icon: Upload },
  { label: "Cases", href: "/cases", icon: ClipboardList },
  { label: "Drafts", href: "/drafts", icon: FileEdit },
  { label: "Vessels", href: "/vessels/lng-portharcourt-ii", icon: Ship },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 shadow-lg backdrop-blur md:hidden">
      <div className="flex gap-1 px-2 py-2" aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.label === "Vessels"
              ? pathname.startsWith("/vessels/")
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] font-semibold transition ${
                active
                  ? "bg-teal-50 text-teal-800"
                  : "text-slate-600 hover:bg-slate-100 hover:text-teal-800"
              }`}
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
