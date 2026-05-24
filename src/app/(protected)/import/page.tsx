import { BulkEvidenceIntakePanel } from "@/components/BulkEvidenceIntakePanel";
import { EmailWorkbench } from "@/components/EmailWorkbench";
import { EvidenceStorageWorkbench } from "@/components/EvidenceStorageWorkbench";
import { ImportIntakeWorkbench } from "@/components/ImportIntakeWorkbench";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { WorkflowChecklist } from "@/components/WorkflowChecklist";
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
import {
  mapEvidenceRowsToRecords,
  mapIntakeRowsToItems,
  mapParsedCorrespondenceRowsToThreads,
} from "@/lib/workbench-data";

export default async function ImportPage() {
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

  return (
    <section className="space-y-6">
      <StickyPageHeader
        eyebrow="Import"
        title="Capture and intake"
        description="Start with capture, then structure imported material, link it to the right workstream, and keep the next safe action obvious."
        context="Capture → Structure → Link"
        primaryAction={{ href: "#capture", label: "Capture" }}
        secondaryActions={[
          { href: "/cases", label: "Cases" },
          { href: "/assurance", label: "Assurance" },
          { href: "/drafts", label: "Drafts" },
        ]}
        quickLinks={[
          { href: "#capture", label: "Capture" },
          { href: "#bulk-import", label: "Bulk Import" },
          { href: "#parsed-threads", label: "Review Parsed Threads" },
          { href: "#route-link", label: "Route / Link" },
        ]}
      />

      <WorkflowChecklist
        title="Import flow"
        description="Start with intake, stage evidence, then decide whether the item belongs in correspondence, a case, or a draft path."
        note="AI and persistence may fall back"
        collapsible
        compact
        defaultOpen={false}
        items={[
          {
            title: "Stage the item",
            description:
              "Paste a note or email, or save a manual intake record so the source material is captured first.",
          },
          {
            title: "Upload or parse evidence",
            description:
              "Attach private files here, then parse EML metadata only when the file is eligible.",
          },
          {
            title: "Move the work forward",
            description:
              "Use workspace correspondence, cases, drafts, and writing style settings to keep the response path coherent.",
            links: [
              { href: "/vessels/lng-portharcourt-ii", label: "LNG PORTHARCOURT II" },
              { href: "/vessels/lpg-alfred-temile", label: "LPG ALFRED TEMILE" },
              { href: "/vessels/lpg-alfred-temile-10", label: "LPG ALFRED TEMILE 10" },
              { href: "/projects", label: "Projects" },
              { href: "/other", label: "Other" },
              { href: "/cases", label: "Cases" },
              { href: "/assurance", label: "Assurance" },
              { href: "/drafts", label: "Drafts" },
              { href: "/settings/writing-style", label: "Writing Style" },
            ],
          },
        ]}
      />

      <section id="capture" className="space-y-4">
        <ImportIntakeWorkbench
          initialItems={initialItems}
          initialEvidence={initialEvidence}
          persistenceEnabled={isPersistenceAvailable()}
          aiConfig={aiConfig}
          writingStyleProfileName={writingStyleProfile.profile_name}
        />
      </section>

      <CollapsibleSection
        title="Bulk Evidence Intake"
        description="ZIP-of-EMLs, selected EML upload, PST preservation, and manual fallback stay visible here without dominating the first viewport."
        summaryBadge={<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{bulkBatches.length} batch{bulkBatches.length === 1 ? "" : "es"}</span>}
        defaultOpen={false}
        className="overflow-hidden"
        bodyClassName="p-4 pt-0"
      >
        <section id="bulk-import">
          <BulkEvidenceIntakePanel
            key={bulkBatches.map((batch) => batch.batch_id).join("|") || "bulk-batches-empty"}
            initialBatches={bulkBatches}
            initialBatchItems={bulkBatchItems}
            persistenceEnabled={isPersistenceAvailable()}
            evidenceStorageEnabled={hasEvidenceStorageConfig()}
            manualIntakeHref="#manual-intake"
          />
        </section>
      </CollapsibleSection>

      <CollapsibleSection
        title="Evidence storage"
        description="Private file storage and parsing placeholders remain visible here when you need to stage or inspect evidence."
        defaultOpen={false}
        className="overflow-hidden"
        bodyClassName="p-4 pt-0"
      >
        <EvidenceStorageWorkbench
          initialEvidence={initialEvidence}
          persistenceEnabled={isPersistenceAvailable()}
          parsingEnabled={hasEvidenceStorageConfig()}
          mode="import"
          defaultWorkspaceAssignment="Import/Staging"
        />
      </CollapsibleSection>

      <section id="parsed-threads">
        <CollapsibleSection
          title="Review Parsed Threads"
          description="Imported and unclassified threads appear here for review after intake. This is a correspondence viewer, not a mail client."
          defaultOpen={false}
          className="overflow-hidden"
          bodyClassName="p-4 pt-0"
        >
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
        </CollapsibleSection>
      </section>
    </section>
  );
}
