export type StatusTone = "danger" | "warning" | "accent" | "neutral";

export type DashboardStatus = {
  label: string;
  count: number;
  tone: StatusTone;
  group: DashboardQueueGroup;
  why: string;
  nextAction: string;
};

export type DashboardQueueGroup =
  | "urgent"
  | "pending-my-reply"
  | "waiting-on-others"
  | "decision-required"
  | "drafts"
  | "needs-evidence";

export type AttentionItem = {
  vessel: string;
  topic: string;
  status: string;
  tone: StatusTone;
  whyUrgent: string;
  suggestedNextStep: string;
};

export type WorkspaceSummary = {
  slug: string;
  name: string;
  href: string;
  type: "Vessel" | "Project" | "General";
  description: string;
  openCases: number;
  pendingReplies: number;
  needsEvidence: number;
  focusAreas: string[];
};

export type EmailThreadScope =
  | "import"
  | "unclassified"
  | "lng-portharcourt-ii"
  | "lpg-alfred-temile"
  | "lpg-alfred-temile-10"
  | "projects"
  | "other";

export type EmailStatus = "Pending My Reply" | "Waiting on Vessel" | "Needs Evidence" | "Draft Ready";

export type EmailParseStatus =
  | "not parsed"
  | "parsing"
  | "parsed"
  | "failed"
  | "unsupported";

export type EmailAttachment = {
  name: string;
  kind: string;
  size: string;
};

export type EmailMessage = {
  sender: string;
  body: string;
  timestamp: string;
  subject?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  messageId?: string | null;
  inReplyTo?: string | null;
  references?: string[];
  bodyHtmlText?: string | null;
  attachmentMetadata?: EmailAttachment[];
  sourceEvidenceId?: string | null;
};

export type EmailThread = {
  id: string;
  workspaceKey: EmailThreadScope;
  subject: string;
  sender: string;
  recipients: string[];
  cc: string[];
  dateTime: string;
  vesselProject: string;
  status: EmailStatus;
  attachments: EmailAttachment[];
  messages: EmailMessage[];
  linkedCase: string;
  suggestedNextAction: string;
  parseStatus?: EmailParseStatus;
  parseError?: string | null;
  sourceEvidenceId?: string | null;
  originalFilename?: string | null;
  messageIdHeader?: string | null;
  inReplyTo?: string | null;
  references?: string[];
  bcc?: string[];
  bodyText?: string | null;
  bodyHtmlText?: string | null;
  parsedAt?: string | null;
};

export type ImportSourceType =
  | "pasted-email"
  | "manual-note"
  | "screenshot-placeholder"
  | "document-placeholder"
  | "eml-placeholder";

export type ImportWorkspaceAssignment =
  | "Import/Staging"
  | "LNG PORTHARCOURT II"
  | "LPG ALFRED TEMILE"
  | "LPG ALFRED TEMILE 10"
  | "Projects"
  | "Other";

export type ImportIntakeStatus =
  | "unclassified"
  | "pending-my-reply"
  | "waiting-on-vessel"
  | "waiting-on-vendor"
  | "waiting-on-class"
  | "waiting-on-management"
  | "decision-required"
  | "needs-evidence"
  | "monitoring";

export type ImportIntakeItem = {
  id: string;
  title: string;
  sourceType: ImportSourceType;
  workspaceAssignment: ImportWorkspaceAssignment;
  status: ImportIntakeStatus;
  senderSource: string;
  dateTime: string;
  bodyContent: string;
  tags: string[];
  routeNote: string;
  casePlaceholder: string;
  createdLabel: string;
};

export type LinkedCorrespondenceItem = {
  caseRef: string;
  title: string;
  vesselProject: string;
  status: EmailStatus;
  threadCount: number;
  latestNote: string;
};

export type CasePriority = "High" | "Medium" | "Low";

export type CaseStatus =
  | "Decision Required"
  | "Needs Evidence"
  | "Waiting on Vessel"
  | "Waiting on Vendor"
  | "Waiting on Class"
  | "Waiting on Management"
  | "Pending My Reply"
  | "Monitoring";

export type CaseTimelineEvent = {
  id: string;
  dateTime: string;
  title: string;
  note: string;
  tone: StatusTone;
};

export type CaseRecord = {
  caseId: string;
  title: string;
  summary: string;
  workspaceKey: EmailThreadScope;
  workspaceLabel: string;
  vesselProject: string;
  owner: string;
  status: CaseStatus;
  priority: CasePriority;
  category: string;
  openedDate: string;
  age: string;
  dueLabel: string;
  waitingOn: string;
  nextAction: string;
  riskNote: string;
  linkedThreads: string[];
  linkedEvidence: string[];
  timelineEvents: CaseTimelineEvent[];
  decisionRequired: string;
  tags: string[];
  sourceIntakeRef: string;
  workspaceHref: string;
};

export type EvidenceType =
  | "email"
  | "document"
  | "image"
  | "screenshot"
  | "note"
  | "quote"
  | "report"
  | "eml-placeholder";

export type EvidenceStatus = "Linked" | "Needs Review" | "Pending";

export type EvidenceStorageState = "staged" | "uploaded" | "metadata-only" | "fallback-prototype";

export type EvidenceRecord = {
  evidenceId: string;
  title: string;
  type: EvidenceType;
  source: string;
  date: string;
  linkedCaseId: string | null;
  description: string;
  status: EvidenceStatus;
  storageState: EvidenceStorageState;
  sourceType: ImportSourceType;
  workspaceAssignment: ImportWorkspaceAssignment;
  linkedIntakeItemRef: string;
  linkedCaseRef: string;
  originalFilename: string | null;
  fileSizeBytes: number | null;
  storageBucket: string | null;
  storagePath: string | null;
  mimeType: string | null;
  uploadedAt: string | null;
  parseStatus: EmailParseStatus;
  parseError: string | null;
  parsedThreadId: string | null;
  parsedMessageId: string | null;
  parsedAt: string | null;
};

export type WaitingOnType = "vessel" | "vendor" | "class" | "management";

export type DraftReviewState = "ready" | "failed-red-team";

export type DashboardQueueLink = {
  label: string;
  href: string;
};

export type DashboardQueueItem = {
  id: string;
  group: DashboardQueueGroup;
  workspaceKey: EmailThreadScope;
  workspaceLabel: string;
  status: EmailStatus | "Draft Failed Red-Team";
  issue: string;
  context: string;
  whoIsWaiting: string;
  whyItMatters: string;
  suggestedNextAction: string;
  relatedThreadPlaceholder: string;
  relatedCasePlaceholder: string;
  drilldowns: DashboardQueueLink[];
  waitingOnType?: WaitingOnType;
  draftState?: DraftReviewState;
};

export type RecentImportActivity = {
  id: string;
  workspaceKey: EmailThreadScope;
  workspaceLabel: string;
  summary: string;
  receivedAt: string;
  status: string;
  whyItMatters: string;
  suggestedNextAction: string;
  drilldowns: DashboardQueueLink[];
};

export type VesselSnapshot = {
  workspaceKey: EmailThreadScope;
  workspaceLabel: string;
  openCases: number;
  urgent: number;
  pendingMyReply: number;
  waitingOnOthers: number;
  needsEvidence: number;
  latestSignal: string;
  suggestedNextAction: string;
  drilldowns: DashboardQueueLink[];
};

