import { supabase } from "@/lib/supabase";

const columns = [
  "To Investigate",
  "Researching",
  "Review",
  "Validated",
  "Included in Memo",
];

export async function TaskBoard({ projectId }: { projectId: string }) {
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
  }

  const liveTasks = tasks ?? [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">Task Board</h2>
        <p className="mt-1 text-sm text-slate-400">
          Research tasks move from investigation to memo-backed decisions.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {columns.map((column) => {
          const columnTasks = liveTasks.filter((task) => task.status === column);

          return (
            <div
              key={column}
              className="rounded-2xl border border-[#233450] bg-[#101B2E] p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{column}</h3>
                <span className="rounded-full bg-[#142238] px-2 py-1 text-xs text-slate-400">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-2xl border border-[#233450] bg-[#142238] p-3"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold leading-5 text-white">
                        {task.title}
                      </h4>

                      <span className="rounded-full bg-[#08111F] px-2 py-1 text-[10px] text-[#D8A84E]">
                        {task.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      {task.assigned_agent || "Unassigned"}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Confidence: {task.confidence}</span>
                      <span>{task.evidence_count ?? 0} evidence</span>
                    </div>
                  </article>
                ))}

                {columnTasks.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#233450] p-4 text-center text-xs text-slate-500">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
