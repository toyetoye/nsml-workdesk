import "server-only";

import type { ImportWorkspaceAssignment, ImportIntakeStatus } from "@/lib/mock-data";
import type { IntakeSubmission } from "@/lib/workbench-data";

export type ScoutItem = {
  vessel: string;
  what: string;
  from: string;
  status: string;
  due: string;
};

export type ParseScoutResult = {
  items: ScoutItem[];
  skipped: number;
  raw: string;
};

// ─── vessel name → workspace assignment ──────────────────────────────────────

const VESSEL_MAP: Array<[RegExp, ImportWorkspaceAssignment]> = [
  [/port.?harcourt|phc.?ii|lng.?ph/i, "LNG PORTHARCOURT II"],
  [/alfred.?temile.?10|temile.?10|at.?10/i, "LPG ALFRED TEMILE 10"],
  [/alfred.?temile|temile(?!.?10)|lpg.?at\b/i, "LPG ALFRED TEMILE"],
  [/rivers/i, "LNG PORTHARCOURT II"], // LNG Rivers → closest match
  [/adamawa/i, "Other"],
  [/general|fleet|all.?vessels/i, "Other"],
];

function resolveWorkspace(vessel: string): ImportWorkspaceAssignment {
  for (const [pattern, assignment] of VESSEL_MAP) {
    if (pattern.test(vessel)) return assignment;
  }
  return "Import/Staging";
}

// ─── status string → IntakeSubmission status ─────────────────────────────────

function resolveStatus(raw: string): ImportIntakeStatus {
  const s = raw.toLowerCase();
  if (s.includes("urgent")) return "pending-my-reply";
  if (s.includes("need to reply") || s.includes("need reply")) return "pending-my-reply";
  if (s.includes("waiting")) return "monitoring";
  if (s.includes("monitor")) return "monitoring";
  if (s.includes("decision")) return "decision-required";
  return "unclassified";
}

// ─── parse a single block ─────────────────────────────────────────────────────

function parseBlock(block: string): ScoutItem | null {
  const get = (key: string) => {
    const match = block.match(new RegExp(`^${key}:\\s*(.+)$`, "im"));
    return match ? match[1].trim() : "";
  };

  const vessel = get("VESSEL");
  const what = get("WHAT");
  const from = get("FROM");
  const status = get("STATUS");
  const due = get("DUE");

  if (!what) return null;

  return { vessel: vessel || "General", what, from, status, due };
}

// ─── public: parse full Copilot Scout paste ──────────────────────────────────

export function parseScoutOutput(text: string): ParseScoutResult {
  const raw = text.trim();
  if (!raw) return { items: [], skipped: 0, raw };

  // Split on --- separator, filter empty blocks
  const blocks = raw
    .split(/^---+$/m)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  let skipped = 0;
  const items: ScoutItem[] = [];

  for (const block of blocks) {
    // Skip the summary line ("X items need reply, Y waiting...")
    if (/^\d+ items? need reply/i.test(block) || /^no vessel-related/i.test(block)) {
      continue;
    }
    const parsed = parseBlock(block);
    if (parsed) {
      items.push(parsed);
    } else {
      skipped++;
    }
  }

  return { items, skipped, raw };
}

// ─── convert ScoutItem → IntakeSubmission ────────────────────────────────────

export function scoutItemToSubmission(item: ScoutItem): IntakeSubmission {
  const dueNote = item.due && item.due !== "Not specified" ? ` · Due: ${item.due}` : "";
  return {
    title: item.what,
    sourceType: "manual-note",
    workspaceAssignment: resolveWorkspace(item.vessel),
    status: resolveStatus(item.status),
    senderSource: item.from || "WorkDesk Scout import",
    dateTime: new Date().toISOString(),
    bodyContent: [
      `Vessel: ${item.vessel}`,
      `From: ${item.from}`,
      `Status: ${item.status}`,
      `Due: ${item.due || "Not specified"}`,
      `Imported via WorkDesk Scout`,
    ].join("\n"),
    tags: ["scout-import", item.vessel.toLowerCase().replace(/\s+/g, "-")].join(", "),
  };
}
