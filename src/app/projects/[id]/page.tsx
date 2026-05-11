import { notFound } from "next/navigation";
import { TaskBoard } from "@/components/TaskBoard";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import { supabase } from "@/lib/supabase";

export default async function ProjectWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8A84E]">
          Project Workspace
        </p>

        <h1 className="text-4xl font-bold text-white">{project.name}</h1>

        <p className="max-w-3xl text-lg leading-7 text-slate-300">
          {project.decision_question}
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-slate-400">Status</p>
          <p className="mt-2 text-2xl font-bold text-white">{project.status}</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-slate-400">Available Staff</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {(agents ?? []).length}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-slate-400">Confidence</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {project.confidence}
          </p>
        </div>
      </section>

      <WorkspaceTabs />

      <TaskBoard projectId={project.id} />

      <section className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#D8A84E]">
              Command
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              Chief of Staff
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Later this will generate workstreams, assign staff, and create tasks.
            </p>
          </div>

          <button className="btn-primary">Run Agent</button>
        </div>

        <textarea
          placeholder="What should we investigate first?"
          className="mt-5 min-h-[140px] w-full rounded-2xl border border-[#233450] bg-[#101B2E] p-4 text-sm text-white outline-none"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-white">Available Staff</h2>

        <div className="grid gap-3 md:grid-cols-2">
          {(agents ?? []).map((agent) => (
            <article key={agent.id} className="card p-4">
              <h3 className="text-lg font-semibold text-white">
                {agent.name}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {agent.role}
              </p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
