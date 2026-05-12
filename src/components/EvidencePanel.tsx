import { supabase } from "@/lib/supabase";

export async function EvidencePanel({
  projectId,
}: {
  projectId: string;
}) {
  const { data: evidence } = await supabase
    .from("evidence_items")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const items = evidence ?? [];

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const source = item.source || "Unassigned";
    acc[source] = acc[source] || [];
    acc[source].push(item);
    return acc;
  }, {});

  const sources = Object.keys(grouped);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">
          Evidence Graph
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Structured claims, risks, assumptions, recommendations, and evidence gaps grouped by source.
        </p>
      </div>

      {items.length === 0 && (
        <div className="card p-5">
          <p className="text-sm text-slate-400">
            No evidence extracted yet.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {sources.map((source) => {
          const sourceItems = grouped[source];

          return (
            <details key={source} className="card overflow-hidden">
              <summary className="cursor-pointer list-none p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#D8A84E]">
                      {source}
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-white">
                      {sourceItems.length} evidence item{sourceItems.length === 1 ? "" : "s"}
                    </h3>
                  </div>

                  <span className="rounded-full border border-[#233450] px-3 py-1 text-xs text-slate-300">
                    Expand
                  </span>
                </div>
              </summary>

              <div className="divide-y divide-[#233450] border-t border-[#233450]">
                {sourceItems.map((item) => (
                  <article key={item.id} className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[#101B2E] px-3 py-1 text-xs text-slate-300">
                        Reliability: {item.reliability}
                      </span>

                      <span className="text-xs text-slate-500">
                        {item.used_in_memo ? "Used in memo" : "Not used in memo"}
                      </span>
                    </div>

                    <p className="text-sm leading-7 text-slate-300">
                      {item.claim}
                    </p>
                  </article>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
