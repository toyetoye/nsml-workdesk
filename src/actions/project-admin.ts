"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export async function updateProject(formData: FormData) {
  const projectId = String(formData.get("project_id") || "");
  const name = String(formData.get("name") || "");
  const objective = String(formData.get("objective") || "");
  const decision_question = String(formData.get("decision_question") || "");
  const status = String(formData.get("status") || "idea");
  const confidence = String(formData.get("confidence") || "early");

  if (!projectId || !name || !decision_question) {
    throw new Error("Project ID, name, and decision question are required.");
  }

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      objective,
      decision_question,
      status,
      confidence,
    })
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/projects");
}

export async function deleteProject(projectId: string) {
  if (!projectId) {
    throw new Error("Project ID is required.");
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/projects");
  redirect("/projects");
}
