import { AssuranceWorkbench } from "@/components/AssuranceWorkbench";
import { PageSectionTabs } from "@/components/PageSectionTabs";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { assuranceSections } from "@/components/navigation";
import { resolveView } from "@/lib/navigation-view";
import { isPersistenceAvailable } from "@/lib/persistence/client";
import {
  listAssuranceSignals,
  listCases,
  listEvidence,
  listVesselEngagementLogs,
  listVesselSupportItems,
} from "@/lib/persistence/repository";
import { mapEvidenceRowsToRecords } from "@/lib/workbench-data";

type SearchParamsValue = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined> | undefined> | undefined;

type AssuranceView = "overview" | "signals" | "support-items" | "engagement-log" | "weekly-pack";

const assuranceViews: AssuranceView[] = ["overview", "signals", "support-items", "engagement-log", "weekly-pack"];

export default async function AssurancePage({
  searchParams,
}: {
  searchParams?: SearchParamsValue;
}) {
  const [signalRows, supportRows, logRows, caseRows, evidenceRows] = await Promise.all([
    listAssuranceSignals(),
    listVesselSupportItems(),
    listVesselEngagementLogs(),
    listCases(),
    listEvidence(),
  ]);

  const evidenceRecords = mapEvidenceRowsToRecords(evidenceRows);
  const activeView = (await resolveView(searchParams, assuranceViews, "overview", {
    support: "support-items",
    engagement: "engagement-log",
    weekly: "weekly-pack",
  })) as AssuranceView;
  const isOverview = activeView === "overview";
  const workbenchTab: "signals" | "support" | "engagement" | "weekly" =
    activeView === "signals"
      ? "signals"
      : activeView === "support-items"
        ? "support"
        : activeView === "engagement-log"
          ? "engagement"
          : "weekly";

  const overviewCards = [
    {
      label: "Signals",
      count: signalRows.length,
      summary: "Broad support feedback and governance signals.",
    },
    {
      label: "Support items",
      count: supportRows.length,
      summary: "Tracked vessel support issues and follow-up actions.",
    },
    {
      label: "Engagement logs",
      count: logRows.length,
      summary: "Calls, visits, meetings, and coordination records.",
    },
    {
      label: "Weekly pack",
      count: signalRows.length > 0 || supportRows.length > 0 || logRows.length > 0 ? 1 : 0,
      summary: "Deterministic summary of delivered support and open blockers.",
    },
  ];

  return (
    <section className="space-y-6">
      <StickyPageHeader
        eyebrow="Assurance"
        title="Vessel assurance and governance tracker"
        description="Capture support feedback, vessel comments, audit notes, and governance signals as evidence-backed records. Keep the language neutral, track the actions, and avoid turning reported concerns into unsupported facts."
        context={isOverview ? "Signals -> Support Items -> Engagements -> Weekly Pack" : undefined}
        primaryAction={isOverview ? { href: "/assurance?view=signals", label: "Signals" } : undefined}
        secondaryActions={
          isOverview
            ? [
                { href: "/cases", label: "Cases" },
                { href: "/drafts", label: "Drafts" },
                { href: "/settings/writing-style", label: "Writing Style" },
              ]
            : []
        }
        quickLinks={
          isOverview ? assuranceSections.map((section) => ({ href: section.href, label: section.label })) : []
        }
      />

      <PageSectionTabs sections={assuranceSections} activeKey={activeView} />

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
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Start with Signals</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use the signals surface first, then request specifics, convert verified issues into support items, and finish with the weekly pack.
            </p>
          </article>

          <article className="card p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Quick links</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {assuranceSections.slice(1).map((section) => (
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
        <AssuranceWorkbench
          key={activeView}
          initialSignals={signalRows}
          initialSupportItems={supportRows}
          initialEngagementLogs={logRows}
          evidenceRecords={evidenceRecords}
          caseRows={caseRows}
          persistenceEnabled={isPersistenceAvailable()}
          initialTab={workbenchTab}
        />
      ) : null}
    </section>
  );
}
