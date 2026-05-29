import { StickyPageHeader } from "@/components/StickyPageHeader";
import QuickCaptureForm from "./QuickCaptureForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

export default async function QuickCapturePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <main>
      <StickyPageHeader
        eyebrow="QUICK CAPTURE"
        title="Capture email"
        description="Review the pre-filled details, pick a workspace, and confirm."
      />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px" }}>
        <QuickCaptureForm
          defaultSubject={first(params.subject)}
          defaultFrom={first(params.from)}
          defaultBody={first(params.body)}
          defaultWorkspace={first(params.workspace)}
        />
      </div>
    </main>
  );
}
