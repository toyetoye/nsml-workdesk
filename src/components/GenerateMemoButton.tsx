"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { generateExecutiveMemo } from "@/actions/memos";

export function GenerateMemoButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await generateExecutiveMemo(projectId);
          router.refresh();
        });
      }}
      className="btn-primary"
    >
      {isPending ? "Generating Memo..." : "Generate Memo"}
    </button>
  );
}
