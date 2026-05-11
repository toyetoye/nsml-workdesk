"use server";

import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runChiefOfStaff(
  projectId: string,
  userCommand: string
) {
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  const { data: agents } = await supabase
    .from("agents")
    .select("*");

  const agentNames =
    agents?.map((agent) => agent.name).join(", ") ?? "";

  const prompt = `
You are the Chief of Staff for an operational intelligence platform.

Project:
${project?.name}

Decision Question:
${project?.decision_question}

User Command:
${userCommand}

Available Agents:
${agentNames}

Generate between 5 and 8 operational tasks.

Return ONLY valid JSON:

[
  {
    "title": "string",
    "assigned_agent": "string",
    "priority": "Low | Medium | High | Critical",
    "rationale": "string"
  }
]
`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content:
          "You are an elite Chief of Staff specializing in operational decomposition.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  let tasks: any[] = [];

  try {
    tasks = JSON.parse(content || "[]");
  } catch {
    console.error(content);
    throw new Error("Chief of Staff returned invalid JSON.");
  }

  const inserts = tasks.map((task) => ({
    project_id: projectId,
    title: task.title,
    assigned_agent: task.assigned_agent,
    priority: task.priority || "Medium",
    status: "To Investigate",
    confidence: "Low",
    evidence_count: 0,
  }));

  await supabase.from("tasks").insert(inserts);

  revalidatePath(`/projects/${projectId}`);
}

export async function runSpecialistAgent(
  taskId: string
) {
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (!task) {
    throw new Error("Task not found.");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", task.project_id)
    .single();

  const specialistPrompt = `
You are acting as:
${task.assigned_agent}

Project:
${project?.name}

Decision Question:
${project?.decision_question}

Task:
${task.title}

Produce:
- findings
- assumptions
- risks
- recommendations
- follow-up investigations

Return detailed operational analysis in markdown.
`;

  const specialistResponse =
    await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "You are a world-class specialist advisor operating inside an elite operational intelligence platform.",
        },
        {
          role: "user",
          content: specialistPrompt,
        },
      ],
    });

  const output =
    specialistResponse.choices[0]?.message?.content ??
    "No output generated.";

  await supabase.from("agent_outputs").insert({
    project_id: task.project_id,
    agent_name: task.assigned_agent,
    output,
    confidence: "Medium",
  });

  const extractionPrompt = `
Extract operational intelligence from this report.

Return ONLY valid JSON array.

Format:

[
  {
    "claim": "string",
    "reliability": "Low | Medium | High",
    "type": "Claim | Risk | Assumption | Recommendation | Evidence Gap"
  }
]

Report:
${output}
`;

  const extractionResponse =
    await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "You extract structured operational intelligence from reports.",
        },
        {
          role: "user",
          content: extractionPrompt,
        },
      ],
    });

  const extractionContent =
    extractionResponse.choices[0]?.message?.content;

  let evidenceItems: any[] = [];

  try {
    evidenceItems = JSON.parse(extractionContent || "[]");
  } catch {
    console.error(extractionContent);
    evidenceItems = [];
  }

  if (evidenceItems.length > 0) {
    await supabase.from("evidence_items").insert(
      evidenceItems.map((item) => ({
        project_id: task.project_id,
        claim: `[${item.type}] ${item.claim}`,
        reliability: item.reliability || "Medium",
        source: task.assigned_agent,
        used_in_memo: false,
      }))
    );
  }

  await supabase
    .from("tasks")
    .update({
      status: "Review",
      confidence: "Medium",
      evidence_count: evidenceItems.length,
    })
    .eq("id", taskId);

  revalidatePath(`/projects/${task.project_id}`);
}
