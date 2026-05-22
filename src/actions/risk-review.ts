"use server";

import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateRiskReview(projectId: string) {
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
    .limit(30);

  const { data: outputs } = await supabase
    .from("agent_outputs")
    .select("*")
    .eq("project_id", projectId)
    .limit(30);

  const { data: memos } = await supabase
    .from("decisions")
    .select("*")
    .eq("project_id", projectId)
    .limit(5);

  const evidenceText = (evidence ?? [])
    .map((item) => `Evidence: ${item.claim}`)
    .join("\n");

  const outputsText = (outputs ?? [])
    .map(
      (output) =>
        `Agent: ${output.agent_name}\n${output.output}`
    )
    .join("\n\n");

  const memoText = (memos ?? [])
    .map(
      (memo) =>
        `${memo.memo_title}\n${memo.rationale || memo.recommendation || ""}`
    )
    .join("\n\n");

  const prompt = `
You are the Strategic Risk and Contradiction Engine for NSML WorkDesk.

Your role:
Critically challenge the project's conclusions.

Project:
${project.name}

Decision Question:
${project.decision_question}

Evidence:
${evidenceText}

Agent Outputs:
${outputsText}

Executive Memos:
${memoText}

Tasks:
1. Identify operational risks
2. Detect contradictions between agents
3. Identify weak assumptions
4. Flag unsupported conclusions
5. Identify missing evidence
6. Assess overconfidence risks
7. Suggest validation priorities

Be highly critical and analytical.

Return:
- Strategic risks
- Contradictions
- Weak assumptions
- Validation priorities
`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_AGENT_MODEL || "gpt-5.4-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an elite operational risk, contradiction, and strategic challenge engine.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    max_completion_tokens: 1400,
  });

  const review =
    response.choices[0]?.message?.content ??
    "No review generated.";

  const { error } = await supabase
    .from("projects")
    .update({
      risk_summary: review,
      contradiction_summary: review,
    })
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/projects");
}
