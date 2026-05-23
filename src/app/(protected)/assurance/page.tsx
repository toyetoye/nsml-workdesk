import { AssuranceWorkbench } from "@/components/AssuranceWorkbench";
import { WorkflowChecklist } from "@/components/WorkflowChecklist";
import { isPersistenceAvailable } from "@/lib/persistence/client";
import { listAssuranceSignals, listCases, listEvidence, listVesselEngagementLogs, listVesselSupportItems } from "@/lib/persistence/repository";
import { mapEvidenceRowsToRecords } from "@/lib/workbench-data";

export default async function AssurancePage() {
  const [signalRows, supportRows, logRows, caseRows, evidenceRows] = await Promise.all([
    listAssuranceSignals(),
    listVesselSupportItems(),
    listVesselEngagementLogs(),
    listCases(),
    listEvidence(),
  ]);

  const evidenceRecords = mapEvidenceRowsToRecords(evidenceRows);

  return (
    <section className="space-y-6">
      <WorkflowChecklist
        title="Assurance workflow"
        description="Capture the signal, attach evidence, convert broad feedback into vessel support items, and keep the weekly pack factual."
        note="Fact requires evidence links"
        items={[
          {
            title: "Capture the assurance signal",
            description:
              "Record the source, the audience, the related vessel or department, and the evidence level before the concern is stored.",
            links: [
              { href: "/import", label: "Import" },
              { href: "/cases", label: "Cases" },
              { href: "/drafts", label: "Drafts" },
            ],
          },
          {
            title: "Request specifics and attach evidence",
            description:
              "Use the request-specifics prompt when feedback is broad or anonymous, then link the evidence before marking anything as Fact.",
            href: "/import",
            actionLabel: "Open Import",
          },
          {
            title: "Convert verified issues into tracked support",
            description:
              "When the vessel, issue, date, person, expected support, actual response, status, and close-out are clear, create the support item.",
            href: "/cases",
            actionLabel: "Open Cases",
          },
          {
            title: "Review the weekly evidence pack",
            description:
              "Use the deterministic weekly summary to see delivered support, escalations, blockers, engagements, and next week priorities.",
          },
          {
            title: "Keep the wording neutral",
            description:
              "If a concern is governance-related or still unverified, keep it reported and review the writing style or related source material before closing it out.",
            links: [
              { href: "/settings/writing-style", label: "Writing Style" },
              { href: "/dashboard", label: "Dashboard" },
            ],
          },
        ]}
      />

      <AssuranceWorkbench
        initialSignals={signalRows}
        initialSupportItems={supportRows}
        initialEngagementLogs={logRows}
        evidenceRecords={evidenceRecords}
        caseRows={caseRows}
        persistenceEnabled={isPersistenceAvailable()}
      />
    </section>
  );
}
