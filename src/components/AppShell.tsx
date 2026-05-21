import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar />

      <div className="min-h-screen md:ml-72">
        <TopBar />
        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-10">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
