import Link from "next/link";
import { createProject } from "@/actions/projects";
import { supabase } from "@/lib/supabase";

export default async function ProjectsPage() {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
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
          validate, and execute.
        </p>
      </header>

      <form action={createProject} className="card space-y-4 p-5">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#D8A84E]">
            New Project
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            Frame the decision
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">
              Project name
            </span>
            <input
              name="name"
              required
              placeholder="e.g. Solar Installer Data Platform"
              className="w-full rounded-2xl border border-[#233450] bg-[#101B2E] px-4 py-3 text-sm text-white outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">
              Status
            </span>
            <select
              name="status"
              defaultValue="Idea"
              className="w-full rounded-2xl border border-[#233450] bg-[#101B2E] px-4 py-3 text-sm text-white outline-none"
            >
              <option>Idea</option>
              <option>Scoping</option>
              <option>Researching</option>
              <option>Review</option>
              <option>Validated</option>
            </select>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">
            Decision question
          </span>
          <textarea
            name="decision_question"
            required
            placeholder="Should we build this? What must be true for this project to proceed?"
            className="min-h-[110px] w-full rounded-2xl border border-[#233450] bg-[#101B2E] px-4 py-3 text-sm text-white outline-none"
          />
        </label>

        <label className="block space-y-2 md:max-w-xs">
          <span className="text-sm font-medium text-slate-300">
            Confidence
          </span>
          <select
            name="confidence"
            defaultValue="Early"
            className="w-full rounded-2xl border border-[#233450] bg-[#101B2E] px-4 py-3 text-sm text-white outline-none"
          >
            <option>Early</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>

        <button type="submit" className="btn-primary w-full md:w-auto">
          Create Project
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-white">Live Projects</h2>

        <div className="grid gap-3">
          {(projects ?? []).map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="card block p-4 transition hover:-translate-y-0.5 hover:border-[#D8A84E]/50"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">
                  {project.name}
                </h3>
                <span className="shrink-0 rounded-full border border-[#233450] px-3 py-1 text-xs text-slate-300">
                  {project.status}
                </span>
              </div>

              <p className="text-sm leading-6 text-slate-300">
                {project.decision_question}
              </p>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Live database project</span>
                <span>Confidence: {project.confidence}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
