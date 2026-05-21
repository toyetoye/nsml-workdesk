import { ShieldCheck } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Sprint 000
          </p>
          <p className="text-sm font-semibold text-slate-800">
            Product shell with mock operational data
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900 sm:flex">
          <ShieldCheck aria-hidden size={16} />
          Manual import only
        </div>
      </div>
    </header>
  );
}
