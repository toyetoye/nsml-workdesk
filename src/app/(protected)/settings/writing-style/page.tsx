import { PenLine } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function WritingStylePage() {
  return (
    <PlaceholderPage
      eyebrow="Writing Style"
      title="Writing Style"
      description="A future reference area for professional tone preferences and reviewed response guidance."
      icon={PenLine}
      items={["Direct", "Technically grounded", "Evidence-aware"]}
    />
  );
}
