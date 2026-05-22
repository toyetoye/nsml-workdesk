import { getAiConfigStatus } from "@/lib/ai/config";
import {
  listCases,
  listDraftRedTeamReviews,
  listDraftResponses,
  listTimelineEvents,
} from "@/lib/persistence/repository";
import { mapCaseRowsToRecords } from "@/lib/workbench-data";
import { DraftsWorkbench } from "@/components/DraftsWorkbench";

export default async function DraftsPage() {
  const [draftRows, reviewRows, caseRows, timelineRows] = await Promise.all([
    listDraftResponses(),
    listDraftRedTeamReviews(),
    listCases(),
    listTimelineEvents(),
  ]);
  const caseRecords = mapCaseRowsToRecords(caseRows, timelineRows);
  const caseTitles = new Map(caseRecords.map((item) => [item.caseId, item.title] as const));
  const aiConfig = getAiConfigStatus();

  return (
    <DraftsWorkbench
      drafts={draftRows}
      initialReviews={reviewRows}
      caseTitles={caseTitles}
      aiConfig={aiConfig}
    />
  );
}
