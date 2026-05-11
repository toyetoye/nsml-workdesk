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

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">
          Evidence Graph
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Structured operational intelligence extracted from agent work.
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
        {items.map((item) => (
          <article key={item.id} className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full border border-[#233450] px-3 py-1 text-xs text-slate-300">
                {item.reliability}
              </span>

              <span className="text-xs text-slate-500">
                {item.source}
              </span>
            </div>

            <p className="text-sm leading-7 text-slate-300">
              {item.claim}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
