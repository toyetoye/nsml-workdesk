"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const decisionQuestion = String(formData.get("decision_question") || "").trim();
  const status = String(formData.get("status") || "Idea").trim();
  const confidence = String(formData.get("confidence") || "Early").trim();

  if (!name || !decisionQuestion) {
    throw new Error("Project name and decision question are required.");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      decision_question: decisionQuestion,
      status,
      confidence,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}
