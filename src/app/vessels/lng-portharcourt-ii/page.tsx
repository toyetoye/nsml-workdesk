import { WorkspacePage } from "@/components/WorkspacePage";
import { vesselWorkspaces } from "@/lib/mock-data";

export default function LngPortharcourtIiPage() {
  return <WorkspacePage workspace={vesselWorkspaces[0]} />;
}
