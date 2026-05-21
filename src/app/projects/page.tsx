import { WorkspacePage } from "@/components/WorkspacePage";
import { projectWorkspace } from "@/lib/mock-data";

export default function ProjectsPage() {
  return (
    <WorkspacePage
      workspace={projectWorkspace}
      correspondenceScope="projects"
      correspondenceLabel="Project Correspondence"
      correspondenceDescription="Imported correspondence classified to projects lives here after intake."
      emptyStateTitle="No project correspondence yet"
      emptyStateMessage="When imported emails are classified to Projects, they will appear here with their thread history and attachments."
    />
  );
}