export const dashboardStatuses: DashboardStatus[] = [
  {
    label: "Urgent",
    count: 2,
    tone: "danger",
    group: "urgent",
    why: "Items may create technical, operational, or commercial exposure if delayed.",
    nextAction: "Review first and prepare a controlled response path.",
  },
  {
    label: "Pending My Reply",
    count: 4,
    tone: "warning",
    group: "pending-my-reply",
    why: "The next move is waiting on the user, not an external party.",
    nextAction: "Confirm facts, evidence, and intended tone before replying.",
  },
  {
    label: "Waiting on Others",
    count: 7,
    tone: "neutral",
    group: "waiting-on-others",
    why: "Progress depends on vendors, vessel teams, owners, class, or management.",
    nextAction: "Decide which items need a follow-up or escalation.",
  },
  {
    label: "Decision Required",
    count: 2,
    tone: "warning",
    group: "decision-required",
    why: "Work cannot move cleanly without a choice or documented instruction.",
    nextAction: "Capture the options, evidence, and recommended decision.",
  },
  {
    label: "Drafts Ready",
    count: 3,
    tone: "accent",
    group: "drafts",
    why: "Draft responses are waiting for user review before any external use.",
    nextAction: "Review wording, remove unsupported claims, then copy manually if approved.",
  },
  {
    label: "Needs Evidence",
    count: 5,
    tone: "neutral",
    group: "needs-evidence",
    why: "The case needs documents, screenshots, EMLs, or notes before action is reliable.",
    nextAction: "Attach or paste the missing supporting material.",
  },
];

export const attentionQueue: AttentionItem[] = [
  {
    vessel: "LPG ALFRED TEMILE 10",
    topic: "External request requiring technical review",
    status: "Urgent",
    tone: "danger",
    whyUrgent:
      "Possible commercial or technical exposure if response is delayed or worded incorrectly.",
    suggestedNextStep:
      "Prepare a holding response and confirm the missing evidence before a final reply.",
  },
  {
    vessel: "LNG PORTHARCOURT II",
    topic: "Pending management update",
    status: "Pending My Reply",
    tone: "warning",
    whyUrgent:
      "The update needs a concise status position before the next operational review.",
    suggestedNextStep:
      "Summarize current facts, open blockers, and the decision needed from management.",
  },
];

export const vesselWorkspaces: WorkspaceSummary[] = [
  {
    slug: "lng-portharcourt-ii",
    name: "LNG PORTHARCOURT II",
    href: "/vessels/lng-portharcourt-ii",
    type: "Vessel",
    description:
      "Workspace for vessel operations, technical issues, class matters, owners, charterers, and evidence trails.",
    openCases: 5,
    pendingReplies: 1,
    needsEvidence: 2,
    focusAreas: ["Technical follow-up", "Management update", "Evidence archiving"],
  },
  {
    slug: "lpg-alfred-temile",
    name: "LPG ALFRED TEMILE",
    href: "/vessels/lpg-alfred-temile",
    type: "Vessel",
    description:
      "Separate vessel workspace for LPG ALFRED TEMILE matters that should not be merged with AT10.",
    openCases: 4,
    pendingReplies: 2,
    needsEvidence: 1,
    focusAreas: ["Vendor follow-up", "Procurement", "Owner correspondence"],
  },
  {
    slug: "lpg-alfred-temile-10",
    name: "LPG ALFRED TEMILE 10",
    href: "/vessels/lpg-alfred-temile-10",
    type: "Vessel",
    description:
      "Dedicated AT10 workspace for vessel-specific cases, correspondence, evidence, and decisions.",
    openCases: 6,
    pendingReplies: 1,
    needsEvidence: 2,
    focusAreas: ["Technical review", "Commercial exposure", "Holding response"],
  },
];

export const projectWorkspace: WorkspaceSummary = {
  slug: "projects",
  name: "Projects",
  href: "/projects",
  type: "Project",
  description:
    "Project workspace for non-vessel initiatives, procurement follow-up, implementation issues, and decision records.",
  openCases: 3,
  pendingReplies: 0,
  needsEvidence: 1,
  focusAreas: ["Project decisions", "Task follow-up", "Management reporting"],
};

export const otherWorkspace: WorkspaceSummary = {
  slug: "other",
  name: "Other / General Issues",
  href: "/other",
  type: "General",
  description:
    "General workspace for NSML matters that do not yet belong to a confirmed vessel or project.",
  openCases: 2,
  pendingReplies: 0,
  needsEvidence: 1,
  focusAreas: ["Unclassified imports", "General correspondence", "Triage"],
};

export const allWorkspaces: WorkspaceSummary[] = [
  ...vesselWorkspaces,
  projectWorkspace,
  otherWorkspace,
];

export const recentImports = [
  {
    label: "Manual email paste",
    workspace: "LPG ALFRED TEMILE 10",
    status: "Needs evidence",
  },
  {
    label: "Screenshot upload",
    workspace: "Projects",
    status: "Ready for case link",
  },
  {
    label: "Document note",
    workspace: "Other / General Issues",
    status: "Needs triage",
  },
];

