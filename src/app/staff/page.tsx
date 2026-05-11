import { AgentCard } from "@/components/AgentCard";
import { agents } from "@/lib/mock-data";

export default function StaffPage() {
  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8A84E]">
          Core Staff
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white md:text-5xl">
          Reusable AI workforce
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
          These agents are permanent staff members that can be assigned across
          any project: technical, commercial, financial, operational, or strategic.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {agents.map((agent) => (
          <AgentCard key={agent.name} {...agent} />
        ))}
      </div>
    </section>
  );
}