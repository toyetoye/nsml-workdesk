"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export async function indexProjectMemory(projectId: string) {
  if (!projectId) throw new Error("Project ID is required.");

  const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (!project) throw new Error("Project not found.");

  const { data: outputs } = await supabase.from("agent_outputs").select("*").eq("project_id", projectId);
  const { data: evidence } = await supabase.from("evidence_items").select("*").eq("project_id", projectId);
  const { data: decisions } = await supabase.from("decisions").select("*").eq("project_id", projectId);

  const memoryItems = [
    {
      project_id: projectId,
      source_type: "project",
      source_id: project.id,
      title: `Project Brief: ${project.name}`,
      content: `Decision Question: ${project.decision_question}\nStatus: ${project.status}\nConfidence: ${project.confidence}`,
      tags: ["project", "brief"],
    },
    ...(outputs ?? []).map((output) => ({
      project_id: projectId,
      source_type: "agent_output",
      source_id: output.id,
      title: `${output.agent_name} Output - ${project.name}`,
      content: output.output,
      tags: ["agent_output", output.agent_name],
    })),
    ...(evidence ?? []).map((item) => ({
      project_id: projectId,
      source_type: "evidence",
      source_id: item.id,
      title: `Evidence - ${project.name}`,
      content: `${item.claim}\nReliability: ${item.reliability}\nSource: ${item.source}`,
      tags: ["evidence", item.reliability],
    })),
    ...(decisions ?? []).map((decision) => ({
      project_id: projectId,
      source_type: "decision",
      source_id: decision.id,
      title: `Decision Memo - ${project.name}`,
      content: `Recommendation: ${decision.recommendation}\n\nRationale:\n${decision.rationale}\n\nRisks:\n${decision.risks}\n\nNext Actions:\n${decision.next_actions}`,
      tags: ["decision", "memo"],
    })),
  ];

  if (memoryItems.length > 0) {
    const { error } = await supabase.from("memory_items").insert(memoryItems);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/projects");
}
