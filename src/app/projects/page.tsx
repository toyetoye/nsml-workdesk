import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/lib/mock-data";

export default function ProjectsPage() {
  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8A84E]">
          Projects
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white md:text-5xl">
          Command pipeline
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
          Each project is framed around a decision question, then assigned to your
          specialist staff for research, challenge, and execution planning.
        </p>
      </header>

      <button className="btn-primary w-full md:w-auto">+ Create Project</button>

      <div className="grid gap-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </div>
    </section>
  );
}