export const dashboardQueueItems: DashboardQueueItem[] = [
  {
    id: "urgent-1",
    group: "urgent",
    workspaceKey: "lpg-alfred-temile-10",
    workspaceLabel: "LPG ALFRED TEMILE 10",
    status: "Pending My Reply",
    issue: "Class survey request needs a controlled technical reply.",
    context: "Vessel correspondence currently under AT10.",
    whoIsWaiting: "We are waiting on final evidence and the user’s reply.",
    whyItMatters:
      "A delayed or weak response could create technical or commercial exposure for the vessel.",
    suggestedNextAction:
      "Pull the latest photos, confirm the repair note, and prepare a short holding response.",
    relatedThreadPlaceholder: "Related thread placeholder: insulation repair request",
    relatedCasePlaceholder: "Related case placeholder: CASE-24-019",
    drilldowns: [
      { label: "Open vessel", href: "/vessels/lpg-alfred-temile-10" },
      { label: "Open import", href: "/import" },
    ],
  },
  {
    id: "urgent-2",
    group: "urgent",
    workspaceKey: "lng-portharcourt-ii",
    workspaceLabel: "LNG PORTHARCOURT II",
    status: "Waiting on Vessel",
    issue: "Docking measurement comments still need a vessel confirmation.",
    context: "Vessel correspondence under LNG PORTHARCOURT II.",
    whoIsWaiting: "We are waiting on the vessel team to confirm the last set of measurements.",
    whyItMatters:
      "If the measurements remain unresolved, the shipyard conversation can stall and delay close-out.",
    suggestedNextAction:
      "Check the latest vessel feedback and attach the measurement evidence before replying.",
    relatedThreadPlaceholder: "Related thread placeholder: docking report follow-up",
    relatedCasePlaceholder: "Related case placeholder: CASE-24-011",
    drilldowns: [
      { label: "Open vessel", href: "/vessels/lng-portharcourt-ii" },
      { label: "Open cases", href: "/cases" },
    ],
  },
  {
    id: "pending-1",
    group: "pending-my-reply",
    workspaceKey: "projects",
    workspaceLabel: "Projects",
    status: "Pending My Reply",
    issue: "Vendor quotation needs a simple scope clarification.",
    context: "Project correspondence under Projects.",
    whoIsWaiting: "The vendor is waiting on us to confirm the delivery term scope.",
    whyItMatters:
      "The procurement decision could be priced incorrectly if the scope is answered loosely.",
    suggestedNextAction:
      "Confirm the commercial scope, then prepare a concise written reply.",
    relatedThreadPlaceholder: "Related thread placeholder: vendor quotation request",
    relatedCasePlaceholder: "Related case placeholder: CASE-24-007",
    drilldowns: [
      { label: "Open projects", href: "/projects" },
      { label: "Open import", href: "/import" },
    ],
  },
  {
    id: "pending-2",
    group: "pending-my-reply",
    workspaceKey: "other",
    workspaceLabel: "Other / General Issues",
    status: "Pending My Reply",
    issue: "Management note is waiting on a user decision before it can be sent.",
    context: "General correspondence under Other / General Issues.",
    whoIsWaiting: "We are waiting on the user to approve the final wording.",
    whyItMatters:
      "The note could go out with the wrong tone if it is not checked before response.",
    suggestedNextAction:
      "Review the note wording and decide whether it should become a draft response.",
    relatedThreadPlaceholder: "Related thread placeholder: management review note",
    relatedCasePlaceholder: "Related case placeholder: CASE-24-003",
    drilldowns: [
      { label: "Open other", href: "/other" },
      { label: "Open drafts", href: "/drafts" },
    ],
  },
  {
    id: "waiting-1",
    group: "waiting-on-others",
    workspaceKey: "lng-portharcourt-ii",
    workspaceLabel: "LNG PORTHARCOURT II",
    status: "Waiting on Vessel",
    issue: "Vessel team still has to confirm docking measurements.",
    context: "Waiting category: vessel.",
    whoIsWaiting: "We are waiting on the vessel team.",
    whyItMatters:
      "Without the vessel confirmation, the technical close-out remains incomplete.",
    suggestedNextAction:
      "Ask the vessel for the latest confirmation and file it with the case.",
    relatedThreadPlaceholder: "Related thread placeholder: measurement clarification",
    relatedCasePlaceholder: "Related case placeholder: CASE-24-011",
    waitingOnType: "vessel",
    drilldowns: [
      { label: "Open vessel", href: "/vessels/lng-portharcourt-ii" },
      { label: "Open cases", href: "/cases" },
    ],
  },
  {
    id: "waiting-2",
    group: "waiting-on-others",
    workspaceKey: "lpg-alfred-temile",
    workspaceLabel: "LPG ALFRED TEMILE",
    status: "Waiting on Vessel",
    issue: "Vendor follow-up is waiting for the vessel’s preferred option.",
    context: "Waiting category: vendor.",
    whoIsWaiting: "We are waiting on the vessel team to choose the preferred option.",
    whyItMatters:
      "The vendor cannot finalize the quote until the vessel confirms the direction.",
    suggestedNextAction:
      "Ask the vessel for the final preference and keep the vendor informed.",
    relatedThreadPlaceholder: "Related thread placeholder: vendor follow-up",
    relatedCasePlaceholder: "Related case placeholder: vessel vendor case",
    waitingOnType: "vendor",
    drilldowns: [
      { label: "Open vessel", href: "/vessels/lpg-alfred-temile" },
      { label: "Open import", href: "/import" },
    ],
  },
  {
    id: "waiting-3",
    group: "waiting-on-others",
    workspaceKey: "lpg-alfred-temile-10",
    workspaceLabel: "LPG ALFRED TEMILE 10",
    status: "Pending My Reply",
    issue: "Class survey feedback is still waiting for the latest technical evidence.",
    context: "Waiting category: class.",
    whoIsWaiting: "We are waiting on class after the evidence is compiled.",
    whyItMatters:
      "Class correspondence can stall if the supporting evidence is incomplete.",
    suggestedNextAction:
      "Collect the latest repair evidence and prepare the class update.",
    relatedThreadPlaceholder: "Related thread placeholder: class survey note",
    relatedCasePlaceholder: "Related case placeholder: CASE-24-019",
    waitingOnType: "class",
    drilldowns: [
      { label: "Open vessel", href: "/vessels/lpg-alfred-temile-10" },
      { label: "Open cases", href: "/cases" },
    ],
  },
  {
    id: "waiting-4",
    group: "waiting-on-others",
    workspaceKey: "other",
    workspaceLabel: "Other / General Issues",
    status: "Pending My Reply",
    issue: "General management note is waiting for sign-off from the user.",
    context: "Waiting category: management.",
    whoIsWaiting: "We are waiting on management approval.",
    whyItMatters:
      "The note should not move out until the user approves the final posture.",
    suggestedNextAction:
      "Summarize the options and get a clear yes/no instruction.",
    relatedThreadPlaceholder: "Related thread placeholder: management approval note",
    relatedCasePlaceholder: "Related case placeholder: general issue case",
    waitingOnType: "management",
    drilldowns: [
      { label: "Open other", href: "/other" },
      { label: "Open drafts", href: "/drafts" },
    ],
  },
  {
    id: "decision-1",
    group: "decision-required",
    workspaceKey: "lpg-alfred-temile-10",
    workspaceLabel: "LPG ALFRED TEMILE 10",
    status: "Pending My Reply",
    issue: "Repair method needs an explicit decision before a response is sent.",
    context: "Decision item from AT10 correspondence.",
    whoIsWaiting: "The case is waiting on the user’s decision.",
    whyItMatters:
      "The reply cannot be made precise until the response path is chosen.",
    suggestedNextAction:
      "Capture the options, attach the evidence, and recommend the safer reply path.",
    relatedThreadPlaceholder: "Related thread placeholder: repair method query",
    relatedCasePlaceholder: "Related case placeholder: CASE-24-021",
    drilldowns: [
      { label: "Open vessel", href: "/vessels/lpg-alfred-temile-10" },
      { label: "Open cases", href: "/cases" },
    ],
  },
  {
    id: "decision-2",
    group: "decision-required",
    workspaceKey: "projects",
    workspaceLabel: "Projects",
    status: "Needs Evidence",
    issue: "Project procurement route needs a clear choice.",
    context: "Decision item from Projects correspondence.",
    whoIsWaiting: "We are waiting on a procurement decision.",
    whyItMatters:
      "If the route is not chosen, the project reply and timeline stay blocked.",
    suggestedNextAction:
      "Compare the options and lock the decision into the case record.",
    relatedThreadPlaceholder: "Related thread placeholder: procurement route note",
    relatedCasePlaceholder: "Related case placeholder: CASE-24-014",
    drilldowns: [
      { label: "Open projects", href: "/projects" },
      { label: "Open cases", href: "/cases" },
    ],
  },
  {
    id: "draft-1",
    group: "drafts",
    workspaceKey: "other",
    workspaceLabel: "Other / General Issues",
    status: "Draft Ready",
    issue: "Reviewed management reply ready for final user check.",
    context: "Draft from general workspace correspondence.",
    whoIsWaiting: "We are waiting on the user to approve the wording.",
    whyItMatters:
      "The draft is nearly ready but should not be used externally until it is checked.",
    suggestedNextAction:
      "Review the wording, then copy manually into Outlook if approved.",
    relatedThreadPlaceholder: "Related thread placeholder: management draft",
    relatedCasePlaceholder: "Related case placeholder: CASE-24-003",
    draftState: "ready",
    drilldowns: [
      { label: "Open drafts", href: "/drafts" },
      { label: "Open other", href: "/other" },
    ],
  },
  {
    id: "draft-2",
    group: "drafts",
    workspaceKey: "lpg-alfred-temile",
    workspaceLabel: "LPG ALFRED TEMILE",
    status: "Draft Failed Red-Team",
    issue: "Draft response flagged by red-team placeholder review.",
    context: "Draft workflow placeholder for a vessel reply.",
    whoIsWaiting: "We are waiting on a revised draft.",
    whyItMatters:
      "The draft is blocked because the red-team placeholder indicates it needs more support.",
    suggestedNextAction:
      "Revise the support and route the item back through review later.",
    relatedThreadPlaceholder: "Related thread placeholder: vessel draft review",
    relatedCasePlaceholder: "Related case placeholder: draft review case",
    draftState: "failed-red-team",
    drilldowns: [
      { label: "Open drafts", href: "/drafts" },
      { label: "Open vessel", href: "/vessels/lpg-alfred-temile" },
    ],
  },
  {
    id: "draft-3",
    group: "drafts",
    workspaceKey: "lpg-alfred-temile-10",
    workspaceLabel: "LPG ALFRED TEMILE 10",
    status: "Draft Ready",
    issue: "AT10 holding response ready for manual review.",
    context: "Draft workflow placeholder for the AT10 vessel.",
    whoIsWaiting: "We are waiting on the user’s final approval.",
    whyItMatters:
      "The wording should be checked before it is copied into Outlook manually.",
    suggestedNextAction:
      "Review the draft and confirm whether it can be copied out.",
    relatedThreadPlaceholder: "Related thread placeholder: AT10 holding response",
    relatedCasePlaceholder: "Related case placeholder: CASE-24-019",
    draftState: "ready",
    drilldowns: [
      { label: "Open drafts", href: "/drafts" },
      { label: "Open vessel", href: "/vessels/lpg-alfred-temile-10" },
    ],
  },
  {
    id: "evidence-1",
    group: "needs-evidence",
    workspaceKey: "lng-portharcourt-ii",
    workspaceLabel: "LNG PORTHARCOURT II",
    status: "Needs Evidence",
    issue: "Measurement response is missing the latest vessel photo set.",
    context: "Evidence gap under LNG PORTHARCOURT II.",
    whoIsWaiting: "We are waiting on the vessel evidence pack.",
    whyItMatters:
      "The reply remains incomplete without the latest photos and confirmation note.",
    suggestedNextAction:
      "Collect the photo pack and attach it before replying.",
    relatedThreadPlaceholder: "Related thread placeholder: vessel photos request",
    relatedCasePlaceholder: "Related case placeholder: CASE-24-011",
    drilldowns: [
      { label: "Open vessel", href: "/vessels/lng-portharcourt-ii" },
      { label: "Open import", href: "/import" },
    ],
  },
  {
    id: "evidence-2",
    group: "needs-evidence",
    workspaceKey: "projects",
    workspaceLabel: "Projects",
    status: "Needs Evidence",
    issue: "Procurement reply needs the missing vendor quote attachment.",
    context: "Evidence gap under Projects.",
    whoIsWaiting: "We are waiting on the quote attachment.",
    whyItMatters:
      "Without the attachment, the procurement response may lack the commercial detail it needs.",
    suggestedNextAction:
      "Attach the vendor quote and then re-check the decision line.",
    relatedThreadPlaceholder: "Related thread placeholder: vendor quote attachment",
    relatedCasePlaceholder: "Related case placeholder: CASE-24-007",
    drilldowns: [
      { label: "Open projects", href: "/projects" },
      { label: "Open import", href: "/import" },
    ],
  },
  {
    id: "evidence-3",
    group: "needs-evidence",
    workspaceKey: "other",
    workspaceLabel: "Other / General Issues",
    status: "Pending My Reply",
    issue: "General issue reply is waiting on supporting documentation.",
    context: "Evidence gap under Other / General Issues.",
    whoIsWaiting: "We are waiting on the missing note or screenshot.",
    whyItMatters:
      "The reply should not be sent until the evidence is captured and easy to reference.",
    suggestedNextAction:
      "Find the note, attach it, and then decide whether a draft is needed.",
    relatedThreadPlaceholder: "Related thread placeholder: general evidence request",
    relatedCasePlaceholder: "Related case placeholder: general issue case",
    drilldowns: [
      { label: "Open other", href: "/other" },
      { label: "Open import", href: "/import" },
    ],
  },
];

