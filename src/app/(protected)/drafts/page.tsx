import { getAiConfigStatus } from "@/lib/ai/config";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { WorkflowChecklist } from "@/components/WorkflowChecklist";
import { getActiveWritingStyleProfile } from "@/lib/persistence/repository";
import {
  listCases,
  listDraftRedTeamReviews,
  listDraftResponses,
  listTimelineEvents,
} from "@/lib/persistence/repository";
import { mapCaseRowsToRecords } from "@/lib/workbench-data";
import { DraftsWorkbench } from "@/components/DraftsWorkbench";

export default async function DraftsPage() {
  const [draftRows, reviewRows, caseRows, timelineRows, writingStyleProfile] = await Promise.all([
    listDraftResponses(),
    listDraftRedTeamReviews(),
    listCases(),
    listTimelineEvents(),
    getActiveWritingStyleProfile(),
  ]);
  const caseRecords = mapCaseRowsToRecords(caseRows, timelineRows);
  const caseTitles = new Map(caseRecords.map((item) => [item.caseId, item.title] as const));
  const aiConfig = getAiConfigStatus();

  return (
    <section className="space-y-6">
      <StickyPageHeader
        eyebrow="Drafts"
        title="Draft workbench"
        description="Drafts are generated replies only. They stay pending red-team review until a review verdict says they can be copied."
        context="Draft pending red-team → Passed → Needs evidence → Rejected"
        primaryAction={{ href: "/cases", label: "Open Cases" }}
        secondaryActions={[
          { href: "/import", label: "Import" },
          { href: "/assurance", label: "Assurance" },
          { href: "/settings/writing-style", label: "Writing Style" },
        ]}
        quickLinks={[
          { href: "/cases", label: "Cases" },
          { href: "/import", label: "Import" },
          { href: "/assurance", label: "Assurance" },
          { href: "/settings/writing-style", label: "Writing Style" },
        ]}
      />

      <WorkflowChecklist
        title="Draft workflow"
        description="Generate a draft, run red-team review, then copy the reviewed text only when it is safe to do so."
        note="Copy remains disabled until safe_to_copy"
        collapsible
        defaultOpen={false}
        items={[
          {
            title: "Review the generated draft",
            description:
              "Check the draft body, source IDs, evidence basis, assumptions, and missing information before any manual reuse.",
          },
          {
            title: "Run red-team review",
            description:
              "Use the review gate to check unsupported claims, liability risks, tone, and evidence gaps.",
            href: "/drafts",
            actionLabel: "Open Drafts",
          },
          {
            title: "Adjust style if the wording feels off",
            description:
              "Tune the writing style profile before generating the next draft so the tone feels more like you.",
            href: "/settings/writing-style",
            actionLabel: "Open Writing Style",
          },
          {
            title: "Return to source material when needed",
            description:
              "If the draft is blocked or needs evidence, go back to import, correspondence, or the case workbench.",
            href: "/import",
            actionLabel: "Open Import",
            links: [{ href: "/assurance", label: "Assurance" }],
          },
        ]}
      />

      <DraftsWorkbench
        drafts={draftRows}
        initialReviews={reviewRows}
        caseTitles={caseTitles}
        aiConfig={aiConfig}
        writingStyleProfileName={writingStyleProfile.profile_name}
      />
    </section>
  );
}
