import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/lib/mock-data";

export default function Home() {
  return (
    <section className="space-y-7">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8A84E]">
          Staff OS
        </p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl">
          Your online AI workforce.
        </h1>

        <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
          Create projects, assign specialist staff, collect evidence, challenge assumptions,
          and produce decision-ready outputs.
        </p>
      </header>

      <div className="grid gap-3 md:max-w-md md:grid-cols-2">
        <Link href="/projects" className="btn-primary text-center">
          Start Project
        </Link>

        <Link href="/staff" className="btn-secondary text-center">
          View Staff
        </Link>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-slate-400">Active Projects</p>
          <p className="mt-2 text-3xl font-bold text-white">{projects.length}</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-slate-400">Core Staff</p>
          <p className="mt-2 text-3xl font-bold text-white">8</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-slate-400">Decision Focus</p>
          <p className="mt-2 text-3xl font-bold text-white">100%</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Active Projects</h2>
          <Link href="/projects" className="text-sm font-medium text-[#D8A84E]">
            View all
          </Link>
        </div>

        <div className="grid gap-3">
          {projects.slice(0, 2).map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>
      </section>
    </section>
  );
}