export const recentImportActivity: RecentImportActivity[] = [
  {
    id: "import-1",
    workspaceKey: "import",
    workspaceLabel: "Import",
    summary: "Manual email paste entered and waiting for classification.",
    receivedAt: "Today, 08:14",
    status: "Unclassified",
    whyItMatters:
      "The item still needs workspace assignment before it becomes part of the active work queue.",
    suggestedNextAction: "Classify it into the correct vessel, project, or general workspace.",
    drilldowns: [
      { label: "Open import", href: "/import" },
      { label: "Open cases", href: "/cases" },
    ],
  },
  {
    id: "import-2",
    workspaceKey: "lpg-alfred-temile-10",
    workspaceLabel: "LPG ALFRED TEMILE 10",
    summary: "Screenshot import linked to an AT10 correspondence trail.",
    receivedAt: "Today, 07:48",
    status: "Ready for workspace review",
    whyItMatters:
      "The screenshot appears relevant to an active vessel issue and should be reviewed with the thread.",
    suggestedNextAction: "Open the vessel workspace and decide whether the item needs a case link.",
    drilldowns: [
      { label: "Open vessel", href: "/vessels/lpg-alfred-temile-10" },
      { label: "Open import", href: "/import" },
    ],
  },
  {
    id: "import-3",
    workspaceKey: "projects",
    workspaceLabel: "Projects",
    summary: "Document note was filed into the project intake stream.",
    receivedAt: "Yesterday, 16:22",
    status: "Pending classification",
    whyItMatters:
      "The note might affect a project decision and needs to be mapped to the right task or case.",
    suggestedNextAction: "Review the note and move it into the Projects workspace if it belongs there.",
    drilldowns: [
      { label: "Open projects", href: "/projects" },
      { label: "Open import", href: "/import" },
    ],
  },
];

export const vesselSnapshots: VesselSnapshot[] = [
  {
    workspaceKey: "lng-portharcourt-ii",
    workspaceLabel: "LNG PORTHARCOURT II",
    openCases: 5,
    urgent: 1,
    pendingMyReply: 1,
    waitingOnOthers: 2,
    needsEvidence: 1,
    latestSignal: "Docking measurement confirmation still pending from vessel team.",
    suggestedNextAction: "Follow up with the vessel and attach the latest evidence.",
    drilldowns: [
      { label: "Open vessel", href: "/vessels/lng-portharcourt-ii" },
      { label: "Open cases", href: "/cases" },
    ],
  },
  {
    workspaceKey: "lpg-alfred-temile",
    workspaceLabel: "LPG ALFRED TEMILE",
    openCases: 4,
    urgent: 0,
    pendingMyReply: 1,
    waitingOnOthers: 2,
    needsEvidence: 1,
    latestSignal: "Vendor follow-up is waiting on the vessel’s choice.",
    suggestedNextAction: "Capture the vessel’s preference and keep the vendor informed.",
    drilldowns: [
      { label: "Open vessel", href: "/vessels/lpg-alfred-temile" },
      { label: "Open import", href: "/import" },
    ],
  },
  {
    workspaceKey: "lpg-alfred-temile-10",
    workspaceLabel: "LPG ALFRED TEMILE 10",
    openCases: 6,
    urgent: 1,
    pendingMyReply: 1,
    waitingOnOthers: 1,
    needsEvidence: 2,
    latestSignal: "AT10 survey request still needs the latest repair evidence.",
    suggestedNextAction: "Confirm the evidence pack and prepare the holding response.",
    drilldowns: [
      { label: "Open vessel", href: "/vessels/lpg-alfred-temile-10" },
      { label: "Open drafts", href: "/drafts" },
    ],
  },
];

