import Link from "next/link";
import type { NavigationSection } from "@/components/navigation";

export function PageSectionTabs({
  sections,
  activeKey,
  className = "",
}: {
  sections: NavigationSection[];
  activeKey: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {sections.map((section) => {
        const active = section.key === activeKey;

        return (
          <Link
            key={section.key}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-sm font-semibold transition ${
              active
                ? "border-teal-300 bg-teal-50 text-teal-800"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:text-teal-800"
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </div>
  );
}
