import { CaseManagementWorkbench } from "@/components/CaseManagementWorkbench";
import { isPersistenceAvailable } from "@/lib/persistence/client";
import { listCases, listTimelineEvents } from "@/lib/persistence/repository";
import { mapCaseRowsToRecords } from "@/lib/workbench-data";

export default async function CasesPage() {
  const [caseRows, timelineRows] = await Promise.all([listCases(), listTimelineEvents()]);
  const initialCases = mapCaseRowsToRecords(caseRows, timelineRows);

  return (
    <section className="space-y-6">
      <CaseManagementWorkbench
        initialCases={initialCases}
        persistenceEnabled={isPersistenceAvailable()}
      />
    </section>
  );
}
