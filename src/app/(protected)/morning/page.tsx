import { StickyPageHeader } from "@/components/StickyPageHeader";
import { MorningClient } from "./MorningClient";
import {
  listIntakeItems,
  listCases,
  listDraftResponses,
  listDraftRedTeamReviews,
} from "@/lib/persistence/repository";
import type { ImportIntakeStatus } from "@/lib/mock-data";

// Status priority for sort order
const STATUS_ORDER: Record<ImportIntakeStatus, number> = {
  "pending-my-reply": 0,
  "decision-required": 1,
  "needs-evidence": 2,
  "monitoring": 3,
  "waiting-on-vessel": 4,
  "waiting-on-vendor": 4,
  "waiting-on-class": 4,
  "waiting-on-management": 4,
  "unclassified": 5,
};

export default async function MorningPage() {
  const [intakeRows, caseRows, draftRows, reviewRows] = await Promise.all([
    listIntakeItems(),
    listCases(),
    listDraftResponses(),
    listDraftRedTeamReviews(),
  ]);

  // Active intake items sorted by urgency
  const activeItems = intakeRows
    .filter((r) => r.status !== "unclassified")
    .sort((a, b) => {
      const pa = STATUS_ORDER[a.status as ImportIntakeStatus] ?? 9;
      const pb = STATUS_ORDER[b.status as ImportIntakeStatus] ?? 9;
      if (pa !== pb) return pa - pb;
      return new Date(b.received_at).getTime() - new Date(a.received_at).getTime();
    });

  // Unclassified — needs routing
  const unclassifiedItems = intakeRows.filter((r) => r.status === "unclassified");

  // Draft counts
  const reviewedIds = new Set(reviewRows.map((r) => r.draft_id));
  const pendingDrafts = draftRows.filter((d) => !reviewedIds.has(d.draft_id));
  const failedDrafts = reviewRows.filter((r) => r.verdict === "reject");

  // Summary counts
  const needReply = activeItems.filter((r) => r.status === "pending-my-reply").length;
  const waiting = activeItems.filter((r) =>
    ["waiting-on-vessel", "waiting-on-vendor", "waiting-on-class", "waiting-on-management"].includes(r.status),
  ).length;
  const monitoring = activeItems.filter((r) => r.status === "monitoring").length;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="space-y-0">
      <StickyPageHeader
        eyebrow="NSML WorkDesk"
        title="Morning"
        description={
          needReply > 0
            ? `${needReply} item${needReply === 1 ? "" : "s"} need your reply today.`
            : "Nothing needs your reply right now."
        }
      />

      <MorningClient
        today={today}
        activeItems={activeItems.map((r) => ({
          id: r.intake_id,
          title: r.subject_title,
          from: r.sender_source,
          status: r.status as ImportIntakeStatus,
          workspace: r.workspace_assignment,
          receivedAt: r.received_at,
          routeNote: r.route_note ?? "",
        }))}
        unclassifiedCount={unclassifiedItems.length}
        pendingDraftCount={pendingDrafts.length}
        failedDraftCount={failedDrafts.length}
        needReply={needReply}
        waiting={waiting}
        monitoring={monitoring}
      />
    </section>
  );
}
