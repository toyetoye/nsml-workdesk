"use client";

import { useTransition } from "react";
import { runSpecialistAgent } from "@/actions/agents";

type Task = {
  id: string;
  title: string;
  assigned_agent: string;
  priority: string;
  status: string;
  confidence: string;
  evidence_count: number;
};

export function TaskList({
  tasks,
}: {
  tasks: Task[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">
          Task Inbox
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Operational workstreams assigned across your AI staff.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#233450] bg-[#101B2E]">
        <div className="grid grid-cols-12 border-b border-[#233450] bg-[#142238] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <div className="col-span-4">Task</div>
          <div className="col-span-2">Agent</div>
          <div className="col-span-1">Priority</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Evidence</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        <div className="divide-y divide-[#233450]">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="grid grid-cols-12 items-center px-4 py-4 text-sm"
            >
              <div className="col-span-4 pr-4">
                <p className="font-medium text-white">
                  {task.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Confidence: {task.confidence}
                </p>
              </div>

              <div className="col-span-2 text-slate-300">
                {task.assigned_agent}
              </div>

              <div className="col-span-1">
                <span className="rounded-full bg-[#142238] px-2 py-1 text-xs text-[#D8A84E]">
                  {task.priority}
                </span>
              </div>

              <div className="col-span-2 text-slate-300">
                {task.status}
              </div>

              <div className="col-span-1 text-slate-400">
                {task.evidence_count ?? 0}
              </div>

              <div className="col-span-2 flex justify-end">
                <button
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      await runSpecialistAgent(task.id);
                    });
                  }}
                  className="rounded-xl bg-[#D8A84E] px-3 py-2 text-xs font-semibold text-[#08111F] transition hover:opacity-90 disabled:opacity-50"
                >
                  Run Agent
                </button>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No tasks available.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
