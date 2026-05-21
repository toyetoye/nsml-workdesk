import { FileEdit } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function DraftsPage() {
  return (
    <PlaceholderPage
      eyebrow="Draft Review"
      title="Drafts"
      description="A future review area for response drafts after the approved drafting sprint."
      icon={FileEdit}
      items={["Drafts ready", "Needs review", "Returned for evidence"]}
    />
  );
}
