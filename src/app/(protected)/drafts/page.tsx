import { listCases, listDraftResponses, listTimelineEvents } from "@/lib/persistence/repository";
import { mapCaseRowsToRecords } from "@/lib/workbench-data";
import { DraftsWorkbench } from "@/components/DraftsWorkbench";

export default async function DraftsPage() {
  const [draftRows, caseRows, timelineRows] = await Promise.all([
    listDraftResponses(),
    listCases(),
    listTimelineEvents(),
  ]);
  const caseRecords = mapCaseRowsToRecords(caseRows, timelineRows);
  const caseTitles = new Map(caseRecords.map((item) => [item.caseId, item.title] as const));

  return <DraftsWorkbench drafts={draftRows} caseTitles={caseTitles} />;
}
