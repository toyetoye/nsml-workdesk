"use client";

import { useTransition } from "react";
import { runAllSpecialistAgents } from "@/actions/agents";

export function RunAllAgentsButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await runAllSpecialistAgents(projectId);
        });
      }}
      className="btn-secondary w-full md:w-auto"
    >
      {isPending ? "Running All Agents..." : "Run All Agents"}
    </button>
  );
}
