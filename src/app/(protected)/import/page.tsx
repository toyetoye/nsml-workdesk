import { EmailWorkbench } from "@/components/EmailWorkbench";
import { EvidenceStorageWorkbench } from "@/components/EvidenceStorageWorkbench";
import { ImportIntakeWorkbench } from "@/components/ImportIntakeWorkbench";
import { isPersistenceAvailable } from "@/lib/persistence/client";
import { listEvidence, listIntakeItems } from "@/lib/persistence/repository";
import { mapEvidenceRowsToRecords, mapIntakeRowsToItems } from "@/lib/workbench-data";

export default async function ImportPage() {
  const [intakeRows, evidenceRows] = await Promise.all([listIntakeItems(), listEvidence()]);
  const initialItems = mapIntakeRowsToItems(intakeRows);
  const initialEvidence = mapEvidenceRowsToRecords(evidenceRows);

  return (
    <section className="space-y-6">
      <ImportIntakeWorkbench
        initialItems={initialItems}
        persistenceEnabled={isPersistenceAvailable()}
      />

      <EvidenceStorageWorkbench
        initialEvidence={initialEvidence}
        persistenceEnabled={isPersistenceAvailable()}
        mode="import"
        defaultWorkspaceAssignment="Import/Staging"
      />

      <EmailWorkbench
        scope="import"
        sectionLabel="Imported Correspondence Viewer"
        sectionDescription="Imported and unclassified threads appear here for review after intake. This is a correspondence viewer, not a mail client."
        emptyStateTitle="No imported threads yet"
        emptyStateMessage="Imported correspondence waiting for classification will appear here after it enters staging."
      />
    </section>
  );
}
