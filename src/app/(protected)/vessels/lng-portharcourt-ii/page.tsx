import { WorkspacePage } from "@/components/WorkspacePage";
import { vesselWorkspaces } from "@/lib/mock-data";

type SearchParamsValue = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined> | undefined> | undefined;

export default function LngPortharcourtIiPage({
  searchParams,
}: {
  searchParams?: SearchParamsValue;
}) {
  return (
    <WorkspacePage
      workspace={vesselWorkspaces[0]}
      correspondenceScope="lng-portharcourt-ii"
      correspondenceLabel="Vessel Correspondence"
      correspondenceDescription="Imported correspondence classified to this vessel lives here after intake."
      emptyStateTitle="No vessel correspondence yet"
      emptyStateMessage="When imported emails are classified to LNG PORTHARCOURT II, they will appear here with their thread history and attachments."
      searchParams={searchParams}
    />
  );
}
