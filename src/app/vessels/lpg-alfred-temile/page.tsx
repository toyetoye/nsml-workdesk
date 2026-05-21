import { WorkspacePage } from "@/components/WorkspacePage";
import { vesselWorkspaces } from "@/lib/mock-data";

export default function LpgAlfredTemilePage() {
  return <WorkspacePage workspace={vesselWorkspaces[1]} />;
}
