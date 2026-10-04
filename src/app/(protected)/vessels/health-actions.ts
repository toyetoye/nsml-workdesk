"use server";

import { requireWritableAccess } from "@/lib/auth-session";
import {
  saveVesselHealthItem,
  updateVesselHealthItem,
  deleteVesselHealthItem,
} from "@/lib/persistence/repository";
import type {
  VesselHealthCategory,
  VesselHealthStatus,
  VesselHealthSource,
} from "@/lib/persistence/vessel-health-types";

type ActionResult = { ok: boolean; error?: string };

type HealthItemInput = {
  vessel_key: string;
  item_name: string;
  category: VesselHealthCategory;
  status: VesselHealthStatus;
  source: VesselHealthSource;
  notes: string;
  due_date: string;
  crew_reported_ok: boolean;
  independently_verified: boolean;
};

export async function addHealthItemAction(input: HealthItemInput): Promise<ActionResult> {
  await requireWritableAccess("/vessels");

  if (!input.item_name.trim()) {
    return { ok: false, error: "Item name is required." };
  }

  try {
    const result = await saveVesselHealthItem({
      vessel_key: input.vessel_key,
      category: input.category,
      item_name: input.item_name.trim(),
      status: input.status,
      source: input.source,
      evidence_id: null,
      notes: input.notes.trim() || null,
      due_date: input.due_date || null,
      crew_reported_ok: input.crew_reported_ok,
      independently_verified: input.independently_verified,
    });

    return result ? { ok: true } : { ok: false, error: "Save failed — persistence unavailable." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed.",
    };
  }
}

type HealthItemUpdate = {
  item_name?: string;
  status?: VesselHealthStatus;
  notes?: string;
  due_date?: string;
  crew_reported_ok?: boolean;
  independently_verified?: boolean;
};

export async function updateHealthItemAction(
  healthId: string,
  updates: HealthItemUpdate,
): Promise<ActionResult> {
  await requireWritableAccess("/vessels");

  try {
    const ok = await updateVesselHealthItem(healthId, {
      status: updates.status,
      notes: updates.notes?.trim() ?? null,
      due_date: updates.due_date || null,
      crew_reported_ok: updates.crew_reported_ok,
      independently_verified: updates.independently_verified,
    });

    return ok ? { ok: true } : { ok: false, error: "Update failed." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

export async function deleteHealthItemAction(healthId: string): Promise<ActionResult> {
  await requireWritableAccess("/vessels");

  try {
    const ok = await deleteVesselHealthItem(healthId);
    return ok ? { ok: true } : { ok: false, error: "Delete failed." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Delete failed.",
    };
  }
}
