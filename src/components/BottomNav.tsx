"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { bottomNavigation, matchNavigationHref } from "@/components/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 shadow-lg backdrop-blur md:hidden">
      <div className="flex gap-1 overflow-x-auto px-2 py-2" aria-label="Mobile navigation">
        {bottomNavigation.map((item) => {
          const Icon = item.icon;
          const active =
            item.label === "Vessels"
              ? pathname.startsWith("/vessels/")
              : matchNavigationHref(pathname, currentSearch, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-20 flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] font-semibold transition ${
                active
                  ? "bg-teal-50 text-teal-800"
                  : "text-slate-600 hover:bg-slate-100 hover:text-teal-800"
              }`}
            >
              {Icon ? <Icon aria-hidden size={18} /> : null}
              <span className="text-center leading-4">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
