import type { StatusTone } from "@/lib/mock-data";
import type { ReactNode } from "react";

const toneStyles: Record<StatusTone, string> = {
  danger: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  accent: "border-teal-200 bg-teal-50 text-teal-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-xs font-semibold ${toneStyles[tone]}`}
    >
      {children}
    </span>
  );
}
