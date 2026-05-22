import { getActiveWritingStyleProfile } from "@/lib/persistence/repository";
import { WritingStyleProfileWorkbench } from "@/components/WritingStyleProfileWorkbench";

export default async function WritingStylePage() {
  const profile = await getActiveWritingStyleProfile();

  return <WritingStyleProfileWorkbench initialProfile={profile} />;
}
