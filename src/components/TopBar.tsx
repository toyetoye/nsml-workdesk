import { ShieldCheck, LogOut, TriangleAlert } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import type { AccessSessionState } from "@/lib/auth-session";

export function TopBar({ sessionState }: { sessionState: AccessSessionState }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            NSML WorkDesk
          </p>
          <p className="text-sm font-semibold text-slate-800">
            {sessionState.mode === "development-fallback"
              ? "Development fallback active"
              : "Protected app shell"}
          </p>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {sessionState.mode === "development-fallback" ? (
            <div className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
              <TriangleAlert aria-hidden size={16} />
              Local fallback
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900">
              <ShieldCheck aria-hidden size={16} />
              Single-user gate
            </div>
          )}

          {sessionState.authenticated ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              >
                <LogOut aria-hidden size={16} />
                Log out
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
