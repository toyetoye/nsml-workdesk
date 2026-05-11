import { BottomNav } from "@/components/BottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#08111F] text-slate-50">
      <DesktopSidebar />

      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-5 md:ml-72 md:px-10 md:pb-10 md:pt-8">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}