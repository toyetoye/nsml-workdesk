import { WorkspacePage } from "@/components/WorkspacePage";
import { vesselWorkspaces } from "@/lib/mock-data";

type SearchParamsValue = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined> | undefined> | undefined;

export default function LpgAlfredTemile10Page({
  searchParams,
}: {
  searchParams?: SearchParamsValue;
}) {
  return (
    <WorkspacePage
      workspace={vesselWorkspaces[2]}
      correspondenceScope="lpg-alfred-temile-10"
      correspondenceLabel="Vessel Correspondence"
      correspondenceDescription="Imported correspondence classified to this vessel lives here after intake."
      emptyStateTitle="No vessel correspondence yet"
      emptyStateMessage="When imported emails are classified to LPG ALFRED TEMILE 10, they will appear here with their thread history and attachments."
      searchParams={searchParams}
    />
  );
}
