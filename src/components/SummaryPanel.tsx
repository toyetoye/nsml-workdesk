import { generateRiskReview } from "@/actions/risk-review";
import { generateExecutiveSynthesis } from "@/actions/synthesis";
import { supabase } from "@/lib/supabase";

type SummaryPanelProps = {
  projectId: string;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export async function SummaryPanel({
  projectId,
}: SummaryPanelProps) {
  const [
    projectResult,
    evidenceResult,
    outputsResult,
    decisionsResult,
    activityResult,
    tasksResult,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single(),

    supabase
      .from("evidence_items")
      .select("*")
      .eq("project_id", projectId)
      .limit(5),

    supabase
      .from("agent_outputs")
      .select("*")
      .eq("project_id", projectId)
      .limit(5),

    supabase
      .from("decisions")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1),

    supabase
      .from("activity_events")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(10),

    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId),
  ]);

  const project = projectResult.data;
  const evidence = evidenceResult.data ?? [];
  const outputs = outputsResult.data ?? [];
  const latestDecision = decisionsResult.data?.[0];
  const activities = activityResult.data ?? [];
  const tasks = tasksResult.data ?? [];

  const completedTasks = tasks.filter(
    (task) =>
      task.status === "Review" ||
      task.status === "Validated" ||
      task.status === "Included in Memo"
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completedTasks / tasks.length) * 100);

  return (
    <div className="space-y-5">
      <Section title="Decision Snapshot">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-[#101B2E] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Status
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {project?.status ?? "Unknown"}
            </p>
          </div>

          <div className="rounded-2xl bg-[#101B2E] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Confidence
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {project?.confidence ?? "Unknown"}
            </p>
          </div>

          <div className="rounded-2xl bg-[#101B2E] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Tasks
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {tasks.length}
            </p>
          </div>

          <div className="rounded-2xl bg-[#101B2E] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Completion
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {progress}%
            </p>
          </div>
        </div>
      </Section>

      <Section title="Executive Strategic Synthesis">

        <form action={generateExecutiveSynthesis.bind(null, projectId)}>
          <button className="btn-primary mb-5">
            Generate Strategic Synthesis
          </button>
        </form>

        {project?.executive_summary && (
          <div className="mb-6 rounded-2xl bg-[#101B2E] p-5">
            <div className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
              {project.executive_summary}
            </div>
          </div>
        )}

      </Section>

      <Section title="Executive Recommendation">
        {latestDecision ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#101B2E] p-4">
              <h3 className="text-lg font-semibold text-white">
                {latestDecision.memo_title ?? "Executive Memo"}
              </h3>

              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                {latestDecision.memo_body}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No executive memo generated yet.
          </p>
        )}
      </Section>

      <Section title="Top Evidence">
        <div className="space-y-3">
          {evidence.length === 0 && (
            <p className="text-sm text-slate-400">
              No evidence collected yet.
            </p>
          )}

          {evidence.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-[#101B2E] p-4"
            >
              <p className="font-semibold text-white">
                {item.claim ?? "Evidence"}
              </p>

              {item.source && (
                <p className="mt-2 text-xs text-[#D8A84E]">
                  {item.source}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Agent Conclusions">
        <div className="space-y-3">
          {outputs.length === 0 && (
            <p className="text-sm text-slate-400">
              No agent outputs yet.
            </p>
          )}

          {outputs.map((output) => (
            <div
              key={output.id}
              className="rounded-2xl bg-[#101B2E] p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">
                  {output.agent_name ?? "Agent"}
                </h3>

                <span className="rounded-full bg-[#142238] px-3 py-1 text-xs text-slate-300">
                  Output
                </span>
              </div>

              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                {output.output}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Operational Timeline">
        <div className="space-y-3">
          {activities.length === 0 && (
            <p className="text-sm text-slate-400">
              No activity yet.
            </p>
          )}

          {activities.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl bg-[#101B2E] p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">
                  {event.title}
                </p>

                <span className="text-xs text-slate-500">
                  {new Date(event.created_at).toLocaleString()}
                </span>
              </div>

              {event.detail && (
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {event.detail}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}