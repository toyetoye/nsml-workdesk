import { WorkspacePage } from "@/components/WorkspacePage";
import { vesselWorkspaces } from "@/lib/mock-data";

export default function LpgAlfredTemilePage() {
  return (
    <WorkspacePage
      workspace={vesselWorkspaces[1]}
      correspondenceScope="lpg-alfred-temile"
      correspondenceLabel="Vessel Correspondence"
      correspondenceDescription="Imported correspondence classified to this vessel lives here after intake."
      emptyStateTitle="No vessel correspondence yet"
      emptyStateMessage="When imported emails are classified to LPG ALFRED TEMILE, they will appear here with their thread history and attachments."
    />
  );
}
