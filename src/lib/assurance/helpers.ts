import type {
  AssuranceEvidenceLevel,
  WeeklyEvidencePack,
  WeeklyEvidencePackItem,
} from "@/lib/assurance/types";
import type {
  AssuranceSignalRow,
  VesselEngagementLogRow,
  VesselSupportItemRow,
} from "@/lib/persistence/types";

export const assuranceEvidenceLevelOptions: AssuranceEvidenceLevel[] = [
  "Fact",
  "Reported",
  "Inference",
  "Assumption",
];

export const assuranceConfidenceOptions = ["Low", "Medium", "High"] as const;

export const assuranceSignalStatusOptions = [
  "Open",
  "Tracking",
  "Needs specifics",
  "Blocked",
  "Closed",
] as const;

export const assuranceSignalSourceOptions = [
  "Email",
  "Meeting note",
  "Call",
  "Tracker entry",
  "Audit comment",
  "Document",
  "Other",
] as const;

export const supportCategoryOptions = [
  "Technical",
  "Class",
  "Safety",
  "Cargo",
  "Procurement",
  "SIRE",
  "Terminal",
  "Charterer",
  "Regulatory",
] as const;

export const supportPriorityOptions = ["Low", "Medium", "High", "Critical"] as const;

export const supportRiskLevelOptions = ["Low", "Medium", "High", "Critical"] as const;

export const supportBlockerOptions = [
  "None",
  "Spares",
  "Procurement",
  "Budget",
  "Class",
  "Vendor",
  "Approval",
  "Vessel Response",
  "Terminal",
  "Charterer",
] as const;

export const engagementTypeOptions = [
  "Call",
  "Email",
  "Meeting",
  "Visit",
  "Vendor Coordination",
  "Class Coordination",
] as const;

export const neutralGovernanceSignalExample =
  "Reported concern regarding possible direct vessel engagement outside normal superintendent communication loop. Supporting evidence not yet attached. To be treated as unverified governance signal pending confirmation.";

export const requestSpecificsTemplate = [
  "Request specifics:",
  "- Vessel",
  "- Issue",
  "- Date raised",
  "- Person who raised it",
  "- Expected support",
  "- Actual response",
  "- Current status",
  "- Required close-out",
].join("\n");

