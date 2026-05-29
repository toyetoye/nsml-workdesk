import { CaseManagementWorkbench } from "@/components/CaseManagementWorkbench";
import { PageSectionTabs } from "@/components/PageSectionTabs";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { caseSections } from "@/components/navigation";
import { getAiConfigStatus } from "@/lib/ai/config";
import { hasEvidenceStorageConfig } from "@/lib/persistence/config";
import { isPersistenceAvailable } from "@/lib/persistence/client";
import { getActiveWritingStyleProfile } from "@/lib/persistence/repository";
import {
  listCases,
  listCorrespondenceMessages,
  listCorrespondenceThreads,
  listDraftRedTeamReviews,
  listDraftResponses,
  listEvidence,
  listTimelineEvents,
} from "@/lib/persistence/repository";
import {
  mapCaseRowsToRecords,
  mapEvidenceRowsToRecords,
  mapParsedCorrespondenceRowsToThreads,
} from "@/lib/workbench-data";
import { resolveView } from "@/lib/navigation-view";

type SearchParamsValue = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined> | undefined> | undefined;

type CaseView = "overview" | "active" | "evidence" | "correspondence" | "drafts";

const caseViews: CaseView[] = ["overview", "active", "evidence", "correspondence", "drafts"];

export default async function CasesPage({
  searchParams,
}: {
  searchParams?: SearchParamsValue;
}) {
  const [
    caseRows,
    timelineRows,
    evidenceRows,
    threadRows,
    messageRows,
    writingStyleProfile,
    draftRows,
    reviewRows,
  ] = await Promise.all([
    listCases(),
    listTimelineEvents(),
    listEvidence(),
    listCorrespondenceThreads(),
    listCorrespondenceMessages(),
    getActiveWritingStyleProfile(),
    listDraftResponses(),
    listDraftRedTeamReviews(),
  ]);
  const initialCases = mapCaseRowsToRecords(caseRows, timelineRows);
  const initialEvidence = mapEvidenceRowsToRecords(evidenceRows);
  const parsedCorrespondenceThreads = mapParsedCorrespondenceRowsToThreads(threadRows, messageRows);
  const aiConfig = getAiConfigStatus();
  const activeView = (await resolveView(searchParams, caseViews, "overview")) as CaseView;
  const isOverview = activeView === "overview";

  const reviewedDraftIds = new Set(reviewRows.map((review) => review.draft_id));
  const pendingRedTeamCount = draftRows.filter((draft) => !reviewedDraftIds.has(draft.draft_id)).length;
  const overviewCards = [
    {
      label: "Active cases",
      count: initialCases.length,
      summary: "Case work that needs decisions, evidence, or replies.",
    },
    {
      label: "Evidence",
      count: initialEvidence.length,
      summary: "Linked evidence waiting to support the case record.",
    },
    {
      label: "Correspondence",
      count: parsedCorrespondenceThreads.length,
      summary: "Parsed threads tied to the case trail.",
    },
    {
      label: "Drafts pending red-team",
      count: pendingRedTeamCount,
      summary: "Drafts still waiting for safe-to-copy review.",
    },
  ];

  return (
    <section className="space-y-6">
      <StickyPageHeader
        eyebrow="Cases"
        title="Case management workbench"
        description="A case is the working unit. Evidence and correspondence support the case while the operational work happens here."
        context={isOverview ? "Structure -> Link -> Decide -> Draft -> Review" : undefined}
        primaryAction={isOverview ? { href: "/cases?view=active", label: "Active Cases" } : undefined}
        secondaryActions={
          isOverview
            ? [
                { href: "/import", label: "Import" },
                { href: "/assurance", label: "Assurance" },
                { href: "/settings/writing-style", label: "Writing Style" },
              ]
            : []
        }
      />

      <PageSectionTabs sections={caseSections} activeKey={activeView} />

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
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Open the active case</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Cases are where the detailed work lives. Use the case workbench when evidence, correspondence, or drafting needs action.
            </p>
          </article>

          <article className="card p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Quick links</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {caseSections.slice(1).map((section) => (
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
        <CaseManagementWorkbench
          initialCases={initialCases}
          initialEvidence={initialEvidence}
          parsedCorrespondenceThreads={parsedCorrespondenceThreads}
          persistenceEnabled={isPersistenceAvailable()}
          parsingEnabled={hasEvidenceStorageConfig()}
          aiConfig={aiConfig}
          writingStyleProfileName={writingStyleProfile.profile_name}
        />
      ) : null}
    </section>
  );
}
