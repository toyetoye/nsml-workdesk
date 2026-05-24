import { AssuranceWorkbench } from "@/components/AssuranceWorkbench";
import { PageSectionTabs } from "@/components/PageSectionTabs";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { WorkflowChecklist } from "@/components/WorkflowChecklist";
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

type AssuranceView = "overview" | "signals" | "support" | "engagement" | "weekly";

const assuranceViews: AssuranceView[] = ["overview", "signals", "support", "engagement", "weekly"];

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
  const activeView = (await resolveView(searchParams, assuranceViews, "overview")) as AssuranceView;
  const isOverview = activeView === "overview";
  const workbenchTab: "signals" | "support" | "engagement" | "weekly" =
    activeView === "signals"
      ? "signals"
      : activeView === "support"
        ? "support"
        : activeView === "engagement"
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
        context="Signals -> Support Items -> Engagements -> Weekly Pack"
        primaryAction={{ href: "/assurance?view=signals", label: "Signals" }}
        secondaryActions={[
          { href: "/cases", label: "Cases" },
          { href: "/drafts", label: "Drafts" },
          { href: "/settings/writing-style", label: "Writing Style" },
        ]}
        quickLinks={assuranceSections.map((section) => ({ href: section.href, label: section.label }))}
      />

      <PageSectionTabs sections={assuranceSections} activeKey={activeView} />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <article key={card.label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{card.count}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.summary}</p>
          </article>
        ))}
      </section>

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
        <WorkflowChecklist
          title="Assurance workflow"
          description="Capture the signal, attach evidence, convert broad feedback into vessel support items, and keep the weekly pack factual."
          note="Fact requires evidence links"
          collapsible
          compact
          defaultOpen={false}
          items={[
            {
              title: "Capture the assurance signal",
              description:
                "Record the source, the audience, the related vessel or department, and the evidence level before the concern is stored.",
              links: [
                { href: "/import", label: "Import" },
                { href: "/cases", label: "Cases" },
                { href: "/drafts", label: "Drafts" },
              ],
            },
            {
              title: "Request specifics and attach evidence",
              description:
                "Use the request-specifics prompt when feedback is broad or anonymous, then link the evidence before marking anything as Fact.",
              href: "/import",
              actionLabel: "Open Import",
            },
            {
              title: "Convert verified issues into tracked support",
              description:
                "When the vessel, issue, date, person, expected support, actual response, status, and close-out are clear, create the support item.",
              href: "/cases",
              actionLabel: "Open Cases",
            },
            {
              title: "Review the weekly evidence pack",
              description:
                "Use the deterministic weekly summary to see delivered support, escalations, blockers, engagements, and next week priorities.",
            },
            {
              title: "Keep the wording neutral",
              description:
                "If a concern is governance-related or still unverified, keep it reported and review the writing style or related source material before closing it out.",
              links: [
                { href: "/settings/writing-style", label: "Writing Style" },
                { href: "/dashboard", label: "Dashboard" },
              ],
            },
          ]}
        />
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
