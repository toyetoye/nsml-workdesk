import { WorkspacePage } from "@/components/WorkspacePage";
import { vesselWorkspaces } from "@/lib/mock-data";

export default function LpgAlfredTemile10Page() {
  return <WorkspacePage workspace={vesselWorkspaces[2]} />;
}
