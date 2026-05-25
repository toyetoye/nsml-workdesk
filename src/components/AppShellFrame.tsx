"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { CoSAssistantPanel } from "@/components/CoSAssistantPanel";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import type { AiConfigStatus } from "@/lib/ai/types";
import type { AccessGateStatus } from "@/lib/access-gate";
import type { AccessSessionState } from "@/lib/auth-session";

type AppShellFrameProps = {
  children: ReactNode;
  gate: AccessGateStatus;
  sessionState: AccessSessionState;
  aiConfig: AiConfigStatus;
};

export function AppShellFrame({ children, gate, sessionState, aiConfig }: AppShellFrameProps) {
  const pathname = usePathname();
  const hideAssistantRail =
    pathname === "/dashboard" ||
    pathname === "/import" ||
    pathname === "/assurance" ||
    pathname === "/settings/ims";

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

        <main
          className={`mx-auto grid w-full gap-6 px-4 pb-28 pt-6 md:px-8 md:pb-10 ${
            hideAssistantRail
              ? "max-w-[104rem] xl:grid-cols-1"
              : "max-w-[104rem] xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
          }`}
        >
          <div className="min-w-0">{children}</div>
          {hideAssistantRail ? null : <CoSAssistantPanel aiConfig={aiConfig} />}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
