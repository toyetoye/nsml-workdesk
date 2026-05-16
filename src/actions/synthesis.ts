"use server";

import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateExecutiveSynthesis(projectId: string) {
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) {
    throw new Error("Project not found.");
  }

  const { data: evidence } = await supabase
    .from("evidence_items")
    .select("*")
    .eq("project_id", projectId)
    .limit(20);

  const { data: outputs } = await supabase
    .from("agent_outputs")
    .select("*")
    .eq("project_id", projectId)
    .limit(20);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId);

  const evidenceText = (evidence ?? [])
    .map((item) => `- ${item.claim}`)
    .join("\n");

  const outputsText = (outputs ?? [])
    .map(
      (output) =>
        `Agent: ${output.agent_name}\n${output.output}`
    )
    .join("\n\n");

  const tasksText = (tasks ?? [])
    .map(
      (task) =>
        `Task: ${task.title} | Status: ${task.status}`
    )
    .join("\n");

  const prompt = `
You are the Executive Strategic Synthesis layer of Staff OS.

Your task:
Generate a concise executive-level operational synthesis.

Project:
${project.name}

Decision Question:
${project.decision_question}

Objective:
${project.objective ?? "Not provided"}

Tasks:
${tasksText}

Evidence:
${evidenceText}

Agent Outputs:
${outputsText}

Produce:
1. Executive recommendation
2. Overall confidence
3. Major risks
4. Contradictions or unresolved assumptions
5. Operational blockers
6. Suggested next action

Keep it highly strategic and concise.
`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_AGENT_MODEL || "gpt-5.4-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an elite executive strategy and operational intelligence advisor.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_completion_tokens: 1200,
  });

  const synthesis =
    response.choices[0]?.message?.content ??
    "No synthesis generated.";

  const { error } = await supabase
    .from("projects")
    .update({
      executive_summary: synthesis,
    })
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}`);
}