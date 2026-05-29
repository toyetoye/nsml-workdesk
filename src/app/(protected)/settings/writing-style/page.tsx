import { StickyPageHeader } from "@/components/StickyPageHeader";
import { WorkflowChecklist } from "@/components/WorkflowChecklist";
import { getActiveWritingStyleProfile } from "@/lib/persistence/repository";
import { WritingStyleProfileWorkbench } from "@/components/WritingStyleProfileWorkbench";

export default async function WritingStylePage() {
  const profile = await getActiveWritingStyleProfile();

  return (
    <section className="space-y-6">
      <StickyPageHeader
        eyebrow="Writing Style"
        title="Writing Style Profile"
        description="Tune greeting, closing, tone, brevity, stakeholder framing, and mode guidance so generated drafts sound more like you while still staying evidence-based and red-team controlled."
        context="Draft calibration only"
        primaryAction={{ href: "/drafts", label: "Open Drafts" }}
        secondaryActions={[
          { href: "/cases", label: "Cases" },
          { href: "/import", label: "Import" },
          { href: "/assurance", label: "Assurance" },
        ]}
      />

      <WritingStyleProfileWorkbench initialProfile={profile} />

      <WorkflowChecklist
        title="Where this profile shows up next"
        description="Use the profile here, then return to drafts to see how the calibrated wording reads in context."
        note="Drafts still require red-team review"
        collapsible
        defaultOpen={false}
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
