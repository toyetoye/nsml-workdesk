"use client";

import { useState, useTransition } from "react";
import { deleteProject, updateProject } from "@/actions/project-admin";

type ProjectControlsProps = {
  project: {
    id: string;
    name: string;
    objective?: string | null;
    decision_question: string;
    status: string;
    confidence: string;
  };
};

export function ProjectControls({ project }: ProjectControlsProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  return (
    <section className="card p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D8A84E]">
            Project Controls
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Edit project details or delete this project.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="btn-secondary"
          >
            {open ? "Close Edit" : "Edit Project"}
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => {
              const confirmed = window.confirm(
                "Delete this project and all linked tasks, outputs, evidence, memos, and memory?"
              );

              if (!confirmed) return;

              startDeleteTransition(async () => {
                await deleteProject(project.id);
              });
            }}
            className="rounded-2xl border border-red-900/60 bg-red-950/40 px-4 py-3 font-semibold text-red-200 disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {open && (
        <form action={updateProject} className="mt-5 grid gap-3">
          <input type="hidden" name="project_id" value={project.id} />

          <label className="grid gap-2 text-sm text-slate-300">
            Project Name
            <input
              name="name"
              required
              defaultValue={project.name}
              className="rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-white outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            Objective
            <textarea
              name="objective"
              defaultValue={project.objective ?? ""}
              className="min-h-24 rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-white outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            Decision Question
            <textarea
              name="decision_question"
              required
              defaultValue={project.decision_question}
              className="min-h-24 rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-white outline-none"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">
              Status
              <select
                name="status"
                defaultValue={project.status}
                className="rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-white outline-none"
              >
                <option value="idea">Idea</option>
                <option value="researching">Researching</option>
                <option value="review">Review</option>
                <option value="decision-ready">Decision Ready</option>
                <option value="closed">Closed</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-300">
              Confidence
              <select
                name="confidence"
                defaultValue={project.confidence}
                className="rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-white outline-none"
              >
                <option value="early">Early</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <button className="btn-primary w-full md:w-fit">Save Changes</button>
        </form>
      )}
    </section>
  );
}
