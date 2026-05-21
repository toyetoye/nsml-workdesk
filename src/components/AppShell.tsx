import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { CoSAssistantPanel } from "@/components/CoSAssistantPanel";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar />

      <div className="min-h-screen md:ml-72">
        <TopBar />
        <main className="mx-auto grid w-full max-w-[104rem] gap-6 px-4 pb-28 pt-6 md:px-8 md:pb-10 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">{children}</div>
          <CoSAssistantPanel />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
