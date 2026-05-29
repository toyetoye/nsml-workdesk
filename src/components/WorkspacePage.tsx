import Link from "next/link";
import type { EmailThreadScope, ImportWorkspaceAssignment, WorkspaceSummary as WorkspaceSummaryData } from "@/lib/mock-data";
import { EmailWorkbench } from "@/components/EmailWorkbench";
import { WorkspaceSummary } from "@/components/WorkspaceSummary";
import { PageSectionTabs } from "@/components/PageSectionTabs";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getAiConfigStatus } from "@/lib/ai/config";
import { workspaceSectionsFor } from "@/components/navigation";
import {
  listCorrespondenceMessages,
  listCorrespondenceThreads,
  listCases,
  listDraftRedTeamReviews,
  listDraftResponses,
  listEvidence,
  listIntakeItems,
  listTimelineEvents,
} from "@/lib/persistence/repository";
import {
  mapEvidenceRowsToRecords,
  mapParsedCorrespondenceRowsToThreads,
  mapCaseRowsToRecords,
} from "@/lib/workbench-data";
import { resolveView } from "@/lib/navigation-view";

type SearchParamsValue =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined> | undefined>
  | undefined;

type WorkspaceView =
  | "overview"
  | "correspondence"
  | "cases"
  | "evidence"
  | "drafts"
  | "assurance-support";

const WORKSPACE_VIEWS: WorkspaceView[] = [
  "overview",
  "correspondence",
  "cases",
  "evidence",
  "drafts",
  "assurance-support",
];

