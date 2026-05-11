import { IndexMemoryButton } from "@/components/IndexMemoryButton";
import { supabase } from "@/lib/supabase";

export async function MemoryPanel({
  projectId,
}: {
  projectId: string;
}) {
  const { data: memories } = await supabase
    .from("memory_items")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: recentMemories } = await supabase
    .from("memory_items")
    .select("*")
    .neq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <section className="space-y-4">
      <div className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#D8A84E]">
              Organizational Memory
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              Memory Index
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Converts project outputs, evidence, and decisions into reusable institutional memory.
            </p>
          </div>

          <IndexMemoryButton projectId={projectId} />
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-xl font-bold text-white">
          Current Project Memory
        </h3>

        {(memories ?? []).length === 0 && (
          <div className="card p-5">
            <p className="text-sm text-slate-400">
              No memory indexed yet. Click Index Project Memory.
            </p>
          </div>
        )}

        {(memories ?? []).map((memory) => (
          <article key={memory.id} className="card p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[#D8A84E]">
              {memory.source_type}
            </p>

            <h4 className="mt-1 font-bold text-white">
              {memory.title}
            </h4>

            <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-300">
              {memory.content}
            </p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-bold text-white">
          Recent Cross-Project Memory
        </h3>

        {(recentMemories ?? []).length === 0 && (
          <div className="card p-5">
            <p className="text-sm text-slate-400">
              No cross-project memory yet.
            </p>
          </div>
        )}

        {(recentMemories ?? []).map((memory) => (
          <article key={memory.id} className="card p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[#D8A84E]">
              {memory.source_type}
            </p>

            <h4 className="mt-1 font-bold text-white">
              {memory.title}
            </h4>

            <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-300">
              {memory.content}
            </p>
          </article>
        ))}
      </section>
    </section>
  );
}

