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
