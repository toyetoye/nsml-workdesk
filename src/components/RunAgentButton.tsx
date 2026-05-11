"use client";

import { useTransition } from "react";
import { runSpecialistAgent } from "@/actions/agents";

type Props = {
  taskId: string;
  agentName: string;
};

export function RunAgentButton({
  taskId,
  agentName,
}: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await runSpecialistAgent(taskId);
        });
      }}
      disabled={isPending}
      className="mt-3 w-full rounded-xl bg-[#D8A84E] px-3 py-2 text-xs font-semibold text-[#08111F] transition hover:opacity-90 disabled:opacity-50"
    >
      {isPending
        ? "Running..."
        : `Run ${agentName}`}
    </button>
  );
}
