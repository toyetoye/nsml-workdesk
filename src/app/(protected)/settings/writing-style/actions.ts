"use server";

import { requireWritableAccess } from "@/lib/auth-session";
import { saveWritingStyleProfile } from "@/lib/persistence/repository";
import type { WritingStyleProfileSnapshot } from "@/lib/writing-style/profile";

export async function saveWritingStyleProfileAction(input: WritingStyleProfileSnapshot) {
  await requireWritableAccess("/settings/writing-style");

  const saved = await saveWritingStyleProfile(input);

  return {
    profile: saved.row,
    persisted: saved.persisted,
    note: saved.persisted
      ? "Writing style profile saved."
      : "Writing style profile saved for the current session. Persistence is unavailable.",
  };
}
