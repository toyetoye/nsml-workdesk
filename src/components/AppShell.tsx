import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { CoSAssistantPanel } from "@/components/CoSAssistantPanel";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { getAccessGateStatus } from "@/lib/access-gate";
import { getAccessSessionState } from "@/lib/auth-session";

export async function AppShell({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-nsml-pathname") ?? "/";

  if (pathname === "/login") {
    return <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">{children}</div>;
  }

  const gate = getAccessGateStatus();
  const sessionState = await getAccessSessionState();

  if (gate.mode === "production-misconfigured") {
    redirect("/login?error=setup");
  }

  if (gate.mode === "configured" && !sessionState.authenticated) {
    redirect(`/login?redirectTo=${encodeURIComponent(pathname)}`);
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
