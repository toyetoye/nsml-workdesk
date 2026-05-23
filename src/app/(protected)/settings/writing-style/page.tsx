import { WorkflowChecklist } from "@/components/WorkflowChecklist";
import { getActiveWritingStyleProfile } from "@/lib/persistence/repository";
import { WritingStyleProfileWorkbench } from "@/components/WritingStyleProfileWorkbench";

export default async function WritingStylePage() {
  const profile = await getActiveWritingStyleProfile();

  return (
    <section className="space-y-6">
      <WritingStyleProfileWorkbench initialProfile={profile} />

      <WorkflowChecklist
        title="Where this profile shows up next"
        description="Use the profile here, then return to drafts to see how the calibrated wording reads in context."
        note="Drafts still require red-team review"
        items={[
          {
            title: "Review generated drafts",
            description:
              "Open the drafts workbench to see the active style profile reflected in generated wording.",
            href: "/drafts",
            actionLabel: "Open Drafts",
          },
          {
            title: "Check the working case",
            description:
              "If the wording needs more evidence or a different tone, go back to the active case or thread.",
            href: "/cases",
            actionLabel: "Open Cases",
          },
          {
            title: "Return to intake when needed",
            description:
              "If the source material needs more context, stage or upload it again from the import workbench.",
            href: "/import",
            actionLabel: "Open Import",
            links: [{ href: "/assurance", label: "Assurance" }],
          },
        ]}
      />
    </section>
  );
}
