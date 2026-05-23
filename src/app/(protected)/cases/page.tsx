import { CaseManagementWorkbench } from "@/components/CaseManagementWorkbench";
import { WorkflowChecklist } from "@/components/WorkflowChecklist";
import { getAiConfigStatus } from "@/lib/ai/config";
import { hasEvidenceStorageConfig } from "@/lib/persistence/config";
import { isPersistenceAvailable } from "@/lib/persistence/client";
import { getActiveWritingStyleProfile } from "@/lib/persistence/repository";
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
  const [caseRows, timelineRows, evidenceRows, threadRows, messageRows, writingStyleProfile] = await Promise.all([
    listCases(),
    listTimelineEvents(),
    listEvidence(),
    listCorrespondenceThreads(),
    listCorrespondenceMessages(),
    getActiveWritingStyleProfile(),
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
      <WorkflowChecklist
        title="Case workflow"
        description="Cases are where the work is managed. Attach evidence, inspect linked correspondence, and only then prepare or review drafts."
        note="Drafts remain pending red-team"
        items={[
          {
            title: "Open the case",
            description:
              "Use the selected case detail pane to see the current status, owner, waiting party, and next action.",
          },
          {
            title: "Attach evidence or correspondence",
            description:
              "Add supporting files, parse eligible EMLs, or check the imported thread trail before moving forward.",
            href: "/import",
            actionLabel: "Open Import",
            links: [{ href: "/assurance", label: "Assurance" }],
          },
          {
            title: "Triage, draft, and review",
            description:
              "Run triage on the selected case, generate a draft, then open /drafts to run red-team and copy only if safe.",
            href: "/drafts",
            actionLabel: "Open Drafts",
          },
          {
            title: "Adjust writing style if needed",
            description:
              "If the wording needs a different tone, update the writing style profile before generating the next draft.",
            href: "/settings/writing-style",
            actionLabel: "Open Writing Style",
          },
          {
            title: "Track assurance signals",
            description:
              "Capture vessel support concerns and governance signals in /assurance so broad feedback becomes evidence-backed action.",
            href: "/assurance",
            actionLabel: "Open Assurance",
          },
        ]}
      />

      <CaseManagementWorkbench
        initialCases={initialCases}
        initialEvidence={initialEvidence}
        parsedCorrespondenceThreads={parsedCorrespondenceThreads}
        persistenceEnabled={isPersistenceAvailable()}
        parsingEnabled={hasEvidenceStorageConfig()}
        aiConfig={aiConfig}
        writingStyleProfileName={writingStyleProfile.profile_name}
      />
    </section>
  );
}
