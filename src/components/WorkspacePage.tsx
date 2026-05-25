import Link from "next/link";
import type { EmailThreadScope, WorkspaceSummary as WorkspaceSummaryData } from "@/lib/mock-data";
import { EmailWorkbench } from "@/components/EmailWorkbench";
import { WorkspaceSummary } from "@/components/WorkspaceSummary";
import { PageSectionTabs } from "@/components/PageSectionTabs";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { getAiConfigStatus } from "@/lib/ai/config";
import { workspaceSectionsFor } from "@/components/navigation";
import {
  listCorrespondenceMessages,
  listCorrespondenceThreads,
  listCases,
  listDraftRedTeamReviews,
  listDraftResponses,
  listEvidence,
  listTimelineEvents,
} from "@/lib/persistence/repository";
import { mapEvidenceRowsToRecords, mapParsedCorrespondenceRowsToThreads, mapCaseRowsToRecords } from "@/lib/workbench-data";

type SearchParamsValue = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined> | undefined> | undefined;

type WorkspaceView = "overview" | "correspondence" | "cases" | "evidence" | "drafts" | "assurance-support";

export async function WorkspacePage({
  workspace,
  correspondenceScope,
  correspondenceLabel,
  correspondenceDescription,
  emptyStateTitle,
  emptyStateMessage,
  searchParams,
}: {
  workspace: WorkspaceSummaryData;
  correspondenceScope: EmailThreadScope;
  correspondenceLabel: string;
  correspondenceDescription: string;
  emptyStateTitle: string;
  emptyStateMessage: string;
  searchParams?: SearchParamsValue;
}) {
  const [threadRows, messageRows, evidenceRows, caseRows, draftRows, reviewRows, timelineRows] = await Promise.all([
    listCorrespondenceThreads(),
    listCorrespondenceMessages(),
    listEvidence(),
    listCases(),
    listDraftResponses(),
    listDraftRedTeamReviews(),
    listTimelineEvents(),
  ]);
  const aiConfig = getAiConfigStatus();
  const evidenceRecords = mapEvidenceRowsToRecords(evidenceRows);
  const allCases = mapCaseRowsToRecords(caseRows, timelineRows);
  const parsedThreads = mapParsedCorrespondenceRowsToThreads(threadRows, messageRows).filter(
    (thread) =>
      correspondenceScope === "import"
        ? thread.workspaceKey === "import" || thread.workspaceKey === "unclassified"
        : thread.workspaceKey === correspondenceScope,
  );
  const activeView = (await resolveWorkspaceView(searchParams)) as WorkspaceView;
  const isOverview = activeView === "overview";
  const workspaceCases = allCases.filter((item) => item.workspaceKey === correspondenceScope);
  const workspaceDraftIds = new Set(
    draftRows
      .filter((draft) => {
        const linkedCaseId = draft.case_id;
        return linkedCaseId ? workspaceCases.some((item) => item.caseId === linkedCaseId) : false;
      })
      .map((draft) => draft.draft_id),
  );
  const reviewedDraftIds = new Set(reviewRows.map((review) => review.draft_id));
  const pendingDraftCount = draftRows.filter((draft) => workspaceDraftIds.has(draft.draft_id) && !reviewedDraftIds.has(draft.draft_id)).length;
  const latestThread = [...parsedThreads].sort(
    (left, right) => new Date(right.dateTime).getTime() - new Date(left.dateTime).getTime(),
  )[0];
  const overviewCards = [
    {
      label: "Open cases",
      count: workspace.openCases,
      summary: "Case work linked to this workspace.",
    },
    {
      label: "Urgent attention",
      count: workspace.pendingReplies + workspace.needsEvidence,
      summary: "Items that need the next safe action.",
    },
    {
      label: "Pending evidence / imports",
      count: workspace.needsEvidence,
      summary: "Items waiting on supporting material or classification.",
    },
    {
      label: "Drafts pending red-team",
      count: pendingDraftCount,
      summary: "Workspace-linked drafts waiting for copy review.",
    },
    {
      label: "Latest correspondence",
      count: latestThread ? 1 : 0,
      summary: latestThread
        ? `${latestThread.subject} | ${latestThread.status}`
        : "No correspondence has been classified here yet.",
    },
  ];
  const sections = workspaceSectionsFor(workspace.href);

  return (
    <section className="space-y-6">
      <StickyPageHeader
        eyebrow={`${workspace.type} Workspace`}
        title={workspace.name}
        description={workspace.description}
        context={isOverview ? "Overview first, details in child views" : undefined}
        primaryAction={isOverview ? { href: workspace.href, label: "Overview" } : undefined}
        secondaryActions={
          isOverview
            ? [
                { href: "/cases", label: "Cases" },
                { href: "/drafts", label: "Drafts" },
                { href: "/settings/writing-style", label: "Writing Style" },
              ]
            : []
        }
        quickLinks={isOverview ? sections.map((section) => ({ href: section.href, label: section.label })) : []}
      />

      <PageSectionTabs sections={sections} activeKey={activeView} />

      {isOverview ? (
        <>
          <WorkspaceSummary workspace={workspace} compact />

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {overviewCards.map((card) => (
              <article key={card.label} className="card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{card.count}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.summary}</p>
              </article>
            ))}
          </section>
        </>
      ) : null}

      {isOverview ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="card p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Key open items</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {workspace.focusAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  {area}
                </span>
              ))}
            </div>
          </article>

          <article className="card p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Quick links</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sections.slice(1).map((section) => (
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

      {activeView === "correspondence" ? (
        <EmailWorkbench
          scope={correspondenceScope}
          sectionLabel={correspondenceLabel}
          sectionDescription={correspondenceDescription}
          emptyStateTitle={emptyStateTitle}
          emptyStateMessage={emptyStateMessage}
          parsedThreads={parsedThreads}
          sourceEvidenceRecords={evidenceRecords}
          aiConfig={aiConfig}
          triageRedirectTo={workspace.href}
        />
      ) : null}

      {activeView === "cases" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <WorkspaceViewCallout
            title="Cases"
            description="Detailed case work happens on the Cases page. Use the overview here to decide whether this workspace needs a case handoff."
            href="/cases"
            actionLabel="Open Cases"
            note={`${workspace.openCases} open case${workspace.openCases === 1 ? "" : "s"} tracked in this workspace.`}
          />
          <WorkspaceViewCallout
            title="Related evidence"
            description="Cases and evidence are linked on the dedicated module pages so the workspace overview stays clean."
            href="/evidence"
            actionLabel="Open Evidence"
            note={`${workspace.needsEvidence} item${workspace.needsEvidence === 1 ? "" : "s"} still need evidence or review.`}
          />
        </section>
      ) : null}

      {activeView === "evidence" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <WorkspaceViewCallout
            title="Evidence"
            description="Evidence is staged and reviewed on the dedicated evidence page. Keep this workspace view high-level."
            href="/evidence"
            actionLabel="Open Evidence"
            note={`${workspace.needsEvidence} pending evidence item${workspace.needsEvidence === 1 ? "" : "s"} tracked here.`}
          />
          <WorkspaceViewCallout
            title="Import and intake"
            description="If evidence still needs parsing or routing, use Import to finish the capture path."
            href="/import"
            actionLabel="Open Import"
            note={`${workspace.pendingReplies} item${workspace.pendingReplies === 1 ? "" : "s"} need the next action.`}
          />
        </section>
      ) : null}

      {activeView === "drafts" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <WorkspaceViewCallout
            title="Drafts"
            description="Draft generation and red-team review stay on the Drafts page so the workspace stays focused on orientation."
            href="/drafts"
            actionLabel="Open Drafts"
            note={`${pendingDraftCount} draft${pendingDraftCount === 1 ? "" : "s"} are pending red-team in this workspace.`}
          />
          <WorkspaceViewCallout
            title="Writing style"
            description="If the wording needs a different tone, open Writing Style before generating the next draft."
            href="/settings/writing-style"
            actionLabel="Open Writing Style"
            note="Style calibration remains a separate, bounded setting."
          />
        </section>
      ) : null}

      {activeView === "assurance-support" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <WorkspaceViewCallout
            title="Assurance / Support"
            description="Signals, support items, and weekly summaries live on the Assurance page so the workspace page can stay an overview."
            href="/assurance"
            actionLabel="Open Assurance"
            note="Use the assurance tracker to request specifics, link evidence, and track actions."
          />
          <WorkspaceViewCallout
            title="Current context"
            description={workspace.description}
            href="/dashboard"
            actionLabel="Open Dashboard"
            note="The dashboard remains the overview hub for the whole workdesk."
          />
        </section>
      ) : null}

      {activeView === "overview" ? (
        <section className="card p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Summary</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use this workspace as the overview, then jump to correspondence, cases, evidence, drafts, or assurance support when the work needs detail.
          </p>
        </section>
      ) : null}
    </section>
  );
}

function WorkspaceViewCallout({
  title,
  description,
  href,
  actionLabel,
  note,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  note: string;
}) {
  return (
    <article className="card p-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{note}</p>
      <Link href={href} className="btn-secondary mt-4 inline-flex">
        {actionLabel}
      </Link>
    </article>
  );
}

async function resolveWorkspaceView(searchParams: SearchParamsValue) {
  const params = (await searchParams) ?? {};
  const rawView = params.view;
  const view = Array.isArray(rawView) ? rawView[0] : rawView;

  if (view === "correspondence" || view === "cases" || view === "evidence" || view === "drafts" || view === "assurance-support") {
    return view;
  }

  return "overview";
}
