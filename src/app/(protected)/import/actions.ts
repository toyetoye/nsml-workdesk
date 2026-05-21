"use server";

import { requireWritableAccess } from "@/lib/auth-session";
import { saveIntakeItem } from "@/lib/persistence/repository";
import { buildIntakeItemFromSubmission, mapIntakeRowsToItems, type IntakeSubmission } from "@/lib/workbench-data";
import type { IntakeItemRow } from "@/lib/persistence/types";

type SaveIntakeItemResult = {
  item: ReturnType<typeof buildIntakeItemFromSubmission>;
  persisted: boolean;
};

function rowToItem(row: IntakeItemRow) {
  return mapIntakeRowsToItems([row])[0] ?? buildIntakeItemFromSubmission({
    title: row.subject_title,
    sourceType: row.source_type as IntakeSubmission["sourceType"],
    workspaceAssignment: row.workspace_assignment as IntakeSubmission["workspaceAssignment"],
    status: row.status as IntakeSubmission["status"],
    senderSource: row.sender_source,
    dateTime: row.received_at,
    bodyContent: row.body_content,
    tags: row.tags.join(", "),
  });
}

export async function saveIntakeItemAction(
  submission: IntakeSubmission,
): Promise<SaveIntakeItemResult> {
  await requireWritableAccess("/import");

  const persistedRow = await saveIntakeItem({
    subject_title: submission.title,
    source_type: submission.sourceType,
    workspace_assignment: submission.workspaceAssignment,
    status: submission.status,
    sender_source: submission.senderSource,
    received_at: submission.dateTime,
    body_content: submission.bodyContent,
    tags: submission.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    route_note:
      submission.workspaceAssignment === "Import/Staging"
        ? "Still staged for manual classification."
        : `Simulated assignment to ${submission.workspaceAssignment}.`,
    created_from_label: `Created from ${submission.sourceType.replace(/-/g, " ")}`,
  });

  return {
    item: rowToItem(persistedRow.row),
    persisted: persistedRow.persisted,
  };
}