// Maps the EmailThreadScope slug used by vessel pages to the
// ImportWorkspaceAssignment string saved on evidence / intake rows.
// This is the bridge between the two identity systems.
const SCOPE_TO_ASSIGNMENT: Partial<Record<EmailThreadScope, ImportWorkspaceAssignment>> = {
  "lng-portharcourt-ii": "LNG PORTHARCOURT II",
  "lpg-alfred-temile": "LPG ALFRED TEMILE",
  "lpg-alfred-temile-10": "LPG ALFRED TEMILE 10",
  "projects": "Projects",
  "other": "Other",
};

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
  const workspaceAssignment = SCOPE_TO_ASSIGNMENT[correspondenceScope];

  const [
    threadRows,
    messageRows,
    evidenceRows,
    caseRows,
    intakeRows,
    draftRows,
    reviewRows,
    timelineRows,
  ] = await Promise.all([
    listCorrespondenceThreads(),
    listCorrespondenceMessages(),
    // Scoped: evidence for this workspace only
    listEvidence(undefined, workspaceAssignment),
    // Scoped: cases for this workspace only
    listCases(correspondenceScope),
    // Scoped: intake items for this workspace only
    listIntakeItems(workspaceAssignment),
    listDraftResponses(),
    listDraftRedTeamReviews(),
    listTimelineEvents(),
  ]);

  const aiConfig = getAiConfigStatus();
  const evidenceRecords = mapEvidenceRowsToRecords(evidenceRows);
  const workspaceCases = mapCaseRowsToRecords(caseRows, timelineRows);

  // Correspondence scoped to this vessel/workspace
  const parsedThreads = mapParsedCorrespondenceRowsToThreads(threadRows, messageRows).filter(
    (thread) =>
      correspondenceScope === "import"
        ? thread.workspaceKey === "import" || thread.workspaceKey === "unclassified"
        : thread.workspaceKey === correspondenceScope,
  );

  const activeView = (await resolveView(searchParams, WORKSPACE_VIEWS, "overview")) as WorkspaceView;
  const isOverview = activeView === "overview";

  // Workspace-scoped draft counts
  const workspaceCaseIds = new Set(workspaceCases.map((c) => c.caseId));
  const workspaceDraftIds = new Set(
    draftRows
      .filter((d) => d.case_id && workspaceCaseIds.has(d.case_id))
      .map((d) => d.draft_id),
  );
  const reviewedDraftIds = new Set(reviewRows.map((r) => r.draft_id));
  const pendingDraftCount = draftRows.filter(
    (d) => workspaceDraftIds.has(d.draft_id) && !reviewedDraftIds.has(d.draft_id),
  ).length;

  // Live overview counts
  const latestThread = [...parsedThreads].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
  )[0];

  const pendingReplyCount = workspaceCases.filter(
    (c) => c.status === "Pending My Reply",
  ).length;

  const needsEvidenceCount = evidenceRecords.filter(
    (e) => e.storageState === "metadata-only" || e.parseStatus === "not parsed",
  ).length;

  const unclassifiedIntakeCount = intakeRows.filter(
    (r) => r.status === "unclassified",
  ).length;

  const overviewCards = [
    {
      label: "Open cases",
      count: workspaceCases.length,
      summary: "Cases are open in this workspace.",
    },
    {
      label: "Pending my reply",
      count: pendingReplyCount,
      summary: "Cases waiting on a response from you.",
    },
    {
      label: "Evidence items",
      count: evidenceRecords.length,
      summary: `${needsEvidenceCount} still need parsing or review.`,
    },
    {
      label: "Correspondence threads",
      count: parsedThreads.length,
      summary: latestThread
        ? `Latest: ${latestThread.subject}`
        : "No correspondence classified here yet.",
    },
    {
      label: "Intake items",
      count: intakeRows.length,
      summary: `${unclassifiedIntakeCount} unclassified, waiting to be routed.`,
    },
    {
      label: "Drafts pending review",
      count: pendingDraftCount,
      summary: "Workspace-linked drafts awaiting red-team review.",
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
        primaryAction={
          isOverview
            ? { href: `${workspace.href}?view=correspondence`, label: "Correspondence" }
            : undefined
        }
        secondaryActions={
          isOverview
            ? [
                { href: "/cases", label: "All Cases" },
                { href: "/drafts", label: "Drafts" },
              ]
            : []
        }
      />

      <PageSectionTabs sections={sections} activeKey={activeView} />

      {/* Overview: live counts grid */}
      {isOverview ? (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {overviewCards.map((card) => (
              <article key={card.label} className="card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{card.count}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.summary}</p>
              </article>
            ))}
          </section>
          <WorkspaceSummary workspace={workspace} compact />
        </>
      ) : null}

      {/* Correspondence: scoped to this vessel */}
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

      {/* Cases: scoped list for this vessel */}
      {activeView === "cases" ? (
        <section className="space-y-4">
          {workspaceCases.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-sm font-semibold text-slate-500">No cases for this workspace yet.</p>
              <p className="mt-1 text-sm text-slate-400">
                Cases are created from the <Link href="/cases" className="text-teal-700 hover:underline">Cases</Link> page and linked to a workspace on creation.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white overflow-hidden">
              {workspaceCases.map((c) => (
                <li key={c.caseId} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{c.summary}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge tone={c.status === "Pending My Reply" || c.status === "Decision Required" ? "warning" : c.status === "Needs Evidence" ? "danger" : "neutral"}>
                      {c.status}
                    </StatusBadge>
                    <Link
                      href="/cases"
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                    >
                      Open →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end">
            <Link
              href="/cases"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
            >
              Manage all cases →
            </Link>
          </div>
        </section>
      ) : null}

      {/* Evidence: scoped list for this vessel */}
      {activeView === "evidence" ? (
        <section className="space-y-4">
          {evidenceRecords.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-sm font-semibold text-slate-500">No evidence captured for this workspace yet.</p>
              <p className="mt-1 text-sm text-slate-400">
                Capture emails via <Link href="/import" className="text-teal-700 hover:underline">Import</Link> and assign them to this vessel.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white overflow-hidden">
              {evidenceRecords.map((e) => (
                <li key={e.evidenceId} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{e.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {e.source} · {new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      e.parseStatus === "parsed"
                        ? "accent"
                        : e.storageState === "metadata-only"
                          ? "neutral"
                          : "warning"
                    }
                  >
                    {e.parseStatus === "parsed" ? "Parsed" : e.storageState === "metadata-only" ? "Metadata only" : e.status}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          )}
          {unclassifiedIntakeCount > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {unclassifiedIntakeCount} intake item{unclassifiedIntakeCount === 1 ? "" : "s"} assigned to this workspace {unclassifiedIntakeCount === 1 ? "is" : "are"} still unclassified.{" "}
              <Link href="/import?view=manual" className="font-semibold underline">
                Finish routing →
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Drafts */}
      {activeView === "drafts" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <WorkspaceViewCallout
            title="Drafts for this workspace"
            description="Drafts are linked to cases. Cases in this workspace have their drafts tracked in the Drafts module."
            href="/drafts"
            actionLabel="Open Drafts"
            note={
              pendingDraftCount > 0
                ? `${pendingDraftCount} draft${pendingDraftCount === 1 ? "" : "s"} pending red-team review for this workspace.`
                : "No drafts pending review for this workspace."
            }
          />
          <WorkspaceViewCallout
            title="Need a draft?"
            description="Open a case from this workspace, then generate a draft from within the case context."
            href={`${workspace.href}?view=cases`}
            actionLabel="View workspace cases"
            note={`${workspaceCases.length} case${workspaceCases.length === 1 ? "" : "s"} in this workspace.`}
          />
        </section>
      ) : null}

      {/* Assurance support */}
      {activeView === "assurance-support" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <WorkspaceViewCallout
            title="Assurance support"
            description="Assurance signals, vessel support items, and engagement logs for this workspace are managed in the Assurance module."
            href="/assurance"
            actionLabel="Open Assurance"
            note="Filter by vessel inside Assurance to scope to this workspace."
          />
          <WorkspaceViewCallout
            title="Weekly pack"
            description="The weekly pack compiles open cases, pending replies, and flagged items across all workspaces."
            href="/assurance?view=weekly-pack"
            actionLabel="Open Weekly Pack"
            note="Use this workspace's cases and correspondence to populate the pack."
          />
        </section>
      ) : null}

      {isOverview ? (
        <section className="card p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Next step</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use the tabs above to move between correspondence, cases, evidence, drafts, and assurance support for this workspace.
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
      <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        {note}
      </p>
      <Link href={href} className="btn-secondary mt-4 inline-flex">
        {actionLabel}
      </Link>
    </article>
  );
}
