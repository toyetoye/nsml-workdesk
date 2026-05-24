import type { ReactNode } from "react";
import { AppShellFrame } from "@/components/AppShellFrame";
import { getAiConfigStatus } from "@/lib/ai/config";
import { getAccessGateStatus } from "@/lib/access-gate";
import { getAccessSessionState } from "@/lib/auth-session";

export async function AppShell({ children }: { children: ReactNode }) {
  const gate = getAccessGateStatus();
  const sessionState = await getAccessSessionState();
  const aiConfig = getAiConfigStatus();

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

  return <AppShellFrame gate={gate} sessionState={sessionState} aiConfig={aiConfig}>{children}</AppShellFrame>;
}
