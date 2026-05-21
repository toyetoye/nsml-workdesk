import { WorkspacePage } from "@/components/WorkspacePage";
import { otherWorkspace } from "@/lib/mock-data";

export default function OtherPage() {
  return (
    <WorkspacePage
      workspace={otherWorkspace}
      correspondenceScope="other"
      correspondenceLabel="General Correspondence"
      correspondenceDescription="Imported correspondence classified to the general workspace lives here after intake."
      emptyStateTitle="No general correspondence yet"
      emptyStateMessage="When imported emails are classified to Other / General Issues, they will appear here with their thread history and attachments."
    />
  );
}