export const importedEmailThreads: EmailThread[] = [
  {
    id: "thread-1",
    workspaceKey: "lpg-alfred-temile-10",
    subject: "Request for updated insulation repair status",
    sender: "Class Surveyor <survey@class.example>",
    recipients: ["Toye Omolade <toye@nsml.example>"],
    cc: ["Technical Superintendent <tech@nsml.example>"],
    dateTime: "21 May 2026, 08:42",
    vesselProject: "LPG ALFRED TEMILE 10",
    status: "Pending My Reply",
    attachments: [
      { name: "survey-note.pdf", kind: "PDF", size: "246 KB" },
      { name: "photo-archive.zip", kind: "ZIP", size: "4.2 MB" },
    ],
    messages: [
      {
        sender: "Class Surveyor",
        body:
          "Please send the latest update on insulation repair completion and any supporting photos before the close of business.",
        timestamp: "21 May 2026, 08:42",
      },
      {
        sender: "Toye Omolade",
        body:
          "Acknowledged. I am checking the vessel evidence folder and will revert once the repair photos and summary note are confirmed.",
        timestamp: "21 May 2026, 09:05",
      },
    ],
    linkedCase: "CASE-24-019",
    suggestedNextAction: "Confirm evidence, then prepare a short holding reply.",
  },
  {
    id: "thread-2",
    workspaceKey: "lng-portharcourt-ii",
    subject: "Docking measurement report and outstanding comments",
    sender: "Shipyard Coordinator <yard@example.com>",
    recipients: ["Operations Desk <ops@nsml.example>"],
    cc: ["Toye Omolade <toye@nsml.example>"],
    dateTime: "20 May 2026, 15:18",
    vesselProject: "LNG PORTHARCOURT II",
    status: "Waiting on Vessel",
    attachments: [
      { name: "dock-report.docx", kind: "DOCX", size: "88 KB" },
      { name: "measurement-sheet.xlsx", kind: "XLSX", size: "54 KB" },
    ],
    messages: [
      {
        sender: "Shipyard Coordinator",
        body:
          "The docking report is attached. Kindly confirm whether the outstanding measurement comments have been resolved on board.",
        timestamp: "20 May 2026, 15:18",
      },
      {
        sender: "Operations Desk",
        body:
          "We are waiting for the vessel team to confirm the last set of measurements before responding.",
        timestamp: "20 May 2026, 16:02",
      },
    ],
    linkedCase: "CASE-24-011",
    suggestedNextAction: "Check vessel feedback and attach the latest evidence.",
  },
  {
    id: "thread-3",
    workspaceKey: "projects",
    subject: "Fuel vendor quotation requires clarification",
    sender: "Vendor Representative <vendor@example.com>",
    recipients: ["Projects Desk <projects@nsml.example>"],
    cc: ["Toye Omolade <toye@nsml.example>"],
    dateTime: "19 May 2026, 11:30",
    vesselProject: "Projects",
    status: "Needs Evidence",
    attachments: [{ name: "quotation.pdf", kind: "PDF", size: "190 KB" }],
    messages: [
      {
        sender: "Vendor Representative",
        body:
          "Please confirm whether the revised quotation should include delivery to port or only supply terms.",
        timestamp: "19 May 2026, 11:30",
      },
    ],
    linkedCase: "CASE-24-007",
    suggestedNextAction: "Collect the missing commercial detail before replying.",
  },
  {
    id: "thread-4",
    workspaceKey: "other",
    subject: "Draft response for management review",
    sender: "Assistant Note <system@nsml.example>",
    recipients: ["Toye Omolade <toye@nsml.example>"],
    cc: [],
    dateTime: "18 May 2026, 17:44",
    vesselProject: "Other / General Issues",
    status: "Draft Ready",
    attachments: [{ name: "draft-response.txt", kind: "TXT", size: "12 KB" }],
    messages: [
      {
        sender: "Assistant Note",
        body:
          "A reviewed draft can be prepared once the linked evidence is confirmed and the final instruction is available.",
        timestamp: "18 May 2026, 17:44",
      },
    ],
    linkedCase: "CASE-24-003",
    suggestedNextAction: "Review the draft and mark it ready only after manual approval.",
  },
  {
    id: "thread-5",
    workspaceKey: "import",
    subject: "Manual intake awaiting classification",
    sender: "Operations Inbox <import@nsml.example>",
    recipients: ["Toye Omolade <toye@nsml.example>"],
    cc: [],
    dateTime: "21 May 2026, 10:18",
    vesselProject: "Unclassified",
    status: "Needs Evidence",
    attachments: [{ name: "incoming-email.eml", kind: "EML", size: "31 KB" }],
    messages: [
      {
        sender: "Operations Inbox",
        body:
          "This item is still in the intake queue and has not yet been classified into a workspace.",
        timestamp: "21 May 2026, 10:18",
      },
    ],
    linkedCase: "Unlinked",
    suggestedNextAction:
      "Classify the thread into the correct vessel, project, or general workspace.",
  },
  {
    id: "thread-6",
    workspaceKey: "unclassified",
    subject: "Imported note without assigned workspace",
    sender: "Archive Import <archive@nsml.example>",
    recipients: ["Toye Omolade <toye@nsml.example>"],
    cc: [],
    dateTime: "21 May 2026, 10:41",
    vesselProject: "Unclassified",
    status: "Pending My Reply",
    attachments: [{ name: "import-note.txt", kind: "TXT", size: "6 KB" }],
    messages: [
      {
        sender: "Archive Import",
        body:
          "The imported correspondence has not yet been assigned to a permanent workspace.",
        timestamp: "21 May 2026, 10:41",
      },
    ],
    linkedCase: "Unlinked",
    suggestedNextAction:
      "Review the content and decide whether it belongs in a vessel, project, or other workspace.",
  },
];

export const linkedCorrespondence: LinkedCorrespondenceItem[] = [
  {
    caseRef: "CASE-24-019",
    title: "Insulation repair follow-up",
    vesselProject: "LPG ALFRED TEMILE 10",
    status: "Pending My Reply",
    threadCount: 2,
    latestNote: "Surveyor request awaiting supporting photos.",
  },
  {
    caseRef: "CASE-24-011",
    title: "Docking measurement review",
    vesselProject: "LNG PORTHARCOURT II",
    status: "Waiting on Vessel",
    threadCount: 3,
    latestNote: "Waiting for vessel confirmation before response.",
  },
  {
    caseRef: "CASE-24-007",
    title: "Vendor quotation clarification",
    vesselProject: "Projects",
    status: "Needs Evidence",
    threadCount: 1,
    latestNote: "Commercial scope still missing.",
  },
];

