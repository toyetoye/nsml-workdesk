import Link from "next/link";
import { createProject } from "@/actions/projects";
import { supabase } from "@/lib/supabase";

export default async function ProjectsPage() {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <section className="space-y-5">
        <h1 className="text-3xl font-bold text-white">Projects unavailable</h1>
        <pre className="whitespace-pre-wrap rounded-2xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-200">
          {JSON.stringify(error, null, 2)}
        </pre>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8A84E]">
          Projects
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white md:text-5xl">
          Command pipeline
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
          Create decision-led projects and assign your AI workforce to investigate,
          challenge, validate, and produce decision-ready outputs.
        </p>
      </header>

      <section className="card p-5">
        <h2 className="text-xl font-bold text-white">Create Project</h2>

        <form action={createProject} className="mt-5 grid gap-3">
          <input
            name="name"
            required
            placeholder="Project name"
            className="rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-sm text-white outline-none"
          />

          <textarea
            name="objective"
            placeholder="Project objective"
            className="min-h-24 rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-sm text-white outline-none"
          />

          <textarea
            name="decision_question"
            required
            placeholder="Decision question"
            className="min-h-24 rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-sm text-white outline-none"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <select
              name="status"
              defaultValue="idea"
              className="rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-sm text-white outline-none"
            >
              <option value="idea">Idea</option>
              <option value="researching">Researching</option>
              <option value="review">Review</option>
              <option value="decision-ready">Decision Ready</option>
              <option value="closed">Closed</option>
            </select>

            <select
              name="confidence"
              defaultValue="early"
              className="rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-sm text-white outline-none"
            >
              <option value="early">Early</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <button className="btn-primary w-full md:w-fit">Create Project</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Live Projects</h2>

        {(projects ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#233450] p-5 text-sm text-slate-400">
            No projects yet.
          </div>
        )}

        {(projects ?? []).map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="card block p-4 transition hover:-translate-y-0.5 hover:border-[#D8A84E]/50"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">{project.name}</h3>
              <span className="rounded-full border border-[#233450] px-3 py-1 text-xs text-slate-300">
                {project.status}
              </span>
            </div>

            <p className="text-sm leading-6 text-slate-300">
              {project.decision_question}
            </p>

            <p className="mt-3 text-xs text-slate-400">
              Confidence: {project.confidence}
            </p>
          </Link>
        ))}
      </section>
    </section>
  );
}