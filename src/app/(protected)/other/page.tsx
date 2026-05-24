import { WorkspacePage } from "@/components/WorkspacePage";
import { otherWorkspace } from "@/lib/mock-data";

type SearchParamsValue = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined> | undefined> | undefined;

export default function OtherPage({
  searchParams,
}: {
  searchParams?: SearchParamsValue;
}) {
  return (
    <WorkspacePage
      workspace={otherWorkspace}
      correspondenceScope="other"
      correspondenceLabel="General Correspondence"
      correspondenceDescription="Imported correspondence classified to the general workspace lives here after intake."
      emptyStateTitle="No general correspondence yet"
      emptyStateMessage="When imported emails are classified to Other / General Issues, they will appear here with their thread history and attachments."
      searchParams={searchParams}
    />
  );
}