export const caseStatuses: { value: CaseStatus; tone: StatusTone; label: string }[] = [
  { value: "Decision Required", tone: "warning", label: "Decision Required" },
  { value: "Needs Evidence", tone: "danger", label: "Needs Evidence" },
  { value: "Waiting on Vessel", tone: "neutral", label: "Waiting on Vessel" },
  { value: "Waiting on Vendor", tone: "neutral", label: "Waiting on Vendor" },
  { value: "Waiting on Class", tone: "neutral", label: "Waiting on Class" },
  { value: "Waiting on Management", tone: "neutral", label: "Waiting on Management" },
  { value: "Pending My Reply", tone: "warning", label: "Pending My Reply" },
  { value: "Monitoring", tone: "accent", label: "Monitoring" },
];

export const casePriorities: { value: CasePriority; label: string; tone: StatusTone }[] = [
  { value: "High", label: "High", tone: "danger" },
  { value: "Medium", label: "Medium", tone: "warning" },
  { value: "Low", label: "Low", tone: "neutral" },
];

export const caseRecords: CaseRecord[] = [
  {
    caseId: "CASE-24-019",
    title: "Insulation repair follow-up",
    summary:
      "AT10 correspondence about insulation repair status, missing photos, and a holding response.",
    workspaceKey: "lpg-alfred-temile-10",
    workspaceLabel: "LPG ALFRED TEMILE 10",
    vesselProject: "LPG ALFRED TEMILE 10",
    owner: "Toye Omolade",
    status: "Decision Required",
    priority: "High",
    category: "Class / Technical",
    openedDate: "18 May 2026",
    age: "3 days",
    dueLabel: "Decision due today",
    waitingOn: "User decision and class evidence",
    nextAction: "Confirm the evidence pack and decide whether to send a technical holding reply.",
    riskNote: "A weak reply could create technical or commercial exposure for the vessel.",
    linkedThreads: ["thread-1", "thread-5"],
    linkedEvidence: ["EVID-019-1", "EVID-019-2"],
    timelineEvents: [
      {
        id: "case-019-opened",
        dateTime: "18 May 2026, 09:15",
        title: "Case opened",
        note: "Created from the insulation repair correspondence stream.",
        tone: "neutral",
      },
      {
        id: "case-019-evidence",
        dateTime: "20 May 2026, 14:30",
        title: "Evidence requested",
        note: "Requested repair photos and supporting notes before reply.",
        tone: "danger",
      },
      {
        id: "case-019-decision",
        dateTime: "21 May 2026, 08:42",
        title: "Decision required",
        note: "Needs a clear reply path before the next outward response.",
        tone: "warning",
      },
    ],
    decisionRequired:
      "Choose whether to hold position until the evidence pack is complete or draft a short technical acknowledgment first.",
    tags: ["AT10", "class", "repair", "evidence"],
    sourceIntakeRef: "From intake item: Class survey note awaiting evidence",
    workspaceHref: "/vessels/lpg-alfred-temile-10",
  },
  {
    caseId: "CASE-24-011",
    title: "Docking measurement review",
    summary:
      "LNG PORTHARCOURT II dock report needs vessel confirmation before the measurements can be closed out.",
    workspaceKey: "lng-portharcourt-ii",
    workspaceLabel: "LNG PORTHARCOURT II",
    vesselProject: "LNG PORTHARCOURT II",
    owner: "Toye Omolade",
    status: "Waiting on Vessel",
    priority: "Medium",
    category: "Operations / Technical",
    openedDate: "19 May 2026",
    age: "2 days",
    dueLabel: "Due tomorrow",
    waitingOn: "Vessel team confirmation",
    nextAction: "Check the latest vessel feedback and attach the measurement evidence.",
    riskNote: "The shipyard conversation can stall if the measurement comments remain unresolved.",
    linkedThreads: ["thread-2"],
    linkedEvidence: ["EVID-011-1", "EVID-011-2"],
    timelineEvents: [
      {
        id: "case-011-opened",
        dateTime: "19 May 2026, 10:05",
        title: "Case opened",
        note: "Docking measurement review started from the latest correspondence.",
        tone: "neutral",
      },
      {
        id: "case-011-follow-up",
        dateTime: "20 May 2026, 15:18",
        title: "Waiting on vessel",
        note: "Requested confirmation from the vessel team.",
        tone: "neutral",
      },
      {
        id: "case-011-evidence",
        dateTime: "21 May 2026, 08:50",
        title: "Evidence pending",
        note: "Measurement sheet still needs the latest supporting confirmation.",
        tone: "danger",
      },
    ],
    decisionRequired:
      "Confirm whether the measured values are final or whether a follow-up correction is needed.",
    tags: ["docking", "measurements", "vessel", "evidence"],
    sourceIntakeRef: "From intake item: Screenshot placeholder for vessel follow-up",
    workspaceHref: "/vessels/lng-portharcourt-ii",
  },
  {
    caseId: "CASE-24-007",
    title: "Vendor quotation clarification",
    summary:
      "Project quotation needs a commercial clarification before the scope can be answered cleanly.",
    workspaceKey: "projects",
    workspaceLabel: "Projects",
    vesselProject: "Projects",
    owner: "Toye Omolade",
    status: "Needs Evidence",
    priority: "Medium",
    category: "Procurement / Project",
    openedDate: "17 May 2026",
    age: "4 days",
    dueLabel: "Due this week",
    waitingOn: "Vendor quote attachment",
    nextAction: "Attach the missing commercial detail and then review the decision path.",
    riskNote: "A loose response could create pricing or scope exposure.",
    linkedThreads: ["thread-3"],
    linkedEvidence: ["EVID-007-1"],
    timelineEvents: [
      {
        id: "case-007-opened",
        dateTime: "17 May 2026, 13:20",
        title: "Case opened",
        note: "Vendor quote moved from intake into the projects workspace.",
        tone: "neutral",
      },
      {
        id: "case-007-query",
        dateTime: "19 May 2026, 11:30",
        title: "Clarification requested",
        note: "Requested delivery term clarification from the vendor.",
        tone: "warning",
      },
      {
        id: "case-007-evidence",
        dateTime: "21 May 2026, 09:12",
        title: "Evidence still missing",
        note: "Commercial quote attachment still needs to be linked.",
        tone: "danger",
      },
    ],
    decisionRequired:
      "Decide whether the current quote can be accepted or should be returned for clarification.",
    tags: ["project", "quotation", "vendor", "decision"],
    sourceIntakeRef: "From intake item: Vendor quotation note for project review",
    workspaceHref: "/projects",
  },
  {
    caseId: "CASE-24-003",
    title: "Management review note",
    summary: "General workspace note waiting on approval before a draft response is released.",
    workspaceKey: "other",
    workspaceLabel: "Other / General Issues",
    vesselProject: "Other / General Issues",
    owner: "Toye Omolade",
    status: "Pending My Reply",
    priority: "Low",
    category: "Management / General",
    openedDate: "16 May 2026",
    age: "5 days",
    dueLabel: "Monitor only",
    waitingOn: "User approval",
    nextAction: "Review the wording and decide whether it should become a draft response.",
    riskNote: "The note could leave with the wrong tone if it is not checked.",
    linkedThreads: ["thread-4"],
    linkedEvidence: ["EVID-003-1"],
    timelineEvents: [
      {
        id: "case-003-opened",
        dateTime: "16 May 2026, 09:00",
        title: "Case opened",
        note: "General management note captured in the Other workspace.",
        tone: "neutral",
      },
      {
        id: "case-003-review",
        dateTime: "18 May 2026, 17:44",
        title: "Draft review ready",
        note: "A draft response can be prepared after manual approval.",
        tone: "accent",
      },
      {
        id: "case-003-pending",
        dateTime: "21 May 2026, 10:00",
        title: "Pending reply",
        note: "Still waiting on the user to approve the final posture.",
        tone: "warning",
      },
    ],
    decisionRequired: "Approve the final wording or keep the item as monitoring only.",
    tags: ["management", "general", "draft", "review"],
    sourceIntakeRef: "From intake item: Manual note for management review",
    workspaceHref: "/other",
  },
  {
    caseId: "CASE-24-021",
    title: "Vendor follow-up for LPG ALFRED TEMILE",
    summary:
      "Separate LPG ALFRED TEMILE workspace item waiting on vendor clarification and vessel preference.",
    workspaceKey: "lpg-alfred-temile",
    workspaceLabel: "LPG ALFRED TEMILE",
    vesselProject: "LPG ALFRED TEMILE",
    owner: "Toye Omolade",
    status: "Waiting on Vendor",
    priority: "Medium",
    category: "Vendor / Vessel",
    openedDate: "20 May 2026",
    age: "1 day",
    dueLabel: "Follow-up pending",
    waitingOn: "Vendor and vessel preference",
    nextAction: "Capture the vessel preference and keep the vendor informed.",
    riskNote: "The vendor cannot finalize the quote until the vessel confirms the direction.",
    linkedThreads: [],
    linkedEvidence: [],
    timelineEvents: [
      {
        id: "case-021-opened",
        dateTime: "20 May 2026, 12:15",
        title: "Case opened",
        note: "Created for a vessel/vendor follow-up on LPG ALFRED TEMILE.",
        tone: "neutral",
      },
      {
        id: "case-021-follow-up",
        dateTime: "21 May 2026, 09:30",
        title: "Waiting on vendor",
        note: "Vendor has not yet confirmed the revised quotation direction.",
        tone: "neutral",
      },
    ],
    decisionRequired:
      "Confirm the next reply path or keep the item open while the vendor waits.",
    tags: ["vendor", "vessel", "follow-up"],
    sourceIntakeRef: "From intake item: Screenshot placeholder for vessel follow-up",
    workspaceHref: "/vessels/lpg-alfred-temile",
  },
];

