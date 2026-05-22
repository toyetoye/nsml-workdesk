"use server";

import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { retrieveMemoryContext } from "@/lib/memory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runRedTeamReview(formData: FormData) {
  const projectId = String(formData.get("project_id") || "").trim();

  if (!projectId) {
    throw new Error("Project ID is required.");
  }

  const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
  const { data: tasks } = await supabase.from("tasks").select("*").eq("project_id", projectId);
  const { data: outputs } = await supabase.from("agent_outputs").select("*").eq("project_id", projectId);
  const { data: evidence } = await supabase.from("evidence_items").select("*").eq("project_id", projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  const memoryContext = await retrieveMemoryContext({
    projectId,
    query: `${project.name} ${project.decision_question} risks failures assumptions lessons`,
  });

  const prompt = `
You are the Red Team Critic inside NSML WorkDesk.

Challenge the project before a decision is made.

Project:
${project.name}

Decision Question:
${project.decision_question}

Tasks:
${JSON.stringify(tasks ?? [], null, 2)}

Agent Outputs:
${JSON.stringify(outputs ?? [], null, 2)}

Evidence:
${JSON.stringify(evidence ?? [], null, 2)}

Relevant Organizational Memory:
${memoryContext}

Produce a rigorous critique covering:
- weakest assumptions
- hidden risks
- missing evidence
- likely failure modes
- repeated patterns from memory
- what must be true before proceeding
- recommended safeguards

Return detailed markdown.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content:
          "You are a severe but constructive red-team reviewer using institutional memory to identify repeated risks.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const output =
    response.choices[0]?.message?.content || "No red-team review generated.";

  await supabase.from("agent_outputs").insert({
    project_id: projectId,
    agent_name: "Red Team Critic",
    output,
    confidence: "Medium",
  });

  await supabase.from("evidence_items").insert({
    project_id: projectId,
    claim: "[Risk] Memory-aware Red Team review completed. See Red Team Critic output for detailed challenge.",
    reliability: "Medium",
    source: "Red Team Critic",
    used_in_memo: false,
  });

  revalidatePath("/projects");
}
