import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function MemosPage() {
  const { data: memos } = await supabase
    .from("decisions")
    .select("*, projects(name)")
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8A84E]">
          Memos
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white md:text-5xl">
          Decision memos
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
          Executive recommendations generated from tasks, agent outputs, evidence, and critique.
        </p>
      </header>

      {(memos ?? []).length === 0 && (
        <div className="card p-5">
          <p className="text-sm text-slate-400">No decision memos generated yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {(memos ?? []).map((memo) => (
          <Link
            key={memo.id}
            href={`/projects/${memo.project_id}`}
            className="card block p-5 transition hover:-translate-y-0.5 hover:border-[#D8A84E]/50"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-[#D8A84E]">
              {memo.projects?.name ?? "Project"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              {memo.recommendation}
            </h2>
            <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-300">
              {memo.rationale}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
