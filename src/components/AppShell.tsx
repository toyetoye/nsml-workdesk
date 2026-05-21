import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { CoSAssistantPanel } from "@/components/CoSAssistantPanel";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { getAccessGateStatus } from "@/lib/access-gate";
import { getAccessSessionState } from "@/lib/auth-session";

export async function AppShell({ children }: { children: ReactNode }) {
  const gate = getAccessGateStatus();
  const sessionState = await getAccessSessionState();

  if (gate.mode === "production-misconfigured") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
        <section className="card w-full max-w-lg p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
            Access gate setup required
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">NSML WorkDesk is closed</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            The production access gate is misconfigured. Set NSML_APP_PASSWORD and
            NSML_SESSION_SECRET before exposing the app.
          </p>
        </section>
      </div>
    );
  }

  if (gate.mode === "configured" && !sessionState.authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
        <section className="card w-full max-w-lg p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Session required
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Protected area</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            A valid access session is required. The middleware should redirect unauthenticated
            requests to the login page.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar />

      <div className="min-h-screen md:ml-72">
        <TopBar sessionState={sessionState} />

        {gate.mode === "development-fallback" ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 md:px-8">
            <span className="font-semibold">Development fallback active:</span> access-gate env
            vars are missing, so the app is open only for local work and the shell should not be
            treated as protected.
          </div>
        ) : null}

        <main className="mx-auto grid w-full max-w-[104rem] gap-6 px-4 pb-28 pt-6 md:px-8 md:pb-10 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">{children}</div>
          <CoSAssistantPanel />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