function cleanText(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function splitDelimitedText(value: string) {
  return cleanText(value);
}

export function buildWeeklyEvidencePack({
  signals,
  supportItems,
  engagementLogs,
}: {
  signals: AssuranceSignalRow[];
  supportItems: VesselSupportItemRow[];
  engagementLogs: VesselEngagementLogRow[];
}): WeeklyEvidencePack {
  const weekLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const packItem = (
    vessel: string,
    title: string,
    summary: string,
    owner: string,
    due_date: string | null,
    status: string,
    evidence_links: string[],
    extra?: Partial<WeeklyEvidencePackItem>,
  ): WeeklyEvidencePackItem => ({
    vessel,
    title,
    summary,
    owner,
    due_date,
    status,
    evidence_links,
    ...extra,
  });

  const delivered = supportItems
    .filter((item) => /closed/i.test(item.status) || /closed/i.test(item.current_status))
    .map((item) =>
      packItem(
        item.vessel,
        item.issue_title,
        `${item.next_action || item.office_support_required || item.issue_description}`,
        item.superintendent_owner,
        item.due_date,
        item.status,
        item.evidence_links ?? [],
        {
          linked_case_id: item.linked_case_id ?? null,
          blocker_type: item.blocker_type,
          source_id: item.source_signal_id ?? null,
        },
      ),
    );

  const escalated = supportItems
    .filter((item) => !/closed/i.test(item.status) && !/closed/i.test(item.current_status))
    .filter((item) => item.risk_level === "High" || item.risk_level === "Critical")
    .map((item) =>
      packItem(
        item.vessel,
        item.issue_title,
        item.issue_description,
        item.superintendent_owner,
        item.due_date,
        item.status,
        item.evidence_links ?? [],
        {
          linked_case_id: item.linked_case_id ?? null,
          blocker_type: item.blocker_type,
          source_id: item.source_signal_id ?? null,
        },
      ),
    );

  const pendingBlockers = supportItems
    .filter((item) => item.blocker_type !== "None")
    .filter((item) => !/closed/i.test(item.status) && !/closed/i.test(item.current_status))
    .map((item) =>
      packItem(
        item.vessel,
        item.issue_title,
        `Blocker type: ${item.blocker_type}. ${item.issue_description}`,
        item.superintendent_owner,
        item.due_date,
        item.status,
        item.evidence_links ?? [],
        {
          linked_case_id: item.linked_case_id ?? null,
          blocker_type: item.blocker_type,
          source_id: item.source_signal_id ?? null,
        },
      ),
    );

  const engagements = [...engagementLogs]
    .sort((left, right) => new Date(right.date_time).getTime() - new Date(left.date_time).getTime())
    .map((item) =>
      packItem(
        item.vessel,
        item.engagement_type,
        `${item.topics_discussed.join("; ")}${item.follow_up_required ? " Follow-up required." : ""}`,
        item.owner,
        item.due_date,
        item.follow_up_required ? "Follow-up required" : "Completed",
        item.evidence_link ? [item.evidence_link] : [],
        {
          linked_case_id: item.linked_case_id ?? null,
          blocker_type: item.linked_support_item_id ? "Support item link" : null,
          source_id: item.linked_signal_id ?? null,
        },
      ),
    );

  const prevented = signals
    .filter((signal) => signal.evidence_level === "Fact" || signal.evidence_level === "Inference")
    .filter((signal) => /closed/i.test(signal.status))
    .map((signal) =>
      packItem(
        signal.related_vessel_optional ?? "Unassigned / General",
        signal.signal_title,
        `${signal.operational_risk} ${signal.governance_risk}`.trim(),
        signal.action_owner,
        signal.due_date,
        signal.status,
        signal.evidence_links,
        {
          linked_case_id: signal.linked_case_id ?? null,
          source_id: signal.assurance_signal_id,
        },
      ),
    );

  const openActions = [
    ...supportItems.map((item) =>
      packItem(
        item.vessel,
        item.next_action,
        item.issue_description,
        item.superintendent_owner,
        item.due_date,
        item.status,
        item.evidence_links ?? [],
        {
          linked_case_id: item.linked_case_id ?? null,
          blocker_type: item.blocker_type,
          source_id: item.source_signal_id ?? null,
        },
      ),
    ),
    ...signals.map((signal) =>
      packItem(
        signal.related_vessel_optional ?? "Unassigned / General",
        signal.required_action,
        signal.summary,
        signal.action_owner,
        signal.due_date,
        signal.status,
        signal.evidence_links,
        {
          linked_case_id: signal.linked_case_id ?? null,
          source_id: signal.assurance_signal_id,
        },
      ),
    ),
  ]
    .filter((item) => !/closed/i.test(item.status))
    .sort((left, right) => {
      const leftDate = left.due_date ? new Date(left.due_date).getTime() : Number.POSITIVE_INFINITY;
      const rightDate = right.due_date ? new Date(right.due_date).getTime() : Number.POSITIVE_INFINITY;

      return leftDate - rightDate;
    });

  const managementGaps = supportItems
    .filter((item) => !/closed/i.test(item.status) && !/closed/i.test(item.current_status))
    .filter((item) =>
      ["Budget", "Approval", "Class", "Vendor", "Charterer"].includes(item.blocker_type),
    )
    .map((item) =>
      packItem(
        item.vessel,
        item.issue_title,
        item.office_support_required || item.next_action || item.issue_description,
        item.superintendent_owner,
        item.due_date,
        item.status,
        item.evidence_links ?? [],
        {
          linked_case_id: item.linked_case_id ?? null,
          blocker_type: item.blocker_type,
          source_id: item.source_signal_id ?? null,
        },
      ),
    );

  const nextWeek = [...openActions]
    .filter((item) => Boolean(item.due_date))
    .sort((left, right) => new Date(left.due_date ?? "").getTime() - new Date(right.due_date ?? "").getTime())
    .slice(0, 8);

  return {
    generated_at: new Date().toISOString(),
    week_label: weekLabel,
    vessel_support_delivered: delivered,
    critical_issues_escalated: escalated,
    pending_blockers_outside_superintendent_control: pendingBlockers,
    vessel_engagements_completed: engagements,
    commercial_safety_class_risks_prevented: prevented,
    open_actions_by_vessel: openActions,
    support_gaps_requiring_management_intervention: managementGaps,
    next_week_priorities: nextWeek,
  };
}

export function resolveSignalEvidenceLevel({
  requestedLevel,
  evidenceLinks,
}: {
  requestedLevel: AssuranceEvidenceLevel;
  evidenceLinks: string[];
}): { evidenceLevel: AssuranceEvidenceLevel; warning: string | null } {
  if (requestedLevel === "Fact" && evidenceLinks.length === 0) {
    return {
      evidenceLevel: "Reported",
      warning:
        "Fact was downgraded to Reported because no evidence link was attached. Add a linked evidence item before marking it as Fact.",
    };
  }

  return {
    evidenceLevel: requestedLevel,
    warning: null,
  };
}
