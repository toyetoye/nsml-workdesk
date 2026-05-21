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

export type EmailAttachment = {
  name: string;
  kind: string;
  size: string;
};

export type EmailMessage = {
  sender: string;
  body: string;
  timestamp: string;
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
};

export type LinkedCorrespondenceItem = {
  caseRef: string;
  title: string;
  vesselProject: string;
  status: EmailStatus;
  threadCount: number;
  latestNote: string;
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
