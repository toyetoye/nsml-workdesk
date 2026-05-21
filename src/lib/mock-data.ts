export type StatusTone = "danger" | "warning" | "accent" | "neutral";

export type DashboardStatus = {
  label: string;
  count: number;
  tone: StatusTone;
  why: string;
  nextAction: string;
};

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

export const dashboardStatuses: DashboardStatus[] = [
  {
    label: "Urgent",
    count: 2,
    tone: "danger",
    why: "Items may create technical, operational, or commercial exposure if delayed.",
    nextAction: "Review first and prepare a controlled response path.",
  },
  {
    label: "Pending My Reply",
    count: 4,
    tone: "warning",
    why: "The next move is waiting on the user, not an external party.",
    nextAction: "Confirm facts, evidence, and intended tone before replying.",
  },
  {
    label: "Waiting on Others",
    count: 7,
    tone: "neutral",
    why: "Progress depends on vendors, vessel teams, owners, class, or management.",
    nextAction: "Decide which items need a follow-up or escalation.",
  },
  {
    label: "Decision Required",
    count: 2,
    tone: "warning",
    why: "Work cannot move cleanly without a choice or documented instruction.",
    nextAction: "Capture the options, evidence, and recommended decision.",
  },
  {
    label: "Drafts Ready",
    count: 3,
    tone: "accent",
    why: "Draft responses are waiting for user review before any external use.",
    nextAction: "Review wording, remove unsupported claims, then copy manually if approved.",
  },
  {
    label: "Needs Evidence",
    count: 5,
    tone: "neutral",
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

export const importedEmailThreads: EmailThread[] = [
  {
    id: "thread-1",
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
