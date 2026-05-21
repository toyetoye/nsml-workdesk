import { ClipboardList } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function CasesPage() {
  return (
    <PlaceholderPage
      eyebrow="Cases"
      title="Cases"
      description="A future case list for vessel, project, and general issue follow-up."
      icon={ClipboardList}
      items={["Open cases", "Decision required", "Needs evidence"]}
    />
  );
}
