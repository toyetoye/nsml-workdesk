import { CaseManagementWorkbench } from "@/components/CaseManagementWorkbench";
import { getAiConfigStatus } from "@/lib/ai/config";
import { hasEvidenceStorageConfig } from "@/lib/persistence/config";
import { isPersistenceAvailable } from "@/lib/persistence/client";
import {
  listCases,
  listCorrespondenceMessages,
  listCorrespondenceThreads,
  listEvidence,
  listTimelineEvents,
} from "@/lib/persistence/repository";
import {
  mapCaseRowsToRecords,
  mapEvidenceRowsToRecords,
  mapParsedCorrespondenceRowsToThreads,
} from "@/lib/workbench-data";

export default async function CasesPage() {
  const [caseRows, timelineRows, evidenceRows, threadRows, messageRows] = await Promise.all([
    listCases(),
    listTimelineEvents(),
    listEvidence(),
    listCorrespondenceThreads(),
    listCorrespondenceMessages(),
  ]);
  const initialCases = mapCaseRowsToRecords(caseRows, timelineRows);
  const initialEvidence = mapEvidenceRowsToRecords(evidenceRows);
  const parsedCorrespondenceThreads = mapParsedCorrespondenceRowsToThreads(
    threadRows,
    messageRows,
  );
  const aiConfig = getAiConfigStatus();

  return (
    <section className="space-y-6">
      <CaseManagementWorkbench
        initialCases={initialCases}
        initialEvidence={initialEvidence}
        parsedCorrespondenceThreads={parsedCorrespondenceThreads}
        persistenceEnabled={isPersistenceAvailable()}
        parsingEnabled={hasEvidenceStorageConfig()}
        aiConfig={aiConfig}
      />
    </section>
  );
}
