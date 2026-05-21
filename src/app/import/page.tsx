import { EmailWorkbench } from "@/components/EmailWorkbench";
import { ImportIntakeWorkbench } from "@/components/ImportIntakeWorkbench";

export default function ImportPage() {
  return (
    <section className="space-y-6">
      <ImportIntakeWorkbench />

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
