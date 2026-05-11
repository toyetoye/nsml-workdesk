import { runRedTeamReview } from "@/actions/reviews";

export function RedTeamPanel({ projectId }: { projectId: string }) {
  return (
    <section className="card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#D8A84E]">
            Inter-Agent Review
          </p>

          <h2 className="mt-1 text-2xl font-bold text-white">
            Red Team Critique
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Challenges assumptions, risks, weak evidence, and failure modes before final decision.
          </p>
        </div>

        <form action={runRedTeamReview}>
          <input type="hidden" name="project_id" value={projectId} />
          <button type="submit" className="btn-primary">
            Run Red Team
          </button>
        </form>
      </div>
    </section>
  );
}
