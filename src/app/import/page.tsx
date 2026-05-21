import { Upload } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function ImportPage() {
  return (
    <PlaceholderPage
      eyebrow="Manual Import"
      title="Import"
      description="A future intake area for manually pasted emails, EMLs, screenshots, documents, and notes."
      icon={Upload}
      items={["Paste email", "Upload EML", "Attach evidence"]}
    />
  );
}
