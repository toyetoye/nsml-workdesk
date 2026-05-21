import { WorkspacePage } from "@/components/WorkspacePage";
import { otherWorkspace } from "@/lib/mock-data";

export default function OtherPage() {
  return <WorkspacePage workspace={otherWorkspace} />;
}
