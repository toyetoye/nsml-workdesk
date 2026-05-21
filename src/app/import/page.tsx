import { EmailWorkbench } from "@/components/EmailWorkbench";

export default function ImportPage() {
  return (
    <section className="space-y-6">
      <EmailWorkbench
        scope="import"
        sectionLabel="Import Staging / Unclassified Threads"
        sectionDescription="Recent intake items, imported correspondence waiting for classification, and unassigned notes live here first."
        emptyStateTitle="No staging threads yet"
        emptyStateMessage="Recent imports and unclassified items will appear here before they are assigned to a vessel, project, or general workspace."
      />
    </section>
  );
}