export const evidenceRecords: EvidenceRecord[] = [
  {
    evidenceId: "EVID-019-1",
    title: "Class survey email",
    type: "email",
    source: "Class Surveyor <survey@class.example>",
    date: "21 May 2026, 08:42",
    linkedCaseId: "CASE-24-019",
    description: "Imported email asking for the latest repair photos and summary note.",
    status: "Linked",
    storageState: "metadata-only",
    sourceType: "pasted-email",
    workspaceAssignment: "LPG ALFRED TEMILE 10",
    linkedIntakeItemRef: "Class survey note awaiting evidence",
    linkedCaseRef: "CASE-24-019",
    originalFilename: "class-survey-message.eml",
    fileSizeBytes: 31744,
    storageBucket: null,
    storagePath: null,
    mimeType: "message/rfc822",
    uploadedAt: "21 May 2026, 08:42",
    parseStatus: "not parsed",
    parseError: null,
    parsedThreadId: null,
    parsedMessageId: null,
    parsedAt: null,
  },
  {
    evidenceId: "EVID-019-2",
    title: "Repair photo placeholder",
    type: "image",
    source: "Manual intake",
    date: "21 May 2026, 09:10",
    linkedCaseId: "CASE-24-019",
    description: "Placeholder for the repair photo pack that will later be attached manually.",
    status: "Pending",
    storageState: "metadata-only",
    sourceType: "screenshot-placeholder",
    workspaceAssignment: "LPG ALFRED TEMILE 10",
    linkedIntakeItemRef: "Screenshot placeholder for vessel follow-up",
    linkedCaseRef: "CASE-24-019",
    originalFilename: "repair-photo-1.png",
    fileSizeBytes: 224512,
    storageBucket: null,
    storagePath: null,
    mimeType: "image/png",
    uploadedAt: "21 May 2026, 09:10",
    parseStatus: "unsupported",
    parseError: null,
    parsedThreadId: null,
    parsedMessageId: null,
    parsedAt: null,
  },
  {
    evidenceId: "EVID-011-1",
    title: "Docking measurement report",
    type: "report",
    source: "Shipyard Coordinator <yard@example.com>",
    date: "20 May 2026, 15:18",
    linkedCaseId: "CASE-24-011",
    description: "Dock report that needs the vessel team to confirm outstanding comments.",
    status: "Linked",
    storageState: "metadata-only",
    sourceType: "document-placeholder",
    workspaceAssignment: "LNG PORTHARCOURT II",
    linkedIntakeItemRef: "Docking measurement review",
    linkedCaseRef: "CASE-24-011",
    originalFilename: "docking-measurement-report.pdf",
    fileSizeBytes: 190412,
    storageBucket: null,
    storagePath: null,
    mimeType: "application/pdf",
    uploadedAt: "20 May 2026, 15:18",
    parseStatus: "unsupported",
    parseError: null,
    parsedThreadId: null,
    parsedMessageId: null,
    parsedAt: null,
  },
  {
    evidenceId: "EVID-011-2",
    title: "Measurement sheet",
    type: "document",
    source: "Operations Desk",
    date: "20 May 2026, 16:02",
    linkedCaseId: "CASE-24-011",
    description: "Supporting measurement spreadsheet for the docking review.",
    status: "Linked",
    storageState: "metadata-only",
    sourceType: "document-placeholder",
    workspaceAssignment: "LNG PORTHARCOURT II",
    linkedIntakeItemRef: "Screenshot placeholder for vessel follow-up",
    linkedCaseRef: "CASE-24-011",
    originalFilename: "measurement-sheet.xlsx",
    fileSizeBytes: 93824,
    storageBucket: null,
    storagePath: null,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    uploadedAt: "20 May 2026, 16:02",
    parseStatus: "unsupported",
    parseError: null,
    parsedThreadId: null,
    parsedMessageId: null,
    parsedAt: null,
  },
  {
    evidenceId: "EVID-007-1",
    title: "Vendor quotation",
    type: "quote",
    source: "Vendor Representative <vendor@example.com>",
    date: "19 May 2026, 11:30",
    linkedCaseId: "CASE-24-007",
    description: "Commercial quotation attached for project clarification.",
    status: "Needs Review",
    storageState: "metadata-only",
    sourceType: "document-placeholder",
    workspaceAssignment: "Projects",
    linkedIntakeItemRef: "Vendor quotation note for project review",
    linkedCaseRef: "CASE-24-007",
    originalFilename: "vendor-quotation.pdf",
    fileSizeBytes: 198912,
    storageBucket: null,
    storagePath: null,
    mimeType: "application/pdf",
    uploadedAt: "19 May 2026, 11:30",
    parseStatus: "unsupported",
    parseError: null,
    parsedThreadId: null,
    parsedMessageId: null,
    parsedAt: null,
  },
  {
    evidenceId: "EVID-003-1",
    title: "Management note",
    type: "note",
    source: "Assistant Note",
    date: "18 May 2026, 17:44",
    linkedCaseId: "CASE-24-003",
    description: "General workspace note that can later become a draft response.",
    status: "Linked",
    storageState: "metadata-only",
    sourceType: "manual-note",
    workspaceAssignment: "Other",
    linkedIntakeItemRef: "Manual note for management review",
    linkedCaseRef: "CASE-24-003",
    originalFilename: null,
    fileSizeBytes: null,
    storageBucket: null,
    storagePath: null,
    mimeType: null,
    uploadedAt: "18 May 2026, 17:44",
    parseStatus: "unsupported",
    parseError: null,
    parsedThreadId: null,
    parsedMessageId: null,
    parsedAt: null,
  },
  {
    evidenceId: "EVID-STAGE-001",
    title: "Incoming EML upload staging",
    type: "eml-placeholder",
    source: "Import staging",
    date: "21 May 2026, 10:18",
    linkedCaseId: null,
    description: "A staged EML file waiting for private upload and later classification.",
    status: "Pending",
    storageState: "staged",
    sourceType: "eml-placeholder",
    workspaceAssignment: "Import/Staging",
    linkedIntakeItemRef: "Class survey note awaiting evidence",
    linkedCaseRef: "Evidence case placeholder",
    originalFilename: "incoming-message.eml",
    fileSizeBytes: 31744,
    storageBucket: null,
    storagePath: null,
    mimeType: "message/rfc822",
    uploadedAt: null,
    parseStatus: "not parsed",
    parseError: null,
    parsedThreadId: null,
    parsedMessageId: null,
    parsedAt: null,
  },
  {
    evidenceId: "EVID-STAGE-002",
    title: "Imported screenshot pending upload",
    type: "screenshot",
    source: "Import staging",
    date: "21 May 2026, 10:28",
    linkedCaseId: null,
    description: "Screenshot evidence staged for future private upload.",
    status: "Needs Review",
    storageState: "staged",
    sourceType: "screenshot-placeholder",
    workspaceAssignment: "Import/Staging",
    linkedIntakeItemRef: "Screenshot placeholder for vessel follow-up",
    linkedCaseRef: "Evidence case placeholder",
    originalFilename: "docking-note.png",
    fileSizeBytes: 224512,
    storageBucket: null,
    storagePath: null,
    mimeType: "image/png",
    uploadedAt: null,
    parseStatus: "unsupported",
    parseError: null,
    parsedThreadId: null,
    parsedMessageId: null,
    parsedAt: null,
  },
  {
    evidenceId: "EVID-STAGE-003",
    title: "Manual note metadata only",
    type: "note",
    source: "Import staging",
    date: "21 May 2026, 10:41",
    linkedCaseId: null,
    description: "Metadata-only intake evidence with no attached file yet.",
    status: "Pending",
    storageState: "fallback-prototype",
    sourceType: "manual-note",
    workspaceAssignment: "Import/Staging",
    linkedIntakeItemRef: "Manual note for management review",
    linkedCaseRef: "Evidence case placeholder",
    originalFilename: null,
    fileSizeBytes: null,
    storageBucket: null,
    storagePath: null,
    mimeType: null,
    uploadedAt: null,
    parseStatus: "unsupported",
    parseError: null,
    parsedThreadId: null,
    parsedMessageId: null,
    parsedAt: null,
  },
];

