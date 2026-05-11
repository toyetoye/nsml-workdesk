"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export async function createTask(formData: FormData) {
  const projectId = String(formData.get("project_id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const assignedAgent = String(formData.get("assigned_agent") || "").trim();
  const priority = String(formData.get("priority") || "Medium").trim();

  if (!projectId || !title) {
    throw new Error("Project ID and task title are required.");
  }

  const { error } = await supabase.from("tasks").insert({
    project_id: projectId,
    title,
    assigned_agent: assignedAgent || null,
    priority,
    status: "To Investigate",
    confidence: "Low",
    evidence_count: 0,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
}
