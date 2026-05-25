import { getAiConfigStatus } from "@/lib/ai/config";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { draftSections } from "@/components/navigation";
import { PageSectionTabs } from "@/components/PageSectionTabs";
import { getActiveWritingStyleProfile } from "@/lib/persistence/repository";
import {
  listCases,
  listDraftRedTeamReviews,
  listDraftResponses,
  listTimelineEvents,
} from "@/lib/persistence/repository";
import { mapCaseRowsToRecords } from "@/lib/workbench-data";
import { DraftsWorkbench } from "@/components/DraftsWorkbench";
import { resolveView } from "@/lib/navigation-view";

type SearchParamsValue = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined> | undefined> | undefined;

type DraftView = "overview" | "pending_red_team" | "passed" | "needs_evidence" | "rejected";

const draftViews: DraftView[] = ["overview", "pending_red_team", "passed", "needs_evidence", "rejected"];

export default async function DraftsPage({
  searchParams,
}: {
  searchParams?: SearchParamsValue;
}) {
  const [draftRows, reviewRows, caseRows, timelineRows, writingStyleProfile] = await Promise.all([
    listDraftResponses(),
    listDraftRedTeamReviews(),
    listCases(),
    listTimelineEvents(),
    getActiveWritingStyleProfile(),
  ]);
  const caseRecords = mapCaseRowsToRecords(caseRows, timelineRows);
  const caseTitles = new Map(caseRecords.map((item) => [item.caseId, item.title] as const));
  const aiConfig = getAiConfigStatus();
  const activeView = (await resolveView(searchParams, draftViews, "overview")) as DraftView;
  const isOverview = activeView === "overview";

  const reviewMap = new Map(reviewRows.map((review) => [review.draft_id, review] as const));
  const counts = {
    pending_red_team: draftRows.filter((draft) => !reviewMap.get(draft.draft_id)).length,
    passed: draftRows.filter((draft) => {
      const review = reviewMap.get(draft.draft_id);
      return review?.verdict === "pass" || review?.verdict === "pass_with_caution";
    }).length,
    needs_evidence: draftRows.filter((draft) => {
      const review = reviewMap.get(draft.draft_id);
      return review?.verdict === "needs_more_evidence" || draft.status === "needs_evidence";
    }).length,
    rejected: draftRows.filter((draft) => reviewMap.get(draft.draft_id)?.verdict === "reject").length,
  };

  const overviewCards = [
    {
      label: "Pending red-team",
      count: counts.pending_red_team,
      summary: "Drafts waiting for review before copy is possible.",
    },
    {
      label: "Passed",
      count: counts.passed,
      summary: "Reviewed drafts that cleared the gate.",
    },
    {
      label: "Needs evidence",
      count: counts.needs_evidence,
      summary: "Drafts that still need source support or clarification.",
    },
    {
      label: "Rejected",
      count: counts.rejected,
      summary: "Drafts held back by red-team findings.",
    },
  ];

  return (
    <section className="space-y-6">
      <StickyPageHeader
        eyebrow="Drafts"
        title="Draft workbench"
        description="Drafts are generated replies only. They stay pending red-team review until a review verdict says they can be copied."
        context={isOverview ? "Draft pending red-team -> Passed -> Needs evidence -> Rejected" : undefined}
        primaryAction={isOverview ? { href: "/cases", label: "Open Cases" } : undefined}
        secondaryActions={
          isOverview
            ? [
                { href: "/import", label: "Import" },
                { href: "/assurance", label: "Assurance" },
                { href: "/settings/writing-style", label: "Writing Style" },
              ]
            : []
        }
        quickLinks={isOverview ? draftSections.map((section) => ({ href: section.href, label: section.label })) : []}
      />

      <PageSectionTabs sections={draftSections} activeKey={activeView} />

      {isOverview ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <article key={card.label} className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{card.count}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.summary}</p>
            </article>
          ))}
        </section>
      ) : null}

      {isOverview ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="card p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Next best action</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Open Pending Red-Team</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Drafts stay review-gated. Use the status views to find the next review or evidence task before copying anything manually.
            </p>
          </article>

          <article className="card p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Quick links</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {draftSections.slice(1).map((section) => (
                <a
                  key={section.key}
                  href={section.href}
                  className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
                >
                  {section.label}
                </a>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {activeView !== "overview" ? (
        <DraftsWorkbench
          key={activeView}
          drafts={draftRows}
          initialReviews={reviewRows}
          caseTitles={caseTitles}
          aiConfig={aiConfig}
          writingStyleProfileName={writingStyleProfile.profile_name}
          initialView={activeView}
        />
      ) : null}
    </section>
  );
}
