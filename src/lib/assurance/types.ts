export type AssuranceEvidenceLevel = "Fact" | "Reported" | "Inference" | "Assumption";
export type AssuranceConfidence = "Low" | "Medium" | "High";
export type AssuranceSignalStatus = "Open" | "Tracking" | "Needs specifics" | "Blocked" | "Closed";
export type AssuranceSupportCategory =
  | "Technical"
  | "Class"
  | "Safety"
  | "Cargo"
  | "Procurement"
  | "SIRE"
  | "Terminal"
  | "Charterer"
  | "Regulatory";
export type AssurancePriority = "Low" | "Medium" | "High" | "Critical";
export type AssuranceRiskLevel = "Low" | "Medium" | "High" | "Critical";
export type AssuranceBlockerType =
  | "None"
  | "Spares"
  | "Procurement"
  | "Budget"
  | "Class"
  | "Vendor"
  | "Approval"
  | "Vessel Response"
  | "Terminal"
  | "Charterer";
export type AssuranceEngagementType =
  | "Call"
  | "Email"
  | "Meeting"
  | "Visit"
  | "Vendor Coordination"
  | "Class Coordination";

export type WeeklyEvidencePackItem = {
  vessel: string;
  title: string;
  summary: string;
  owner: string;
  due_date: string | null;
  status: string;
  evidence_links: string[];
  linked_case_id?: string | null;
  blocker_type?: string | null;
  source_id?: string | null;
};

export type WeeklyEvidencePack = {
  generated_at: string;
  week_label: string;
  vessel_support_delivered: WeeklyEvidencePackItem[];
  critical_issues_escalated: WeeklyEvidencePackItem[];
  pending_blockers_outside_superintendent_control: WeeklyEvidencePackItem[];
  vessel_engagements_completed: WeeklyEvidencePackItem[];
  commercial_safety_class_risks_prevented: WeeklyEvidencePackItem[];
  open_actions_by_vessel: WeeklyEvidencePackItem[];
  support_gaps_requiring_management_intervention: WeeklyEvidencePackItem[];
  next_week_priorities: WeeklyEvidencePackItem[];
};
