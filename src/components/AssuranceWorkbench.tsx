"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  Link2,
  ShieldAlert,
  Ship,
  Sparkles,
  SquarePlus,
  Target,
  UserRound,
} from "lucide-react";
import { saveAssuranceSignalAction, saveVesselEngagementLogAction, saveVesselSupportItemAction } from "@/app/(protected)/assurance/actions";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { StatusBadge } from "@/components/StatusBadge";
import {
  assuranceConfidenceOptions,
  assuranceEvidenceLevelOptions,
  assuranceSignalStatusOptions,
  buildWeeklyEvidencePack,
  engagementTypeOptions,
  neutralGovernanceSignalExample,
  requestSpecificsTemplate,
  splitDelimitedText,
  supportBlockerOptions,
  supportCategoryOptions,
  supportPriorityOptions,
  supportRiskLevelOptions,
  assuranceSignalSourceOptions as sourceTypeOptions,
  resolveSignalEvidenceLevel,
} from "@/lib/assurance/helpers";
import type { WeeklyEvidencePackItem } from "@/lib/assurance/types";
import type {
  AssuranceSignalRow,
  CaseRow,
  VesselEngagementLogRow,
  VesselSupportItemRow,
} from "@/lib/persistence/types";
import type { EvidenceRecord } from "@/lib/mock-data";
import type { StatusTone } from "@/lib/mock-data";

type AssuranceTab = "signals" | "support" | "engagement" | "weekly";

type SignalFormState = {
  date_time: string;
  signal_title: string;
  signal_type: string;
  source_type: string;
  source_name_optional: string;
  audience: string;
  related_vessel_optional: string;
  related_department: string;
  summary: string;
  exact_comment_optional: string;
  evidence_level: AssuranceSignalRow["evidence_level"];
  confidence: AssuranceSignalRow["confidence"];
  operational_risk: string;
  reputational_risk: string;
  governance_risk: string;
  required_action: string;
  action_owner: string;
  due_date: string;
  status: AssuranceSignalRow["status"];
  evidence_links_text: string;
  notes: string;
  linked_case_id: string;
};

type SupportFormState = {
  vessel: string;
  issue_title: string;
  issue_description: string;
  date_raised: string;
  raised_by: string;
  category: VesselSupportItemRow["category"];
  priority: VesselSupportItemRow["priority"];
  risk_level: VesselSupportItemRow["risk_level"];
  superintendent_owner: string;
  vessel_owner: string;
  office_support_required: string;
  current_status: string;
  blocker_type: VesselSupportItemRow["blocker_type"];
  last_action_taken: string;
  last_contact_date: string;
  next_action: string;
  due_date: string;
  close_out_evidence: string;
  status: string;
  evidence_links_text: string;
  linked_case_id: string;
  source_signal_id: string;
};

type EngagementFormState = {
  vessel: string;
  date_time: string;
  engagement_type: VesselEngagementLogRow["engagement_type"];
  attendees_text: string;
  topics_discussed_text: string;
  actions_agreed_text: string;
  owner: string;
  due_date: string;
  follow_up_required: boolean;
  evidence_link: string;
  linked_case_id: string;
  linked_signal_id: string;
  linked_support_item_id: string;
};

type SaveNotice = {
  message: string;
  tone: "accent" | "warning" | "danger" | "neutral";
};

