import { WorkspacePage } from "@/components/WorkspacePage";
import { projectWorkspace } from "@/lib/mock-data";

export default function ProjectsPage() {
  return <WorkspacePage workspace={projectWorkspace} />;
}
