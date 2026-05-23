import { BulkEvidenceIntakePanel } from "@/components/BulkEvidenceIntakePanel";
import { EmailWorkbench } from "@/components/EmailWorkbench";
import { EvidenceStorageWorkbench } from "@/components/EvidenceStorageWorkbench";
import { ImportIntakeWorkbench } from "@/components/ImportIntakeWorkbench";
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
      <WorkflowChecklist
        title="Import flow"
        description="Start with intake, stage evidence, then decide whether the item belongs in correspondence, a case, or a draft path."
        note="AI and persistence may fall back"
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

      <BulkEvidenceIntakePanel
        key={bulkBatches.map((batch) => batch.batch_id).join("|") || "bulk-batches-empty"}
        initialBatches={bulkBatches}
        initialBatchItems={bulkBatchItems}
        persistenceEnabled={isPersistenceAvailable()}
        evidenceStorageEnabled={hasEvidenceStorageConfig()}
        manualIntakeHref="#manual-intake"
      />

      <ImportIntakeWorkbench
        initialItems={initialItems}
        initialEvidence={initialEvidence}
        persistenceEnabled={isPersistenceAvailable()}
        aiConfig={aiConfig}
        writingStyleProfileName={writingStyleProfile.profile_name}
      />

      <EvidenceStorageWorkbench
        initialEvidence={initialEvidence}
        persistenceEnabled={isPersistenceAvailable()}
        parsingEnabled={hasEvidenceStorageConfig()}
        mode="import"
        defaultWorkspaceAssignment="Import/Staging"
      />

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
  );
}
