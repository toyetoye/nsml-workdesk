import { WorkspacePage } from "@/components/WorkspacePage";
import { projectWorkspace } from "@/lib/mock-data";

type SearchParamsValue = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined> | undefined> | undefined;

export default function ProjectsPage({
  searchParams,
}: {
  searchParams?: SearchParamsValue;
}) {
  return (
    <WorkspacePage
      workspace={projectWorkspace}
      correspondenceScope="projects"
      correspondenceLabel="Project Correspondence"
      correspondenceDescription="Imported correspondence classified to projects lives here after intake."
      emptyStateTitle="No project correspondence yet"
      emptyStateMessage="When imported emails are classified to Projects, they will appear here with their thread history and attachments."
      searchParams={searchParams}
    />
  );
}