function nowDateTimeLocal() {
  return new Date().toISOString().slice(0, 16);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function joinList(values: string[] | undefined | null) {
  return values && values.length > 0 ? values.join("; ") : "None";
}

function statusTone(status: string): StatusTone {
  if (/closed/i.test(status)) {
    return "accent";
  }

  if (/blocked/i.test(status) || /needs specifics/i.test(status)) {
    return "danger";
  }

  if (/tracking/i.test(status) || /open/i.test(status)) {
    return "warning";
  }

  return "neutral";
}

function evidenceTone(level: AssuranceSignalRow["evidence_level"]): StatusTone {
  if (level === "Fact") {
    return "accent";
  }

  if (level === "Inference") {
    return "warning";
  }

  if (level === "Assumption") {
    return "danger";
  }

  return "neutral";
}

function confidenceTone(confidence: AssuranceSignalRow["confidence"]): StatusTone {
  if (confidence === "High") {
    return "accent";
  }

  if (confidence === "Medium") {
    return "warning";
  }

  return "danger";
}

function priorityTone(priority: VesselSupportItemRow["priority"]): StatusTone {
  if (priority === "Critical" || priority === "High") {
    return "danger";
  }

  if (priority === "Medium") {
    return "warning";
  }

  return "neutral";
}

function riskTone(risk: VesselSupportItemRow["risk_level"]) {
  if (risk === "Critical" || risk === "High") {
    return "danger";
  }

  if (risk === "Medium") {
    return "warning";
  }

  return "neutral";
}

function caseTitle(caseRows: CaseRow[], caseId: string | null | undefined) {
  if (!caseId) {
    return null;
  }

  return caseRows.find((item) => item.case_id === caseId)?.title ?? caseId;
}

function defaultSignalForm(): SignalFormState {
  return {
    date_time: nowDateTimeLocal(),
    signal_title: "",
    signal_type: "Governance signal",
    source_type: "Email",
    source_name_optional: "",
    audience: "Management",
    related_vessel_optional: "",
    related_department: "Operations",
    summary: "",
    exact_comment_optional: "",
    evidence_level: "Reported",
    confidence: "Medium",
    operational_risk: "",
    reputational_risk: "",
    governance_risk: "",
    required_action: "",
    action_owner: "Chief of Staff",
    due_date: todayDate(),
    status: "Open",
    evidence_links_text: "",
    notes: "",
    linked_case_id: "",
  };
}

function defaultSupportForm(): SupportFormState {
  return {
    vessel: "",
    issue_title: "",
    issue_description: "",
    date_raised: todayDate(),
    raised_by: "",
    category: "Technical",
    priority: "Medium",
    risk_level: "Medium",
    superintendent_owner: "Toye Omolade",
    vessel_owner: "",
    office_support_required: "",
    current_status: "Open",
    blocker_type: "None",
    last_action_taken: "",
    last_contact_date: todayDate(),
    next_action: "",
    due_date: todayDate(),
    close_out_evidence: "",
    status: "Tracking",
    evidence_links_text: "",
    linked_case_id: "",
    source_signal_id: "",
  };
}

function defaultEngagementForm(): EngagementFormState {
  return {
    vessel: "",
    date_time: nowDateTimeLocal(),
    engagement_type: "Call",
    attendees_text: "",
    topics_discussed_text: "",
    actions_agreed_text: "",
    owner: "Toye Omolade",
    due_date: todayDate(),
    follow_up_required: true,
    evidence_link: "",
    linked_case_id: "",
    linked_signal_id: "",
    linked_support_item_id: "",
  };
}

function evidenceLinksFromText(value: string) {
  return splitDelimitedText(value);
}

function toFormText(value: string[] | undefined | null) {
  return (value ?? []).join(", ");
}

function evidenceSummary(evidenceIds: string[], evidenceMap: Map<string, EvidenceRecord>) {
  if (evidenceIds.length === 0) {
    return "No evidence links attached";
  }

  return evidenceIds
    .map((id) => {
      const evidence = evidenceMap.get(id);
      return evidence ? `${evidence.evidenceId} · ${evidence.title}` : id;
    })
    .join("; ");
}

function weeklySectionTone(items: WeeklyEvidencePackItem[]): StatusTone {
  if (items.length > 0) {
    return "accent";
  }

  return "neutral";
}

export function AssuranceWorkbench({
  initialSignals,
  initialSupportItems,
  initialEngagementLogs,
  evidenceRecords,
  caseRows,
  persistenceEnabled,
}: {
  initialSignals: AssuranceSignalRow[];
  initialSupportItems: VesselSupportItemRow[];
  initialEngagementLogs: VesselEngagementLogRow[];
  evidenceRecords: EvidenceRecord[];
  caseRows: CaseRow[];
  persistenceEnabled: boolean;
}) {
  const [activeTab, setActiveTab] = useState<AssuranceTab>("signals");
  const [signals, setSignals] = useState<AssuranceSignalRow[]>(() => [...initialSignals]);
  const [supportItems, setSupportItems] = useState<VesselSupportItemRow[]>(() => [...initialSupportItems]);
  const [engagementLogs, setEngagementLogs] = useState<VesselEngagementLogRow[]>(() => [
    ...initialEngagementLogs,
  ]);
  const [signalForm, setSignalForm] = useState<SignalFormState>(() => defaultSignalForm());
  const [supportForm, setSupportForm] = useState<SupportFormState>(() => defaultSupportForm());
  const [engagementForm, setEngagementForm] = useState<EngagementFormState>(() => defaultEngagementForm());
  const [signalNotice, setSignalNotice] = useState<SaveNotice | null>(null);
  const [supportNotice, setSupportNotice] = useState<SaveNotice | null>(null);
  const [engagementNotice, setEngagementNotice] = useState<SaveNotice | null>(null);
  const [signalError, setSignalError] = useState<string | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [engagementError, setEngagementError] = useState<string | null>(null);
  const [savingSignal, setSavingSignal] = useState(false);
  const [savingSupport, setSavingSupport] = useState(false);
  const [savingEngagement, setSavingEngagement] = useState(false);

  const evidenceMap = useMemo(
    () => new Map(evidenceRecords.map((record) => [record.evidenceId, record] as const)),
    [evidenceRecords],
  );
  const sortedSignals = useMemo(
    () =>
      [...signals].sort(
        (left, right) => new Date(right.date_time).getTime() - new Date(left.date_time).getTime(),
      ),
    [signals],
  );
  const sortedSupportItems = useMemo(
    () =>
      [...supportItems].sort(
        (left, right) => new Date(right.date_raised).getTime() - new Date(left.date_raised).getTime(),
      ),
    [supportItems],
  );
  const sortedEngagementLogs = useMemo(
    () =>
      [...engagementLogs].sort(
        (left, right) => new Date(right.date_time).getTime() - new Date(left.date_time).getTime(),
      ),
    [engagementLogs],
  );
  const weeklyPack = useMemo(
    () =>
      buildWeeklyEvidencePack({
        signals,
        supportItems,
        engagementLogs,
      }),
    [engagementLogs, signals, supportItems],
  );

  const factCount = signals.filter((signal) => signal.evidence_level === "Fact").length;
  const reportedCount = signals.filter((signal) => signal.evidence_level === "Reported").length;
  const inferenceCount = signals.filter((signal) => signal.evidence_level === "Inference").length;
  const assumptionCount = signals.filter((signal) => signal.evidence_level === "Assumption").length;
  const supportOpenCount = supportItems.filter((item) => !/closed/i.test(item.status)).length;
  const supportBlockedCount = supportItems.filter(
    (item) => /blocked/i.test(item.current_status) || /blocked/i.test(item.status),
  ).length;
  const engagementFollowUpCount = engagementLogs.filter((item) => item.follow_up_required).length;

  async function handleSaveSignal() {
    if (savingSignal) {
      return;
    }

    setSavingSignal(true);
    setSignalError(null);
    setSignalNotice(null);

    try {
      const evidenceLinks = evidenceLinksFromText(signalForm.evidence_links_text);
      const resolved = resolveSignalEvidenceLevel({
        requestedLevel: signalForm.evidence_level,
        evidenceLinks,
      });

      const outcome = await saveAssuranceSignalAction({
        date_time: signalForm.date_time,
        signal_title: signalForm.signal_title.trim() || "Untitled assurance signal",
        signal_type: signalForm.signal_type.trim() || "Governance signal",
        source_type: signalForm.source_type.trim() || "Other",
        source_name_optional: signalForm.source_name_optional.trim() || null,
        audience: signalForm.audience.trim() || "Management",
        related_vessel_optional: signalForm.related_vessel_optional.trim() || null,
        related_department: signalForm.related_department.trim() || "Operations",
        summary: signalForm.summary.trim(),
        exact_comment_optional: signalForm.exact_comment_optional.trim() || null,
        evidence_level: resolved.evidenceLevel,
        confidence: signalForm.confidence,
        operational_risk: signalForm.operational_risk.trim(),
        reputational_risk: signalForm.reputational_risk.trim(),
        governance_risk: signalForm.governance_risk.trim(),
        required_action: signalForm.required_action.trim(),
        action_owner: signalForm.action_owner.trim() || "Chief of Staff",
        due_date: signalForm.due_date || null,
        status: signalForm.status ?? "Open",
        evidence_links: evidenceLinks,
        notes: signalForm.notes.trim(),
        linked_case_id: signalForm.linked_case_id || null,
      });

      const nextSignal = outcome.record;

      setSignals((current) => [
        nextSignal,
        ...current.filter((item) => item.assurance_signal_id !== nextSignal.assurance_signal_id),
      ]);
      setSignalNotice({
        message: outcome.note,
        tone: resolved.warning ? "warning" : outcome.persisted ? "accent" : "neutral",
      });
      setSignalForm(defaultSignalForm());
    } catch (error) {
      setSignalError(error instanceof Error ? error.message : "Unable to save assurance signal.");
    } finally {
      setSavingSignal(false);
    }
  }

  async function handleSaveSupportItem() {
    if (savingSupport) {
      return;
    }

    setSavingSupport(true);
    setSupportError(null);
    setSupportNotice(null);

    try {
      const outcome = await saveVesselSupportItemAction({
        vessel: supportForm.vessel.trim() || "Unassigned vessel",
        issue_title: supportForm.issue_title.trim() || "Untitled support item",
        issue_description: supportForm.issue_description.trim(),
        date_raised: supportForm.date_raised,
        raised_by: supportForm.raised_by.trim() || "Unknown",
        category: supportForm.category,
        priority: supportForm.priority,
        risk_level: supportForm.risk_level,
        superintendent_owner: supportForm.superintendent_owner.trim() || "Unassigned",
        vessel_owner: supportForm.vessel_owner.trim() || "Unassigned",
        office_support_required: supportForm.office_support_required.trim(),
        current_status: supportForm.current_status.trim() || "Open",
        blocker_type: supportForm.blocker_type,
        last_action_taken: supportForm.last_action_taken.trim(),
        last_contact_date: supportForm.last_contact_date || null,
        next_action: supportForm.next_action.trim(),
        due_date: supportForm.due_date || null,
        close_out_evidence: supportForm.close_out_evidence.trim(),
        status: supportForm.status.trim() || "Tracking",
        evidence_links: splitDelimitedText(supportForm.evidence_links_text),
        linked_case_id: supportForm.linked_case_id || null,
        source_signal_id: supportForm.source_signal_id || null,
      });

      const nextSupportItem = outcome.record;

      setSupportItems((current) => [
        nextSupportItem,
        ...current.filter((item) => item.support_item_id !== nextSupportItem.support_item_id),
      ]);
      setSupportNotice({
        message: outcome.note,
        tone: outcome.persisted ? "accent" : "neutral",
      });
      setSupportForm(defaultSupportForm());
    } catch (error) {
      setSupportError(error instanceof Error ? error.message : "Unable to save vessel support item.");
    } finally {
      setSavingSupport(false);
    }
  }

  async function handleSaveEngagementLog() {
    if (savingEngagement) {
      return;
    }

    setSavingEngagement(true);
    setEngagementError(null);
    setEngagementNotice(null);

    try {
      const outcome = await saveVesselEngagementLogAction({
        vessel: engagementForm.vessel.trim() || "Unassigned vessel",
        date_time: engagementForm.date_time,
        engagement_type: engagementForm.engagement_type,
        attendees: splitDelimitedText(engagementForm.attendees_text),
        topics_discussed: splitDelimitedText(engagementForm.topics_discussed_text),
        actions_agreed: splitDelimitedText(engagementForm.actions_agreed_text),
        owner: engagementForm.owner.trim() || "Unassigned",
        due_date: engagementForm.due_date || null,
        follow_up_required: engagementForm.follow_up_required,
        evidence_link: engagementForm.evidence_link.trim(),
        linked_case_id: engagementForm.linked_case_id || null,
        linked_signal_id: engagementForm.linked_signal_id || null,
        linked_support_item_id: engagementForm.linked_support_item_id || null,
      });

      const nextLog = outcome.record;

      setEngagementLogs((current) => [
        nextLog,
        ...current.filter((item) => item.engagement_log_id !== nextLog.engagement_log_id),
      ]);
      setEngagementNotice({
        message: outcome.note,
        tone: outcome.persisted ? "accent" : "neutral",
      });
      setEngagementForm(defaultEngagementForm());
    } catch (error) {
      setEngagementError(error instanceof Error ? error.message : "Unable to save vessel engagement log.");
    } finally {
      setSavingEngagement(false);
    }
  }

  function handleConvertSignalToSupportDraft(signal: AssuranceSignalRow) {
    if (!signal.related_vessel_optional?.trim()) {
      return;
    }

    setSupportForm({
      vessel: signal.related_vessel_optional,
      issue_title: signal.signal_title,
      issue_description: signal.summary,
      date_raised: signal.date_time.slice(0, 10),
      raised_by: signal.source_name_optional ?? signal.source_type,
      category: "Technical",
      priority: "High",
      risk_level: "High",
      superintendent_owner: signal.action_owner || "Toye Omolade",
      vessel_owner: signal.audience,
      office_support_required: signal.required_action,
      current_status: signal.status,
      blocker_type: "Vessel Response",
      last_action_taken: signal.notes || signal.exact_comment_optional || signal.required_action,
      last_contact_date: signal.date_time.slice(0, 10),
      next_action: signal.required_action,
      due_date: signal.due_date ?? "",
      close_out_evidence: signal.evidence_links.length > 0 ? signal.evidence_links.join(", ") : "Pending evidence attachment.",
      status: signal.status,
      evidence_links_text: toFormText(signal.evidence_links),
      linked_case_id: signal.linked_case_id ?? "",
      source_signal_id: signal.assurance_signal_id,
    });
    setActiveTab("support");
    setSupportNotice({
      message:
        "Support item draft loaded from the selected assurance signal. Complete the required specifics before saving.",
      tone: "warning",
    });
  }

  const tabButtonClass = (tab: AssuranceTab) =>
    `rounded-md border px-3 py-2 text-sm font-semibold transition ${
      activeTab === tab
        ? "border-teal-300 bg-teal-50 text-teal-900"
        : "border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:text-teal-800"
    }`;

  return (
    <section className="space-y-6">
      <header className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-end">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Assurance</p>
          <h1 className="text-3xl font-bold text-slate-950">Vessel assurance and governance tracker</h1>
          <p className="max-w-4xl text-sm leading-6 text-slate-600">
            Capture support feedback, vessel comments, audit notes, and governance signals as
            evidence-backed records. Keep the language neutral, track the actions, and avoid
            turning reported concerns into unsupported facts.
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Persistence state
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {persistenceEnabled ? "Repository connected" : "Session fallback only"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {persistenceEnabled
              ? "Assurance records write through the repository first."
              : "Assurance records stay in this session until persistence becomes available."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/cases" className="btn-secondary">
              <ArrowRight aria-hidden size={14} />
              Cases
            </Link>
            <Link href="/import" className="btn-secondary">
              <ArrowRight aria-hidden size={14} />
              Import
            </Link>
          </div>
        </div>
      </header>

      <CollapsibleSection
        title="Guardrails"
        description="Fact requires evidence. Reported, Inference, and Assumption stay separate, and neutral wording stays visible."
        summaryBadge={
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            No political diary
          </span>
        }
        defaultOpen={false}
        className="overflow-hidden"
        bodyClassName="p-4 pt-0"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Evidence levels and neutral wording
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Fact = directly evidenced. Reported = stated but not independently verified.
              Inference = reasonable interpretation from multiple signals. Assumption = possible
              explanation with limited evidence.
            </p>
            <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              <span className="font-semibold">Neutral example:</span> {neutralGovernanceSignalExample}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            No sentiment scoring or disciplinary conclusions
          </div>
        </div>
      </CollapsibleSection>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabButtonClass("signals")} onClick={() => setActiveTab("signals")}>
          Assurance Signals
        </button>
        <button type="button" className={tabButtonClass("support")} onClick={() => setActiveTab("support")}>
          Vessel Support Items
        </button>
        <button type="button" className={tabButtonClass("engagement")} onClick={() => setActiveTab("engagement")}>
          Vessel Engagement Log
        </button>
        <button type="button" className={tabButtonClass("weekly")} onClick={() => setActiveTab("weekly")}>
          Weekly Evidence Pack
        </button>
      </div>

      {activeTab === "signals" ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniStat label="Signals" value={signals.length} icon={<ShieldAlert aria-hidden size={16} />} />
              <MiniStat label="Fact-backed" value={factCount} icon={<Target aria-hidden size={16} />} />
              <MiniStat label="Reported" value={reportedCount} icon={<CircleAlert aria-hidden size={16} />} />
              <MiniStat label="Inference / Assumption" value={inferenceCount + assumptionCount} icon={<Sparkles aria-hidden size={16} />} />
            </div>

            <div className="space-y-3">
              {sortedSignals.length > 0 ? (
                sortedSignals.map((signal) => {
                  const canConvert = Boolean(signal.related_vessel_optional?.trim() && signal.required_action.trim());
                  return (
                    <article key={signal.assurance_signal_id} className="card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge tone={evidenceTone(signal.evidence_level)}>
                              {signal.evidence_level}
                            </StatusBadge>
                            <StatusBadge tone={confidenceTone(signal.confidence)}>
                              {signal.confidence} confidence
                            </StatusBadge>
                            <StatusBadge tone={statusTone(signal.status)}>{signal.status}</StatusBadge>
                            {signal.linked_case_id ? (
                              <StatusBadge tone="accent">
                                Linked to case: {caseTitle(caseRows, signal.linked_case_id)}
                              </StatusBadge>
                            ) : (
                              <StatusBadge tone="neutral">Not linked to case</StatusBadge>
                            )}
                          </div>
                          <h3 className="mt-2 text-xl font-bold text-slate-950">{signal.signal_title}</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {signal.signal_type} · {signal.source_type}
                          </p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {formatDateTime(signal.date_time)}
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        <FieldSummary label="Audience" value={signal.audience} />
                        <FieldSummary label="Related department" value={signal.related_department} />
                        <FieldSummary
                          label="Related vessel"
                          value={signal.related_vessel_optional ?? "Unassigned / General"}
                        />
                        <FieldSummary label="Source name" value={signal.source_name_optional ?? "Anonymous or not recorded"} />
                      </div>

                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        <FieldSummary label="Summary" value={signal.summary} />
                        <FieldSummary
                          label="Exact comment"
                          value={signal.exact_comment_optional ?? "Not attached"}
                        />
                        <FieldSummary label="Operational risk" value={signal.operational_risk} />
                        <FieldSummary label="Governance risk" value={signal.governance_risk} />
                        <FieldSummary label="Reputational risk" value={signal.reputational_risk} />
                        <FieldSummary label="Required action" value={signal.required_action} />
                        <FieldSummary label="Action owner" value={signal.action_owner} />
                        <FieldSummary label="Due date" value={formatDate(signal.due_date)} />
                      </div>

                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        <FieldSummary
                          label="Evidence links"
                          value={evidenceSummary(signal.evidence_links, evidenceMap)}
                        />
                        <FieldSummary label="Notes" value={signal.notes || "None"} />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Link href="/import" className="btn-secondary">
                          <Link2 aria-hidden size={14} />
                          Link to evidence
                        </Link>
                        <Link href="/cases" className="btn-secondary">
                          <Link2 aria-hidden size={14} />
                          Link to case
                        </Link>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={!canConvert}
                          onClick={() => handleConvertSignalToSupportDraft(signal)}
                        >
                          <SquarePlus aria-hidden size={14} />
                          Convert to support item
                        </button>
                        {!canConvert ? (
                          <span className="text-xs text-slate-500">
                            Add vessel specificity before converting this signal into a support item.
                          </span>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <EmptyState
                  title="No assurance signals yet"
                  message="Capture a reported concern, a fact-backed signal, or a governance observation to start the tracker."
                />
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <section className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                    Request specifics
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-950">Broad feedback prompt</h3>
                </div>
                <CalendarDays aria-hidden className="text-teal-700" size={16} />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use this when a management email or anonymous comment is too broad to become a
                support item yet.
              </p>
              <button
                type="button"
                className="btn-secondary mt-3 w-full"
                onClick={() =>
                  setSignalForm((current) => ({
                    ...current,
                    notes: requestSpecificsTemplate,
                  }))
                }
              >
                Request specifics
              </button>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Capture vessel, issue, date raised, who raised it, expected support, actual
                response, current status, and required close-out.
              </p>
            </section>

            <section className="card p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                New signal
              </p>
              <div className="mt-3 space-y-3">
                <TextField
                  label="Signal title"
                  value={signalForm.signal_title}
                  onChange={(value) => setSignalForm((current) => ({ ...current, signal_title: value }))}
                  placeholder="Reported concern regarding ..."
                />
                <TextField
                  label="Source type"
                  value={signalForm.source_type}
                  onChange={(value) => setSignalForm((current) => ({ ...current, source_type: value }))}
                  placeholder="Email, meeting note, call..."
                  list={sourceTypeOptions}
                />
                <TextField
                  label="Source name / sender"
                  value={signalForm.source_name_optional}
                  onChange={(value) => setSignalForm((current) => ({ ...current, source_name_optional: value }))}
                  placeholder="Anonymous circulation, manager, surveyor..."
                />
                <TextField
                  label="Audience"
                  value={signalForm.audience}
                  onChange={(value) => setSignalForm((current) => ({ ...current, audience: value }))}
                  placeholder="Management, superintendent team..."
                />
                <TextField
                  label="Related vessel"
                  value={signalForm.related_vessel_optional}
                  onChange={(value) =>
                    setSignalForm((current) => ({ ...current, related_vessel_optional: value }))
                  }
                  placeholder="LPG ALFRED TEMILE 10"
                />
                <TextField
                  label="Related department"
                  value={signalForm.related_department}
                  onChange={(value) =>
                    setSignalForm((current) => ({ ...current, related_department: value }))
                  }
                  placeholder="Technical Operations, HSSEQ..."
                />
                <TextAreaField
                  label="Summary"
                  value={signalForm.summary}
                  onChange={(value) => setSignalForm((current) => ({ ...current, summary: value }))}
                  placeholder="Summarize the concern without turning it into a conclusion."
                />
                <TextAreaField
                  label="Exact comment"
                  value={signalForm.exact_comment_optional}
                  onChange={(value) =>
                    setSignalForm((current) => ({ ...current, exact_comment_optional: value }))
                  }
                  placeholder="Optional direct quote or note..."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    label="Evidence level"
                    value={signalForm.evidence_level}
                    onChange={(value) =>
                      setSignalForm((current) => ({
                        ...current,
                        evidence_level: value as SignalFormState["evidence_level"],
                      }))
                    }
                    options={assuranceEvidenceLevelOptions}
                  />
                  <SelectField
                    label="Confidence"
                    value={signalForm.confidence}
                    onChange={(value) =>
                      setSignalForm((current) => ({
                        ...current,
                        confidence: value as SignalFormState["confidence"],
                      }))
                    }
                    options={assuranceConfidenceOptions}
                  />
                </div>
                <TextAreaField
                  label="Operational risk"
                  value={signalForm.operational_risk}
                  onChange={(value) =>
                    setSignalForm((current) => ({ ...current, operational_risk: value }))
                  }
                  placeholder="Operational risk, if any..."
                />
                <TextAreaField
                  label="Reputational risk"
                  value={signalForm.reputational_risk}
                  onChange={(value) =>
                    setSignalForm((current) => ({ ...current, reputational_risk: value }))
                  }
                  placeholder="Reputational risk, if any..."
                />
                <TextAreaField
                  label="Governance risk"
                  value={signalForm.governance_risk}
                  onChange={(value) =>
                    setSignalForm((current) => ({ ...current, governance_risk: value }))
                  }
                  placeholder="Governance risk, if any..."
                />
                <TextAreaField
                  label="Required action"
                  value={signalForm.required_action}
                  onChange={(value) =>
                    setSignalForm((current) => ({ ...current, required_action: value }))
                  }
                  placeholder="What needs to happen next?"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Action owner"
                    value={signalForm.action_owner}
                    onChange={(value) => setSignalForm((current) => ({ ...current, action_owner: value }))}
                    placeholder="Chief of Staff"
                  />
                  <TextField
                    label="Due date"
                    value={signalForm.due_date}
                    onChange={(value) => setSignalForm((current) => ({ ...current, due_date: value }))}
                    type="date"
                  />
                </div>
                <TextField
                  label="Status"
                  value={signalForm.status}
                  onChange={(value) =>
                    setSignalForm((current) => ({
                      ...current,
                      status: value as SignalFormState["status"],
                    }))
                  }
                  placeholder="Open, tracking, needs specifics..."
                  list={assuranceSignalStatusOptions}
                />
                <TextField
                  label="Linked case"
                  value={signalForm.linked_case_id}
                  onChange={(value) => setSignalForm((current) => ({ ...current, linked_case_id: value }))}
                  placeholder="Optional case ID"
                />
                <TextAreaField
                  label="Evidence links / IDs"
                  value={signalForm.evidence_links_text}
                  onChange={(value) =>
                    setSignalForm((current) => ({ ...current, evidence_links_text: value }))
                  }
                  placeholder="EVID-019-1, EVID-011-1"
                />
                <TextAreaField
                  label="Notes"
                  value={signalForm.notes}
                  onChange={(value) => setSignalForm((current) => ({ ...current, notes: value }))}
                  placeholder="Neutral note, guardrail, or request specifics..."
                />

                {signalForm.evidence_level === "Fact" &&
                evidenceLinksFromText(signalForm.evidence_links_text).length === 0 ? (
                  <NoticeBox
                    message="Fact needs at least one evidence link. Save will be downgraded to Reported until evidence is attached."
                    tone="warning"
                  />
                ) : null}

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  <p className="font-semibold text-slate-900">Fact guardrail</p>
                  <p className="mt-1">
                    Marking something as Fact needs a linked evidence item. Without one, the save
                    action will downgrade the record to Reported and show a warning.
                  </p>
                </div>

                {signalNotice ? (
                  <NoticeBox message={signalNotice.message} tone={signalNotice.tone} />
                ) : null}
                {signalError ? <NoticeBox message={signalError} tone="danger" /> : null}

                <button type="button" className="btn-primary w-full" disabled={savingSignal} onClick={handleSaveSignal}>
                  {savingSignal ? "Saving..." : "Save assurance signal"}
                </button>
              </div>
            </section>
          </aside>
        </section>
      ) : null}

      {activeTab === "support" ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniStat label="Support items" value={supportItems.length} icon={<Ship aria-hidden size={16} />} />
              <MiniStat label="Open items" value={supportOpenCount} icon={<Target aria-hidden size={16} />} />
              <MiniStat label="Blocked" value={supportBlockedCount} icon={<CircleAlert aria-hidden size={16} />} />
              <MiniStat label="Linked to case" value={supportItems.filter((item) => Boolean(item.linked_case_id)).length} icon={<Link2 aria-hidden size={16} />} />
            </div>

            <div className="space-y-3">
              {sortedSupportItems.length > 0 ? (
                sortedSupportItems.map((item) => (
                  <article key={item.support_item_id} className="card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge tone={priorityTone(item.priority)}>{item.priority}</StatusBadge>
                          <StatusBadge tone={riskTone(item.risk_level)}>{item.risk_level} risk</StatusBadge>
                          <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
                          {item.linked_case_id ? (
                            <StatusBadge tone="accent">
                              Linked to case: {caseTitle(caseRows, item.linked_case_id)}
                            </StatusBadge>
                          ) : (
                            <StatusBadge tone="neutral">Not linked to case</StatusBadge>
                          )}
                        </div>
                        <h3 className="mt-2 text-xl font-bold text-slate-950">{item.issue_title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {item.vessel} · Raised by {item.raised_by}
                        </p>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Due {formatDate(item.due_date)}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <FieldSummary label="Issue" value={item.issue_description} />
                      <FieldSummary label="Office support required" value={item.office_support_required} />
                      <FieldSummary label="Current status" value={item.current_status} />
                      <FieldSummary label="Blocker type" value={item.blocker_type} />
                      <FieldSummary label="Superintendent owner" value={item.superintendent_owner} />
                      <FieldSummary label="Vessel owner" value={item.vessel_owner} />
                      <FieldSummary label="Last action taken" value={item.last_action_taken} />
                      <FieldSummary label="Next action" value={item.next_action} />
                      <FieldSummary label="Close-out evidence" value={item.close_out_evidence} />
                      <FieldSummary label="Evidence links" value={evidenceSummary(item.evidence_links, evidenceMap)} />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Link href="/cases" className="btn-secondary">
                        <ArrowRight aria-hidden size={14} />
                        Link to case
                      </Link>
                      <Link href="/import" className="btn-secondary">
                        <ArrowRight aria-hidden size={14} />
                        Link to evidence
                      </Link>
                      {item.source_signal_id ? (
                        <StatusBadge tone="neutral">Source signal: {item.source_signal_id}</StatusBadge>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No support items yet"
                  message="Convert a signal when the vessel and issue are specific enough, then track the action to close-out."
                />
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <CollapsibleSection
              title="Support item guidance"
              description="A support item is where the broad feedback becomes a vessel-specific tracked action. Keep the wording neutral and avoid turning the signal into an allegation."
              defaultOpen={false}
              className="overflow-hidden"
              bodyClassName="p-4 pt-0"
            >
              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                <p className="font-semibold text-slate-900">Required specificity before action</p>
                <p className="mt-1">
                  vessel, issue, date raised, person who raised it, expected support, actual
                  response, current status, and required close-out.
                </p>
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="New support item"
              description="Convert verified issues into a vessel-specific tracked action."
              defaultOpen={false}
              className="overflow-hidden"
              bodyClassName="p-4 pt-0"
            >
              <div className="mt-3 space-y-3">
                <TextField
                  label="Vessel"
                  value={supportForm.vessel}
                  onChange={(value) => setSupportForm((current) => ({ ...current, vessel: value }))}
                  placeholder="LPG ALFRED TEMILE 10"
                />
                <TextField
                  label="Issue title"
                  value={supportForm.issue_title}
                  onChange={(value) =>
                    setSupportForm((current) => ({ ...current, issue_title: value }))
                  }
                  placeholder="Technical support concern"
                />
                <TextAreaField
                  label="Issue description"
                  value={supportForm.issue_description}
                  onChange={(value) =>
                    setSupportForm((current) => ({ ...current, issue_description: value }))
                  }
                  placeholder="Describe the issue and keep it factual."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Date raised"
                    value={supportForm.date_raised}
                    onChange={(value) =>
                      setSupportForm((current) => ({ ...current, date_raised: value }))
                    }
                    type="date"
                  />
                  <TextField
                    label="Raised by"
                    value={supportForm.raised_by}
                    onChange={(value) => setSupportForm((current) => ({ ...current, raised_by: value }))}
                    placeholder="Anonymous management circulation"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    label="Category"
                    value={supportForm.category}
                    onChange={(value) =>
                      setSupportForm((current) => ({ ...current, category: value as SupportFormState["category"] }))
                    }
                    options={supportCategoryOptions}
                  />
                  <SelectField
                    label="Priority"
                    value={supportForm.priority}
                    onChange={(value) =>
                      setSupportForm((current) => ({ ...current, priority: value as SupportFormState["priority"] }))
                    }
                    options={supportPriorityOptions}
                  />
                  <SelectField
                    label="Risk level"
                    value={supportForm.risk_level}
                    onChange={(value) =>
                      setSupportForm((current) => ({ ...current, risk_level: value as SupportFormState["risk_level"] }))
                    }
                    options={supportRiskLevelOptions}
                  />
                  <SelectField
                    label="Blocker type"
                    value={supportForm.blocker_type}
                    onChange={(value) =>
                      setSupportForm((current) => ({ ...current, blocker_type: value as SupportFormState["blocker_type"] }))
                    }
                    options={supportBlockerOptions}
                  />
                </div>
                <TextField
                  label="Superintendent owner"
                  value={supportForm.superintendent_owner}
                  onChange={(value) =>
                    setSupportForm((current) => ({ ...current, superintendent_owner: value }))
                  }
                  placeholder="Toye Omolade"
                />
                <TextField
                  label="Vessel owner"
                  value={supportForm.vessel_owner}
                  onChange={(value) => setSupportForm((current) => ({ ...current, vessel_owner: value }))}
                  placeholder="Operations"
                />
                <TextAreaField
                  label="Office support required"
                  value={supportForm.office_support_required}
                  onChange={(value) =>
                    setSupportForm((current) => ({ ...current, office_support_required: value }))
                  }
                  placeholder="What the office needs to provide..."
                />
                <TextField
                  label="Current status"
                  value={supportForm.current_status}
                  onChange={(value) =>
                    setSupportForm((current) => ({ ...current, current_status: value }))
                  }
                  placeholder="Open, blocked, tracking..."
                />
                <TextAreaField
                  label="Last action taken"
                  value={supportForm.last_action_taken}
                  onChange={(value) =>
                    setSupportForm((current) => ({ ...current, last_action_taken: value }))
                  }
                  placeholder="What was last done?"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Last contact date"
                    value={supportForm.last_contact_date}
                    onChange={(value) =>
                      setSupportForm((current) => ({ ...current, last_contact_date: value }))
                    }
                    type="date"
                  />
                  <TextField
                    label="Due date"
                    value={supportForm.due_date}
                    onChange={(value) => setSupportForm((current) => ({ ...current, due_date: value }))}
                    type="date"
                  />
                </div>
                <TextAreaField
                  label="Next action"
                  value={supportForm.next_action}
                  onChange={(value) => setSupportForm((current) => ({ ...current, next_action: value }))}
                  placeholder="What should happen next?"
                />
                <TextAreaField
                  label="Close-out evidence"
                  value={supportForm.close_out_evidence}
                  onChange={(value) =>
                    setSupportForm((current) => ({ ...current, close_out_evidence: value }))
                  }
                  placeholder="What proves the item is closed?"
                />
                <TextField
                  label="Status"
                  value={supportForm.status}
                  onChange={(value) => setSupportForm((current) => ({ ...current, status: value }))}
                  placeholder="Tracking, blocked, closed..."
                />
                <TextField
                  label="Linked case"
                  value={supportForm.linked_case_id}
                  onChange={(value) => setSupportForm((current) => ({ ...current, linked_case_id: value }))}
                  placeholder="Optional case ID"
                />
                <TextField
                  label="Source signal ID"
                  value={supportForm.source_signal_id}
                  onChange={(value) =>
                    setSupportForm((current) => ({ ...current, source_signal_id: value }))
                  }
                  placeholder="Optional assurance signal ID"
                />
                <TextAreaField
                  label="Evidence links / IDs"
                  value={supportForm.evidence_links_text}
                  onChange={(value) =>
                    setSupportForm((current) => ({ ...current, evidence_links_text: value }))
                  }
                  placeholder="EVID-019-1, EVID-011-1"
                />

                {supportNotice ? <NoticeBox message={supportNotice.message} tone={supportNotice.tone} /> : null}
                {supportError ? <NoticeBox message={supportError} tone="danger" /> : null}
                <button type="button" className="btn-primary w-full" disabled={savingSupport} onClick={handleSaveSupportItem}>
                  {savingSupport ? "Saving..." : "Save support item"}
                </button>
              </div>
            </CollapsibleSection>
          </aside>
        </section>
      ) : null}

      {activeTab === "engagement" ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniStat label="Engagement logs" value={engagementLogs.length} icon={<UserRound aria-hidden size={16} />} />
              <MiniStat label="Follow-up required" value={engagementFollowUpCount} icon={<Target aria-hidden size={16} />} />
              <MiniStat label="Linked signals" value={engagementLogs.filter((item) => Boolean(item.linked_signal_id)).length} icon={<Link2 aria-hidden size={16} />} />
              <MiniStat label="Linked support items" value={engagementLogs.filter((item) => Boolean(item.linked_support_item_id)).length} icon={<Ship aria-hidden size={16} />} />
            </div>

            <div className="space-y-3">
              {sortedEngagementLogs.length > 0 ? (
                sortedEngagementLogs.map((log) => (
                  <article key={log.engagement_log_id} className="card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge tone="neutral">{log.engagement_type}</StatusBadge>
                          <StatusBadge tone={log.follow_up_required ? "warning" : "accent"}>
                            {log.follow_up_required ? "Follow-up required" : "No follow-up required"}
                          </StatusBadge>
                          {log.linked_case_id ? (
                            <StatusBadge tone="accent">
                              Case: {caseTitle(caseRows, log.linked_case_id)}
                            </StatusBadge>
                          ) : (
                            <StatusBadge tone="neutral">Not linked to case</StatusBadge>
                          )}
                        </div>
                        <h3 className="mt-2 text-xl font-bold text-slate-950">{log.vessel}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {formatDateTime(log.date_time)} · Owner: {log.owner}
                        </p>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Due {formatDate(log.due_date)}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <FieldSummary label="Attendees" value={joinList(log.attendees)} />
                      <FieldSummary label="Topics discussed" value={joinList(log.topics_discussed)} />
                      <FieldSummary label="Actions agreed" value={joinList(log.actions_agreed)} />
                      <FieldSummary label="Evidence link" value={log.evidence_link || "None"} />
                      <FieldSummary
                        label="Linked signal"
                        value={log.linked_signal_id ?? "Not linked"}
                      />
                      <FieldSummary
                        label="Linked support item"
                        value={log.linked_support_item_id ?? "Not linked"}
                      />
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No engagement logs yet"
                  message="Capture calls, meetings, visits, or coordination notes so the support trail stays visible."
                />
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <CollapsibleSection
              title="Engagement log guidance"
              description="The log is a factual record of what was discussed and what was agreed. Keep it short, structured, and tied to evidence when possible."
              defaultOpen={false}
              className="overflow-hidden"
              bodyClassName="p-4 pt-0"
            >
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The log is a factual record of what was discussed and what was agreed. Keep it
                short, structured, and tied to evidence when possible.
              </p>
            </CollapsibleSection>

            <CollapsibleSection
              title="New engagement log"
              description="Capture calls, meetings, visits, or coordination notes so the support trail stays visible."
              defaultOpen={false}
              className="overflow-hidden"
              bodyClassName="p-4 pt-0"
            >
              <div className="mt-3 space-y-3">
                <TextField
                  label="Vessel"
                  value={engagementForm.vessel}
                  onChange={(value) =>
                    setEngagementForm((current) => ({ ...current, vessel: value }))
                  }
                  placeholder="LPG ALFRED TEMILE 10"
                />
                <TextField
                  label="Date and time"
                  value={engagementForm.date_time}
                  onChange={(value) =>
                    setEngagementForm((current) => ({ ...current, date_time: value }))
                  }
                  type="datetime-local"
                />
                <SelectField
                  label="Engagement type"
                  value={engagementForm.engagement_type}
                  onChange={(value) =>
                    setEngagementForm((current) => ({
                      ...current,
                      engagement_type: value as EngagementFormState["engagement_type"],
                    }))
                  }
                  options={engagementTypeOptions}
                />
                <TextField
                  label="Attendees"
                  value={engagementForm.attendees_text}
                  onChange={(value) =>
                    setEngagementForm((current) => ({ ...current, attendees_text: value }))
                  }
                  placeholder="Superintendent, Chief Engineer"
                />
                <TextAreaField
                  label="Topics discussed"
                  value={engagementForm.topics_discussed_text}
                  onChange={(value) =>
                    setEngagementForm((current) => ({ ...current, topics_discussed_text: value }))
                  }
                  placeholder="One topic per line or comma-separated"
                />
                <TextAreaField
                  label="Actions agreed"
                  value={engagementForm.actions_agreed_text}
                  onChange={(value) =>
                    setEngagementForm((current) => ({ ...current, actions_agreed_text: value }))
                  }
                  placeholder="One agreed action per line or comma-separated"
                />
                <TextField
                  label="Owner"
                  value={engagementForm.owner}
                  onChange={(value) => setEngagementForm((current) => ({ ...current, owner: value }))}
                  placeholder="Toye Omolade"
                />
                <TextField
                  label="Due date"
                  value={engagementForm.due_date}
                  onChange={(value) => setEngagementForm((current) => ({ ...current, due_date: value }))}
                  type="date"
                />
                <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={engagementForm.follow_up_required}
                    onChange={(event) =>
                      setEngagementForm((current) => ({
                        ...current,
                        follow_up_required: event.target.checked,
                      }))
                    }
                  />
                  Follow-up required
                </label>
                <TextField
                  label="Evidence link"
                  value={engagementForm.evidence_link}
                  onChange={(value) =>
                    setEngagementForm((current) => ({ ...current, evidence_link: value }))
                  }
                  placeholder="Call note placeholder / EVID-019-1"
                />
                <TextField
                  label="Linked case"
                  value={engagementForm.linked_case_id}
                  onChange={(value) =>
                    setEngagementForm((current) => ({ ...current, linked_case_id: value }))
                  }
                  placeholder="Optional case ID"
                />
                <TextField
                  label="Linked signal ID"
                  value={engagementForm.linked_signal_id}
                  onChange={(value) =>
                    setEngagementForm((current) => ({ ...current, linked_signal_id: value }))
                  }
                  placeholder="Optional assurance signal ID"
                />
                <TextField
                  label="Linked support item ID"
                  value={engagementForm.linked_support_item_id}
                  onChange={(value) =>
                    setEngagementForm((current) => ({ ...current, linked_support_item_id: value }))
                  }
                  placeholder="Optional support item ID"
                />

                {engagementNotice ? (
                  <NoticeBox message={engagementNotice.message} tone={engagementNotice.tone} />
                ) : null}
                {engagementError ? <NoticeBox message={engagementError} tone="danger" /> : null}
                <button
                  type="button"
                  className="btn-primary w-full"
                  disabled={savingEngagement}
                  onClick={handleSaveEngagementLog}
                >
                  {savingEngagement ? "Saving..." : "Save engagement log"}
                </button>
              </div>
            </CollapsibleSection>
          </aside>
        </section>
      ) : null}

      {activeTab === "weekly" ? (
        <section className="space-y-4">
          <div className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                  Weekly Evidence Pack
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Deterministic weekly summary</h2>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                  This pack is assembled from the current assurance, support, and engagement
                  records. It does not use AI and it does not invent conclusions.
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Generated {formatDateTime(weeklyPack.generated_at)}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MiniStat label="Support delivered" value={weeklyPack.vessel_support_delivered.length} icon={<Ship aria-hidden size={16} />} />
            <MiniStat label="Critical issues escalated" value={weeklyPack.critical_issues_escalated.length} icon={<CircleAlert aria-hidden size={16} />} />
            <MiniStat label="Open blockers" value={weeklyPack.pending_blockers_outside_superintendent_control.length} icon={<Target aria-hidden size={16} />} />
            <MiniStat label="Engagements completed" value={weeklyPack.vessel_engagements_completed.length} icon={<UserRound aria-hidden size={16} />} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <WeeklyPackSection
              title="Vessel support delivered"
              description="Support items that are complete or closed out."
              items={weeklyPack.vessel_support_delivered}
              emptyMessage="No support items have been marked closed yet."
            />
            <WeeklyPackSection
              title="Critical issues escalated"
              description="High or critical items that still need attention."
              items={weeklyPack.critical_issues_escalated}
              emptyMessage="No critical issues are currently escalated."
            />
            <WeeklyPackSection
              title="Pending blockers outside superintendent control"
              description="Items held up by factors outside the superintendent path."
              items={weeklyPack.pending_blockers_outside_superintendent_control}
              emptyMessage="No blockers outside superintendent control are currently open."
            />
            <WeeklyPackSection
              title="Vessel engagements completed"
              description="Calls, meetings, visits, and coordination notes captured in the log."
              items={weeklyPack.vessel_engagements_completed}
              emptyMessage="No engagement logs are captured yet."
            />
            <WeeklyPackSection
              title="Commercial / safety / class risks prevented"
              description="Signals that have been contained or closed with evidence."
              items={weeklyPack.commercial_safety_class_risks_prevented}
              emptyMessage="No risk-prevention items have been closed yet."
            />
            <WeeklyPackSection
              title="Open actions by vessel"
              description="The current action trail that still needs attention."
              items={weeklyPack.open_actions_by_vessel}
              emptyMessage="No open actions are currently captured."
            />
            <WeeklyPackSection
              title="Support gaps requiring management intervention"
              description="Items that need a decision, budget, vendor, class, or charterer push."
              items={weeklyPack.support_gaps_requiring_management_intervention}
              emptyMessage="No management intervention gaps are currently open."
            />
            <WeeklyPackSection
              title="Next week priorities"
              description="The most time-sensitive open items from the current records."
              items={weeklyPack.next_week_priorities}
              emptyMessage="No due items are currently scheduled for next week."
            />
          </div>
        </section>
      ) : null}
    </section>
  );
}

function WeeklyPackSection({
  title,
  description,
  items,
  emptyMessage,
}: {
  title: string;
  description: string;
  items: WeeklyEvidencePackItem[];
  emptyMessage: string;
}) {
  return (
    <section className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <StatusBadge tone={weeklySectionTone(items)}>{items.length}</StatusBadge>
      </div>

      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <article key={`${item.vessel}-${item.title}-${item.owner}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-950">{item.vessel}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{item.title}</p>
                </div>
                <StatusBadge tone="neutral">{item.status}</StatusBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <FieldSummary label="Owner" value={item.owner} />
                <FieldSummary label="Due date" value={formatDate(item.due_date)} />
                <FieldSummary
                  label="Evidence links"
                  value={item.evidence_links.length > 0 ? item.evidence_links.join(", ") : "None"}
                />
                <FieldSummary
                  label="Case / blocker"
                  value={item.linked_case_id ?? item.blocker_type ?? "None"}
                />
              </div>
            </article>
          ))
        ) : (
          <EmptyState title={title} message={emptyMessage} />
        )}
      </div>
    </section>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <span className="text-teal-700">{icon}</span>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function FieldSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value || "None"}</p>
    </div>
  );
}

function NoticeBox({ message, tone }: { message: string; tone: SaveNotice["tone"] }) {
  const toneClasses: Record<SaveNotice["tone"], string> = {
    accent: "border-teal-200 bg-teal-50 text-teal-950",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    danger: "border-red-200 bg-red-50 text-red-950",
    neutral: "border-slate-200 bg-slate-50 text-slate-800",
  };

  return <div className={`rounded-md border px-3 py-2 text-sm leading-6 ${toneClasses[tone]}`}>{message}</div>;
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  list,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "datetime-local";
  list?: readonly string[];
}) {
  const listId = `${label.replace(/\s+/g, "-").toLowerCase()}-list`;

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type={type}
        list={list ? listId : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field-input"
      />
      {list ? (
        <datalist id={listId}>
          {list.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      ) : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="field-input min-h-[6rem]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-input"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
