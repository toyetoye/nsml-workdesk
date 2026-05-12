import { notFound } from "next/navigation";
import { createTask } from "@/actions/tasks";
import { AgentOutputs } from "@/components/AgentOutputs";
import { ChiefOfStaffPanel } from "@/components/ChiefOfStaffPanel";
import { EvidencePanel } from "@/components/EvidencePanel";
import { ExecutiveMemoPanel } from "@/components/ExecutiveMemoPanel";
import { MemoryPanel } from "@/components/MemoryPanel";
import { ProjectWorkspaceTabs } from "@/components/ProjectWorkspaceTabs";
import { RedTeamPanel } from "@/components/RedTeamPanel";
import { TaskList } from "@/components/TaskList";
import { supabase } from "@/lib/supabase";

export default async function ProjectWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) {
    notFound();
  }

  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: true });

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8A84E]">
          Project Workspace
        </p>

        <h1 className="text-4xl font-bold text-white">
          {project.name}
        </h1>

        <p className="max-w-3xl text-lg leading-7 text-slate-300">
          {project.decision_question}
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-slate-400">Status</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {project.status}
          </p>
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

      <ProjectWorkspaceTabs
        sections={{
          Command: (
            <ChiefOfStaffPanel projectId={project.id} />
          ),

          Tasks: (
            <TaskList tasks={tasks ?? []} />
          ),

          Outputs: (
            <AgentOutputs projectId={project.id} />
          ),

          Evidence: (
            <EvidencePanel projectId={project.id} />
          ),

          "Red Team": (
            <RedTeamPanel projectId={project.id} />
          ),

          Memo: (
            <ExecutiveMemoPanel projectId={project.id} />
          ),

          Memory: (
            <MemoryPanel projectId={project.id} />
          ),

          Staff: (
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-white">
                Available Staff
              </h2>

              <div className="grid gap-3 md:grid-cols-2">
                {(agents ?? []).map((agent) => (
                  <article
                    key={agent.id}
                    className="card p-4"
                  >
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
          ),
        }}
      />

      <details className="card p-5">
        <summary className="cursor-pointer text-lg font-bold text-white">
          Manual Override / Add Task
        </summary>

        <form action={createTask} className="mt-5 space-y-4">
          <input
            type="hidden"
            name="project_id"
            value={project.id}
          />

          <input
            name="title"
            required
            placeholder="Task title"
            className="w-full rounded-2xl border border-[#233450] bg-[#101B2E] px-4 py-3 text-sm text-white outline-none"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <select
              name="assigned_agent"
              className="w-full rounded-2xl border border-[#233450] bg-[#101B2E] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">Unassigned</option>

              {(agents ?? []).map((agent) => (
                <option
                  key={agent.id}
                  value={agent.name}
                >
                  {agent.name}
                </option>
              ))}
            </select>

            <select
              name="priority"
              defaultValue="Medium"
              className="w-full rounded-2xl border border-[#233450] bg-[#101B2E] px-4 py-3 text-sm text-white outline-none"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary"
          >
            Add Task
          </button>
        </form>
      </details>
    </section>
  );
}
