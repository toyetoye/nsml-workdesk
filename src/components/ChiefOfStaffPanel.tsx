"use client";

import { useTransition } from "react";
import { runChiefOfStaff } from "@/actions/agents";

type Props = {
  projectId: string;
};

export function ChiefOfStaffPanel({ projectId }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
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
            Generate operational tasks automatically from the project brief.
          </p>
        </div>
      </div>

      <form
        className="mt-5 space-y-4"
        action={(formData) => {
          startTransition(async () => {
            const command = String(formData.get("command") || "");

            await runChiefOfStaff(projectId, command);
          });
        }}
      >
        <textarea
          name="command"
          required
          placeholder="Break this project into operational workstreams and assign the correct agents."
          className="min-h-[140px] w-full rounded-2xl border border-[#233450] bg-[#101B2E] p-4 text-sm text-white outline-none"
        />

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full md:w-auto"
        >
          {isPending ? "Chief of Staff Thinking..." : "Run Chief of Staff"}
        </button>
      </form>
    </section>
  );
}
