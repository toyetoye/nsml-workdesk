// ─── vessel health types ──────────────────────────────────────────────────────

export type VesselHealthCategory =
  | "machinery"
  | "safety-certificates"
  | "crew-manning"
  | "performance"
  | "hseq";

export type VesselHealthStatus =
  | "ok"
  | "watch"
  | "flag"
  | "critical";

export type VesselHealthSource =
  | "ai-detected"
  | "manual"
  | "noon-report"
  | "inspection-report"
  | "defect-log";

export type VesselHealthItem = {
  health_id: string;
  vessel_key: string; // EmailThreadScope slug
  category: VesselHealthCategory;
  item_name: string;
  status: VesselHealthStatus;
  source: VesselHealthSource;
  evidence_id: string | null;
  notes: string | null;
  due_date: string | null;
  last_updated: string;
  created_at: string;
  crew_reported_ok: boolean; // what crew says
  independently_verified: boolean; // what evidence says
};

// SQL to create the table (run once in Supabase):
// CREATE TABLE vessel_health_items (
//   health_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   vessel_key TEXT NOT NULL,
//   category TEXT NOT NULL,
//   item_name TEXT NOT NULL,
//   status TEXT NOT NULL DEFAULT 'ok',
//   source TEXT NOT NULL DEFAULT 'manual',
//   evidence_id UUID REFERENCES evidence_items(evidence_id),
//   notes TEXT,
//   due_date DATE,
//   last_updated TIMESTAMPTZ DEFAULT now(),
//   created_at TIMESTAMPTZ DEFAULT now(),
//   crew_reported_ok BOOLEAN DEFAULT true,
//   independently_verified BOOLEAN DEFAULT false
// );
// CREATE INDEX ON vessel_health_items(vessel_key);
// CREATE INDEX ON vessel_health_items(status);