export const importSourceTypes: { value: ImportSourceType; label: string; help: string }[] = [
  { value: "pasted-email", label: "Pasted email", help: "Paste a message or header snippet." },
  { value: "manual-note", label: "Manual note", help: "Freeform internal note or reminder." },
  {
    value: "screenshot-placeholder",
    label: "Screenshot placeholder",
    help: "Placeholder for a future image intake.",
  },
  {
    value: "document-placeholder",
    label: "Document placeholder",
    help: "Placeholder for notes, PDF, or document intake.",
  },
  { value: "eml-placeholder", label: "EML placeholder", help: "Placeholder for imported email files." },
];

export const importWorkspaceAssignments: ImportWorkspaceAssignment[] = [
  "Import/Staging",
  "LNG PORTHARCOURT II",
  "LPG ALFRED TEMILE",
  "LPG ALFRED TEMILE 10",
  "Projects",
  "Other",
];

export const importIntakeStatuses: {
  value: ImportIntakeStatus;
  label: string;
  tone: StatusTone;
  hint: string;
}[] = [
  { value: "unclassified", label: "Unclassified", tone: "neutral", hint: "Still in staging." },
  {
    value: "pending-my-reply",
    label: "Pending My Reply",
    tone: "warning",
    hint: "Waiting on the user.",
  },
  {
    value: "waiting-on-vessel",
    label: "Waiting on Vessel",
    tone: "neutral",
    hint: "Waiting on vessel input.",
  },
  {
    value: "waiting-on-vendor",
    label: "Waiting on Vendor",
    tone: "neutral",
    hint: "Waiting on vendor input.",
  },
  {
    value: "waiting-on-class",
    label: "Waiting on Class",
    tone: "neutral",
    hint: "Waiting on class input.",
  },
  {
    value: "waiting-on-management",
    label: "Waiting on Management",
    tone: "neutral",
    hint: "Waiting on management input.",
  },
  {
    value: "decision-required",
    label: "Decision Required",
    tone: "warning",
    hint: "Needs a clear decision.",
  },
  {
    value: "needs-evidence",
    label: "Needs Evidence",
    tone: "danger",
    hint: "Missing supporting material.",
  },
  {
    value: "monitoring",
    label: "Monitoring",
    tone: "accent",
    hint: "Track but do not act yet.",
  },
];

export const importIntakeSeedItems: ImportIntakeItem[] = [
  {
    id: "intake-1",
    title: "Class survey note awaiting evidence",
    sourceType: "pasted-email",
    workspaceAssignment: "Import/Staging",
    status: "needs-evidence",
    senderSource: "Class Surveyor <survey@class.example>",
    dateTime: "21 May 2026, 08:14",
    bodyContent:
      "Please attach the latest repair photos and confirm whether the missing insulation note has been updated.",
    tags: ["class", "evidence", "AT10"],
    routeNote: "Not yet assigned. Ready for manual classification.",
    casePlaceholder: "Case link placeholder: Unlinked",
    createdLabel: "Created from pasted email",
  },
  {
    id: "intake-2",
    title: "Vendor quotation note for project review",
    sourceType: "manual-note",
    workspaceAssignment: "Projects",
    status: "decision-required",
    senderSource: "Projects Desk",
    dateTime: "21 May 2026, 09:02",
    bodyContent:
      "Need to decide whether the quoted supply term should be accepted as-is or returned for clarification.",
    tags: ["project", "quotation", "decision"],
    routeNote: "Simulated assignment to Projects for follow-up.",
    casePlaceholder: "Case link placeholder: CASE-24-007",
    createdLabel: "Created as manual note",
  },
  {
    id: "intake-3",
    title: "Screenshot placeholder for vessel follow-up",
    sourceType: "screenshot-placeholder",
    workspaceAssignment: "LNG PORTHARCOURT II",
    status: "waiting-on-vessel",
    senderSource: "Operations Inbox",
    dateTime: "20 May 2026, 16:20",
    bodyContent:
      "Placeholder intake for a screenshot that should later be attached to the docking comment trail.",
    tags: ["screenshot", "docking", "vessel"],
    routeNote: "Simulated assignment to LNG PORTHARCOURT II.",
    casePlaceholder: "Case link placeholder: CASE-24-011",
    createdLabel: "Created as screenshot placeholder",
  },
];
