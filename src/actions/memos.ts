"use server";

import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { retrieveMemoryContext } from "@/lib/memory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cleanJson(content: string) {
  return content.replace(/```json/g, "").replace(/```/g, "").trim();
}

export async function generateExecutiveMemo(projectId: string) {
  if (!projectId) throw new Error("Project ID is required.");

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found.");

  const { data: tasks } = await supabase.from("tasks").select("*").eq("project_id", projectId);
  const { data: outputs } = await supabase.from("agent_outputs").select("*").eq("project_id", projectId);
  const { data: evidence } = await supabase.from("evidence_items").select("*").eq("project_id", projectId);

  const memoryContext = await retrieveMemoryContext({
    projectId,
    query: `${project.name} ${project.decision_question} executive memo decision risks recommendations`,
  });

  const prompt = `
You are the Executive Writer inside NSML WorkDesk.

Synthesize a decision-ready executive memo using:
- project data
- task state
- agent outputs
- evidence items
- relevant organizational memory

Do not overstate confidence. Distinguish evidence from assumptions.

Project:
${project.name}

Decision Question:
${project.decision_question}

Tasks:
${JSON.stringify(tasks ?? [], null, 2)}

Agent Outputs:
${JSON.stringify(outputs ?? [], null, 2)}

Evidence Items:
${JSON.stringify(evidence ?? [], null, 2)}

Relevant Organizational Memory:
${memoryContext}

Return ONLY valid JSON:

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

  console.log("[Memo] Starting executive memo generation");

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_AGENT_MODEL || "gpt-5.4-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an elite executive writer producing evidence-aware decision memos using institutional memory.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No memo generated.");

  const memo = JSON.parse(cleanJson(content));

  const rationale = `
Executive Summary:
${memo.executive_summary}

Key Findings:
${(memo.key_findings ?? []).map((x: string) => `- ${x}`).join("\n")}

Assumptions:
${(memo.assumptions ?? []).map((x: string) => `- ${x}`).join("\n")}

Confidence Assessment:
${memo.confidence_assessment}

Rationale:
${memo.rationale}
`;

  const risks = (memo.critical_risks ?? []).map((x: string) => `- ${x}`).join("\n");
  const nextActions = (memo.next_actions ?? []).map((x: string) => `- ${x}`).join("\n");

  const { error } = await supabase.from("decisions").insert({
    project_id: projectId,
    recommendation: memo.recommendation,
    rationale,
    risks,
    next_actions: nextActions,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/projects");
  revalidatePath("/drafts");
}
