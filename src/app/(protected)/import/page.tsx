import { EmailWorkbench } from "@/components/EmailWorkbench";
import { EvidenceStorageWorkbench } from "@/components/EvidenceStorageWorkbench";
import { ImportIntakeWorkbench } from "@/components/ImportIntakeWorkbench";
import { hasEvidenceStorageConfig } from "@/lib/persistence/config";
import { isPersistenceAvailable } from "@/lib/persistence/client";
import {
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
  const [intakeRows, evidenceRows, threadRows, messageRows] = await Promise.all([
    listIntakeItems(),
    listEvidence(),
    listCorrespondenceThreads(),
    listCorrespondenceMessages(),
  ]);
  const initialItems = mapIntakeRowsToItems(intakeRows);
  const initialEvidence = mapEvidenceRowsToRecords(evidenceRows);
  const parsedThreads = mapParsedCorrespondenceRowsToThreads(threadRows, messageRows).filter(
    (thread) => thread.workspaceKey === "import" || thread.workspaceKey === "unclassified",
  );

  return (
    <section className="space-y-6">
      <ImportIntakeWorkbench
        initialItems={initialItems}
        persistenceEnabled={isPersistenceAvailable()}
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
      />
    </section>
  );
}
