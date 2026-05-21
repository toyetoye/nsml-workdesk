import { CaseManagementWorkbench } from "@/components/CaseManagementWorkbench";
import { isPersistenceAvailable } from "@/lib/persistence/client";
import { listCases, listEvidence, listTimelineEvents } from "@/lib/persistence/repository";
import { mapCaseRowsToRecords, mapEvidenceRowsToRecords } from "@/lib/workbench-data";

export default async function CasesPage() {
  const [caseRows, timelineRows, evidenceRows] = await Promise.all([
    listCases(),
    listTimelineEvents(),
    listEvidence(),
  ]);
  const initialCases = mapCaseRowsToRecords(caseRows, timelineRows);
  const initialEvidence = mapEvidenceRowsToRecords(evidenceRows);

  return (
    <section className="space-y-6">
      <CaseManagementWorkbench
        initialCases={initialCases}
        initialEvidence={initialEvidence}
        persistenceEnabled={isPersistenceAvailable()}
      />
    </section>
  );
}
