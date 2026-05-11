"use server";

import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cleanJson(content: string) {
  return content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

export async function generateExecutiveMemo(formData: FormData) {
  const projectId = String(formData.get("project_id") || "").trim();

  if (!projectId) {
    throw new Error("Project ID is required.");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) {
    throw new Error("Project not found.");
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const { data: outputs } = await supabase
    .from("agent_outputs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const { data: evidence } = await supabase
    .from("evidence_items")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const prompt = `
You are the Executive Writer inside Staff OS.

Your job is to synthesize a decision-ready executive memo using ONLY the project data, task state, agent outputs, and evidence provided.

Project:
${project.name}

Decision Question:
${project.decision_question}

Project Status:
${project.status}

Confidence:
${project.confidence}

Tasks:
${JSON.stringify(tasks ?? [], null, 2)}

Agent Outputs:
${JSON.stringify(outputs ?? [], null, 2)}

Evidence Items:
${JSON.stringify(evidence ?? [], null, 2)}

Return ONLY valid JSON in this exact format:

{
  "recommendation": "Proceed | Do Not Proceed | Proceed With Conditions | Insufficient Evidence",
  "executive_summary": "string",
  "key_findings": ["string"],
  "critical_risks": ["string"],
  "assumptions": ["string"],
  "next_actions": ["string"],
  "confidence_assessment": "Low | Medium | High",
  "rationale": "string"
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content:
          "You are an elite executive writer producing concise, evidence-aware decision memos.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No memo generated.");
  }

  let memo: any;

  try {
    memo = JSON.parse(cleanJson(content));
  } catch {
    console.error(content);
    throw new Error("Executive Writer returned invalid JSON.");
  }

  const fullRationale = `
Executive Summary:
${memo.executive_summary}

Key Findings:
${(memo.key_findings ?? []).map((item: string) => `- ${item}`).join("\n")}

Assumptions:
${(memo.assumptions ?? []).map((item: string) => `- ${item}`).join("\n")}

Confidence Assessment:
${memo.confidence_assessment}

Rationale:
${memo.rationale}
`;

  const risksText = (memo.critical_risks ?? [])
    .map((item: string) => `- ${item}`)
    .join("\n");

  const nextActionsText = (memo.next_actions ?? [])
    .map((item: string) => `- ${item}`)
    .join("\n");

  const { error } = await supabase.from("decisions").insert({
    project_id: projectId,
    recommendation: memo.recommendation,
    rationale: fullRationale,
    risks: risksText,
    next_actions: nextActionsText,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}`);
}
