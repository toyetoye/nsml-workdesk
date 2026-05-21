import { EmailWorkbench } from "@/components/EmailWorkbench";
import { ImportIntakeWorkbench } from "@/components/ImportIntakeWorkbench";
import { isPersistenceAvailable } from "@/lib/persistence/client";
import { listIntakeItems } from "@/lib/persistence/repository";
import { mapIntakeRowsToItems } from "@/lib/workbench-data";

export default async function ImportPage() {
  const intakeRows = await listIntakeItems();
  const initialItems = mapIntakeRowsToItems(intakeRows);

  return (
    <section className="space-y-6">
      <ImportIntakeWorkbench
        initialItems={initialItems}
        persistenceEnabled={isPersistenceAvailable()}
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
