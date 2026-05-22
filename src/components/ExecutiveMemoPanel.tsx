import { GenerateMemoButton } from "@/components/GenerateMemoButton";
import { supabase } from "@/lib/supabase";

export async function ExecutiveMemoPanel({
  projectId,
}: {
  projectId: string;
}) {
  const { data: decisions } = await supabase
    .from("decisions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const latestMemo = decisions?.[0];

  return (
    <section className="space-y-4">
      <div className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#D8A84E]">
              Executive Writer
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              Decision Summary Engine
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Synthesizes project context, outputs, and evidence into a decision-ready summary.
            </p>
          </div>

          <GenerateMemoButton projectId={projectId} />
        </div>
      </div>

      {!latestMemo && (
        <div className="card p-5">
          <p className="text-sm text-slate-400">
            No summary generated yet. Run the project workflow first, then generate a summary.
          </p>
        </div>
      )}

      {latestMemo && (
        <article className="card p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#D8A84E]">
                Latest Decision Memo
              </p>

              <h3 className="mt-1 text-2xl font-bold text-white">
                {latestMemo.recommendation}
              </h3>
            </div>

            <span className="rounded-full border border-[#233450] px-3 py-1 text-xs text-slate-300">
              Executive synthesis
            </span>
          </div>

          <div className="space-y-5 text-sm leading-7 text-slate-300">
            <section>
              <h4 className="mb-2 font-semibold text-white">Rationale</h4>
              <div className="whitespace-pre-wrap">{latestMemo.rationale}</div>

            {latestMemo && (
              <div className="mt-6 flex gap-3">
                <a
                  href="/drafts"
                  target="_blank"
                  className="rounded-2xl border border-[#233450] bg-[#101B2E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#142238]"
                >
                  Review Drafts
                </a>
              </div>
            )}
          </section>

            <section>
              <h4 className="mb-2 font-semibold text-white">Critical Risks</h4>
              <div className="whitespace-pre-wrap">{latestMemo.risks}</div>

            {latestMemo && (
              <div className="mt-6 flex gap-3">
                <a
                  href="/drafts"
                  target="_blank"
                  className="rounded-2xl border border-[#233450] bg-[#101B2E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#142238]"
                >
                  Review Drafts
                </a>
              </div>
            )}
          </section>

            <section>
              <h4 className="mb-2 font-semibold text-white">Next Actions</h4>
              <div className="whitespace-pre-wrap">{latestMemo.next_actions}</div>

            {latestMemo && (
              <div className="mt-6 flex gap-3">
                <a
                  href="/drafts"
                  target="_blank"
                  className="rounded-2xl border border-[#233450] bg-[#101B2E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#142238]"
                >
                  Review Drafts
                </a>
              </div>
            )}
          </section>
          </div>
        </article>
      )}
    </section>
  );
}

