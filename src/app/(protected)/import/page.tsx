import { BulkEvidenceIntakePanel } from "@/components/BulkEvidenceIntakePanel";
import { EmailWorkbench } from "@/components/EmailWorkbench";
import { ImportIntakeWorkbench } from "@/components/ImportIntakeWorkbench";
import { PageSectionTabs } from "@/components/PageSectionTabs";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { importSections } from "@/components/navigation";
import { getAiConfigStatus } from "@/lib/ai/config";
import { hasEvidenceStorageConfig } from "@/lib/persistence/config";
import { isPersistenceAvailable } from "@/lib/persistence/client";
import { getActiveWritingStyleProfile } from "@/lib/persistence/repository";
import {
  listBulkEvidenceBatchItems,
  listBulkEvidenceBatches,
  listCorrespondenceMessages,
  listCorrespondenceThreads,
  listEvidence,
  listIntakeItems,
} from "@/lib/persistence/repository";
import { importWorkspaceAssignments } from "@/lib/mock-data";
import {
  mapEvidenceRowsToRecords,
  mapIntakeRowsToItems,
  mapParsedCorrespondenceRowsToThreads,
} from "@/lib/workbench-data";
import { resolveView } from "@/lib/navigation-view";

type SearchParamsValue = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined> | undefined> | undefined;

type ImportView = "overview" | "manual" | "bulk" | "parsed" | "route-link";

const importViews: ImportView[] = ["overview", "manual", "bulk", "parsed", "route-link"];

export default async function ImportPage({
  searchParams,
}: {
  searchParams?: SearchParamsValue;
}) {
  const [
    intakeRows,
    evidenceRows,
    threadRows,
    messageRows,
    writingStyleProfile,
    bulkBatches,
    bulkBatchItems,
  ] = await Promise.all([
    listIntakeItems(),
    listEvidence(),
    listCorrespondenceThreads(),
    listCorrespondenceMessages(),
    getActiveWritingStyleProfile(),
    listBulkEvidenceBatches(),
    listBulkEvidenceBatchItems(),
  ]);
  const initialItems = mapIntakeRowsToItems(intakeRows);
  const initialEvidence = mapEvidenceRowsToRecords(evidenceRows);
  const parsedThreads = mapParsedCorrespondenceRowsToThreads(threadRows, messageRows);
  const aiConfig = getAiConfigStatus();
  const activeView = (await resolveView(searchParams, importViews, "overview", {
    route: "route-link",
  })) as ImportView;
  const isOverview = activeView === "overview";

  const overviewCards = [
    {
      label: "Manual intake items",
      count: initialItems.length,
      summary: "Pasted emails and manual notes waiting to be structured.",
    },
    {
      label: "Bulk evidence batches",
      count: bulkBatches.length,
      summary: "ZIP-of-EMLs, PST preservation, and batch tracking.",
    },
    {
      label: "Parsed threads",
      count: parsedThreads.length,
      summary: "Imported correspondence ready for review or routing.",
    },
    {
      label: "Route targets",
      count: importWorkspaceAssignments.length,
      summary: "Import, vessels, projects, other, and assurance destinations.",
    },
  ];

  return (
    <section className="space-y-6">
      <StickyPageHeader
        eyebrow="Import"
        title="Capture and intake"
        description="Start with capture, then structure imported material, link it to the right workstream, and keep the next safe action obvious."
        context="Capture -> Structure -> Link"
        primaryAction={{ href: "/import?view=manual", label: "Capture" }}
        secondaryActions={[
          { href: "/cases", label: "Cases" },
          { href: "/assurance", label: "Assurance" },
          { href: "/drafts", label: "Drafts" },
        ]}
        quickLinks={importSections.map((section) => ({ href: section.href, label: section.label }))}
      />

      <PageSectionTabs sections={importSections} activeKey={activeView} />

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
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Choose the intake path</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use Manual Intake for urgent pasted material, Bulk Evidence Intake for exported EML batches, Parsed Threads for review, or Route / Link when the item needs assignment.
            </p>
          </article>

          <article className="card p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Shortcuts</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {importSections.slice(1).map((section) => (
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

      {activeView === "manual" ? (
        <section id="capture" className="space-y-4">
          <ImportIntakeWorkbench
            initialItems={initialItems}
            initialEvidence={initialEvidence}
            persistenceEnabled={isPersistenceAvailable()}
            aiConfig={aiConfig}
            writingStyleProfileName={writingStyleProfile.profile_name}
          />
        </section>
      ) : null}

      {activeView === "bulk" ? (
        <section id="bulk-import">
          <BulkEvidenceIntakePanel
            key={bulkBatches.map((batch) => batch.batch_id).join("|") || "bulk-batches-empty"}
            initialBatches={bulkBatches}
            initialBatchItems={bulkBatchItems}
            persistenceEnabled={isPersistenceAvailable()}
            evidenceStorageEnabled={hasEvidenceStorageConfig()}
            manualIntakeHref="/import?view=manual#capture"
          />
        </section>
      ) : null}

      {activeView === "parsed" ? (
        <section id="parsed-threads">
          <EmailWorkbench
            scope="import"
            sectionLabel="Imported Correspondence Viewer"
            sectionDescription="Imported and unclassified threads appear here for review after intake. This is a correspondence viewer, not a mail client."
            emptyStateTitle="No imported threads yet"
            emptyStateMessage="Imported correspondence waiting for classification will appear here after it enters staging."
            parsedThreads={parsedThreads}
            sourceEvidenceRecords={initialEvidence}
            aiConfig={aiConfig}
            triageRedirectTo="/import"
          />
        </section>
      ) : null}

      {activeView === "route-link" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="card p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Route / Link</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Choose the destination</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use the imported item to decide whether the work belongs in correspondence, a case, assurance, or a drafting path.
            </p>
          </article>

          <article className="card p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Quick links</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { href: "/cases", label: "Cases" },
                { href: "/assurance", label: "Assurance" },
                { href: "/drafts", label: "Drafts" },
                { href: "/settings/writing-style", label: "Writing Style" },
                { href: "/vessels/lng-portharcourt-ii", label: "LNG Port Harcourt II" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {activeView === "overview" ? (
        <section className="card p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Overview</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Capture stays on this page, but the detailed surfaces live in the manual, bulk, parsed, and route child views.
          </p>
        </section>
      ) : null}
    </section>
  );
}
