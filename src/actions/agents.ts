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

export async function runChiefOfStaff(projectId: string, userCommand: string) {
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) {
    throw new Error("Project not found.");
  }

  const { data: agents } = await supabase.from("agents").select("*");

  const agentNames = agents?.map((agent) => agent.name).join(", ") ?? "";

  const memoryContext = await retrieveMemoryContext({
    projectId,
    query: `${project.name} ${project.decision_question} ${userCommand}`,
  });

  const prompt = `
You are the Chief of Staff for Staff OS.

Use organizational memory where relevant, but do not blindly copy it. Identify reusable lessons, prior risks, and similar project patterns.

Project:
${project.name}

Decision Question:
${project.decision_question}

User Command:
${userCommand}

Available Agents:
${agentNames}

Relevant Organizational Memory:
${memoryContext}

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
          "You are an elite Chief of Staff specializing in operational decomposition and institutional memory reuse.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  const tasks = JSON.parse(cleanJson(content || "[]"));

  const inserts = tasks.map((task: any) => ({
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

export async function runSpecialistAgent(taskId: string) {
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

  if (!project) {
    throw new Error("Project not found.");
  }

  const memoryContext = await retrieveMemoryContext({
    projectId: task.project_id,
    query: `${project.name} ${project.decision_question} ${task.title} ${task.assigned_agent}`,
  });

  const specialistPrompt = `
You are acting as:
${task.assigned_agent}

Project:
${project.name}

Decision Question:
${project.decision_question}

Task:
${task.title}

Relevant Organizational Memory:
${memoryContext}

Use memory to avoid repeating previous mistakes and to reuse useful prior lessons.

Produce:
- findings
- assumptions
- risks
- recommendations
- follow-up investigations

Return detailed operational analysis in markdown.
`;

  const specialistResponse = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content:
          "You are a world-class specialist advisor operating inside an institutional intelligence system.",
      },
      {
        role: "user",
        content: specialistPrompt,
      },
    ],
  });

  const output =
    specialistResponse.choices[0]?.message?.content ?? "No output generated.";

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

  const extractionResponse = await openai.chat.completions.create({
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

  const extractionContent = extractionResponse.choices[0]?.message?.content;

  let evidenceItems: any[] = [];

  try {
    evidenceItems = JSON.parse(cleanJson(extractionContent || "[]"));
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

export async function runAllSpecialistAgents(projectId: string) {
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .not("assigned_agent", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const runnableTasks = (tasks ?? []).filter((task) => {
    return Boolean(task.assigned_agent);
  });

  console.log(
    `[RunAllAgents] Running ${runnableTasks.length} tasks for project ${projectId}`
  );

  const results = [];

  for (const task of runnableTasks) {
    try {
      console.log(
        `[RunAllAgents] Running task ${task.id}: ${task.title}`
      );

      await runSpecialistAgent(task.id);

      results.push({
        taskId: task.id,
        status: "success",
      });
    } catch (error) {
      console.error(
        `[RunAllAgents] Failed task ${task.id}`,
        error
      );

      results.push({
        taskId: task.id,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log("[RunAllAgents] Results:", results);

  revalidatePath(`/projects/${projectId}`);

  return results;
}
