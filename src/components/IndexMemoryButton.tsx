"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { indexProjectMemory } from "@/actions/memory";

export function IndexMemoryButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await indexProjectMemory(projectId);
          router.refresh();
        });
      }}
      className="btn-primary"
    >
      {isPending ? "Indexing..." : "Index Project Memory"}
    </button>
  );
}
