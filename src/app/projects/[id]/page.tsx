import { notFound } from "next/navigation";
import { ProjectCommandCenter } from "@/components/ProjectCommandCenter";
import { supabase } from "@/lib/supabase";

export default async function ProjectWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) {
    notFound();
  }

  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: true });

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  const { count: outputCount } = await supabase
    .from("agent_outputs")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id);

  const { count: evidenceCount } = await supabase
    .from("evidence_items")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id);

  const { count: decisionCount } = await supabase
    .from("decisions")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id);

  const { count: memoryCount } = await supabase
    .from("memory_items")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id);

  return (
    <ProjectCommandCenter
      project={project}
      agents={agents ?? []}
      tasks={tasks ?? []}
      missionStats={{
        taskCount: tasks?.length ?? 0,
        outputCount: outputCount ?? 0,
        evidenceCount: evidenceCount ?? 0,
        decisionCount: decisionCount ?? 0,
        memoryCount: memoryCount ?? 0,
      }}
    />
  );
}
