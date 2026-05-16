import { supabase } from "@/lib/supabase";

function formatRelativeTime(dateString: string) {
  const now = new Date().getTime();
  const then = new Date(dateString).getTime();

  const diffMinutes = Math.floor((now - then) / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);

  return `${diffDays}d ago`;
}

function getEventColor(eventType: string) {
  switch (eventType) {
    case "agent_run":
      return "bg-blue-500";
    case "task_created":
      return "bg-amber-500";
    case "evidence_added":
      return "bg-emerald-500";
    case "memo_generated":
      return "bg-purple-500";
    case "memory_saved":
      return "bg-pink-500";
    case "document_uploaded":
      return "bg-cyan-500";
    default:
      return "bg-slate-500";
  }
}

export async function ActivityFeed({
  projectId,
}: {
  projectId: string;
}) {
  const { data: events } = await supabase
    .from("activity_events")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <section className="space-y-5">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D8A84E]">
              Operational Feed
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              Activity Stream
            </h2>
          </div>

          <span className="rounded-full bg-[#101B2E] px-3 py-1 text-xs text-slate-300">
            {(events ?? []).length} events
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {(events ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#233450] p-5 text-sm text-slate-400">
            No activity yet.
          </div>
        )}

        {(events ?? []).map((event) => (
          <article
            key={event.id}
            className="card flex gap-4 p-4"
          >
            <div className="flex flex-col items-center">
              <div
                className={`h-3 w-3 rounded-full ${getEventColor(
                  event.event_type
                )}`}
              />

              <div className="mt-2 w-px flex-1 bg-[#233450]" />
            </div>

            <div className="flex-1">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-semibold text-white">
                    {event.title}
                  </h3>

                  {event.detail && (
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {event.detail}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-slate-500">
                  <p>{formatRelativeTime(event.created_at)}</p>

                  {event.actor && (
                    <p className="mt-1 text-slate-400">
                      {event.actor}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
