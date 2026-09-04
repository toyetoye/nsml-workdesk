"use server";

import { requireWritableAccess } from "@/lib/auth-session";
import { saveIntakeItem } from "@/lib/persistence/repository";
import { parseScoutOutput, scoutItemToSubmission } from "@/lib/scout/parse-scout-output";
import type { ImportWorkspaceAssignment, ImportIntakeStatus } from "@/lib/mock-data";

// ─── types ───────────────────────────────────────────────────────────────────

export type ScoutImportResult = {
  ok: boolean;
  created: number;
  skipped: number;
  errors: string[];
};

export type QuickLogResult = {
  ok: boolean;
  error?: string;
};

// ─── paste Copilot Scout output → create intake items ────────────────────────

export async function importScoutOutputAction(
  pastedText: string,
): Promise<ScoutImportResult> {
  await requireWritableAccess("/morning");

  const { items, skipped } = parseScoutOutput(pastedText);

  if (items.length === 0) {
    return { ok: false, created: 0, skipped, errors: ["No structured items found. Make sure you're pasting the Scout output with --- separators."] };
  }

  const errors: string[] = [];
  let created = 0;

  for (const item of items) {
    try {
      const submission = scoutItemToSubmission(item);
      await saveIntakeItem({
        subject_title: submission.title,
        source_type: submission.sourceType,
        workspace_assignment: submission.workspaceAssignment,
        status: submission.status,
        sender_source: submission.senderSource,
        received_at: submission.dateTime,
        body_content: submission.bodyContent,
        tags: submission.tags.split(",").map((t) => t.trim()).filter(Boolean),
        route_note: `Scout import — ${item.vessel}`,
        created_from_label: "WorkDesk Scout import",
      });
      created++;
    } catch (error) {
      errors.push(
        `Failed to save: "${item.what}" — ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  return { ok: created > 0, created, skipped, errors };
}

// ─── quick-log: single obligation in 4 fields ────────────────────────────────

export type QuickLogInput = {
  what: string;
  vessel: ImportWorkspaceAssignment;
  status: ImportIntakeStatus;
  due: string;
  from: string;
};

export async function quickLogAction(input: QuickLogInput): Promise<QuickLogResult> {
  await requireWritableAccess("/morning");

  if (!input.what.trim()) {
    return { ok: false, error: "Description is required." };
  }

  try {
    const dueNote = input.due ? ` · Due: ${input.due}` : "";
    await saveIntakeItem({
      subject_title: input.what.trim(),
      source_type: "manual-note",
      workspace_assignment: input.vessel,
      status: input.status,
      sender_source: input.from.trim() || "Manual log",
      received_at: new Date().toISOString(),
      body_content: [
        `Vessel: ${input.vessel}`,
        `Status: ${input.status}`,
        input.due ? `Due: ${input.due}` : "",
        input.from ? `From: ${input.from}` : "",
        `Added via Quick Log`,
      ].filter(Boolean).join("\n"),
      tags: ["quick-log"],
      route_note: `Quick log${dueNote}`,
      created_from_label: "Quick log",
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save.",
    };
  }
}
