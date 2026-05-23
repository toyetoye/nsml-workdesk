"use server";

import { revalidatePath } from "next/cache";
import { requireWritableAccess } from "@/lib/auth-session";
import { appendAuditLog, saveAssuranceSignal, saveVesselEngagementLog, saveVesselSupportItem } from "@/lib/persistence/repository";
import type {
  AssuranceSignalInput,
  VesselEngagementLogInput,
  VesselSupportItemInput,
} from "@/lib/persistence/types";
import { resolveSignalEvidenceLevel } from "@/lib/assurance/helpers";

type AssuranceSaveResult<T> = {
  record: T;
  persisted: boolean;
  note: string;
};

export async function saveAssuranceSignalAction(
  input: AssuranceSignalInput,
): Promise<AssuranceSaveResult<Awaited<ReturnType<typeof saveAssuranceSignal>>["row"]>> {
  await requireWritableAccess("/assurance");

  const evidenceLinks = [...new Set((input.evidence_links ?? []).map((item) => item.trim()).filter(Boolean))];
  const level = resolveSignalEvidenceLevel({
    requestedLevel: input.evidence_level ?? "Reported",
    evidenceLinks,
  });

  const saved = await saveAssuranceSignal({
    ...input,
    evidence_level: level.evidenceLevel,
    evidence_links: evidenceLinks,
  });

  await appendAuditLog({
    actor: "user",
    action: "save_assurance_signal",
    object_type: "assurance_signal",
    object_id: saved.row.assurance_signal_id,
    details: {
      persisted: saved.persisted,
      evidence_level: saved.row.evidence_level,
      linked_case_id: saved.row.linked_case_id,
      evidence_links: saved.row.evidence_links,
      warning: level.warning,
    },
  });

  revalidatePath("/assurance");

  return {
    record: saved.row,
    persisted: saved.persisted,
    note: level.warning
      ? `${level.warning}${saved.persisted ? "" : " The record is currently session-only because persistence is unavailable."}`
      : saved.persisted
        ? "Assurance signal saved."
        : "Assurance signal saved for the current session only. Persistence is unavailable.",
  };
}

export async function saveVesselSupportItemAction(
  input: VesselSupportItemInput,
): Promise<AssuranceSaveResult<Awaited<ReturnType<typeof saveVesselSupportItem>>["row"]>> {
  await requireWritableAccess("/assurance");

  const saved = await saveVesselSupportItem(input);

  await appendAuditLog({
    actor: "user",
    action: "save_vessel_support_item",
    object_type: "vessel_support_item",
    object_id: saved.row.support_item_id,
    details: {
      persisted: saved.persisted,
      linked_case_id: saved.row.linked_case_id,
      source_signal_id: saved.row.source_signal_id,
      blocker_type: saved.row.blocker_type,
    },
  });

  revalidatePath("/assurance");

  return {
    record: saved.row,
    persisted: saved.persisted,
    note: saved.persisted
      ? "Vessel support item saved."
      : "Vessel support item saved for the current session only. Persistence is unavailable.",
  };
}

export async function saveVesselEngagementLogAction(
  input: VesselEngagementLogInput,
): Promise<AssuranceSaveResult<Awaited<ReturnType<typeof saveVesselEngagementLog>>["row"]>> {
  await requireWritableAccess("/assurance");

  const saved = await saveVesselEngagementLog(input);

  await appendAuditLog({
    actor: "user",
    action: "save_vessel_engagement_log",
    object_type: "vessel_engagement_log",
    object_id: saved.row.engagement_log_id,
    details: {
      persisted: saved.persisted,
      linked_case_id: saved.row.linked_case_id,
      linked_signal_id: saved.row.linked_signal_id,
      linked_support_item_id: saved.row.linked_support_item_id,
      follow_up_required: saved.row.follow_up_required,
    },
  });

  revalidatePath("/assurance");

  return {
    record: saved.row,
    persisted: saved.persisted,
    note: saved.persisted
      ? "Vessel engagement log saved."
      : "Vessel engagement log saved for the current session only. Persistence is unavailable.",
  };
}
