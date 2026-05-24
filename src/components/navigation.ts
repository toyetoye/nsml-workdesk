import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  FileEdit,
  FolderKanban,
  Home,
  Inbox,
  ShieldAlert,
  Ship,
  Upload,
  Settings2,
} from "lucide-react";

export type NavigationSection = {
  key: string;
  label: string;
  href: string;
};

export type NavigationNode = {
  label: string;
  href?: string;
  icon?: LucideIcon;
  sections?: NavigationSection[];
  children?: NavigationNode[];
};

export const importSections: NavigationSection[] = [
  { key: "overview", label: "Overview", href: "/import" },
  { key: "manual", label: "Manual Intake", href: "/import?view=manual" },
  { key: "bulk", label: "Bulk Evidence Intake", href: "/import?view=bulk" },
  { key: "parsed", label: "Parsed Threads", href: "/import?view=parsed" },
  { key: "route-link", label: "Route / Link", href: "/import?view=route-link" },
];

export const assuranceSections: NavigationSection[] = [
  { key: "overview", label: "Overview", href: "/assurance" },
  { key: "signals", label: "Signals", href: "/assurance?view=signals" },
  { key: "support-items", label: "Support Items", href: "/assurance?view=support-items" },
  { key: "engagement-log", label: "Engagement Log", href: "/assurance?view=engagement-log" },
  { key: "weekly-pack", label: "Weekly Pack", href: "/assurance?view=weekly-pack" },
];

export const caseSections: NavigationSection[] = [
  { key: "overview", label: "Overview", href: "/cases" },
  { key: "active", label: "Active Cases", href: "/cases?view=active" },
  { key: "evidence", label: "Evidence", href: "/cases?view=evidence" },
  { key: "correspondence", label: "Correspondence", href: "/cases?view=correspondence" },
  { key: "drafts", label: "Drafts", href: "/cases?view=drafts" },
];

export const draftSections: NavigationSection[] = [
  { key: "overview", label: "Overview", href: "/drafts" },
  { key: "pending_red_team", label: "Pending Red-Team", href: "/drafts?view=pending_red_team" },
  { key: "passed", label: "Passed", href: "/drafts?view=passed" },
  { key: "needs_evidence", label: "Needs Evidence", href: "/drafts?view=needs_evidence" },
  { key: "rejected", label: "Rejected", href: "/drafts?view=rejected" },
];

export const workspaceSections: NavigationSection[] = [
  { key: "overview", label: "Overview", href: "" },
  { key: "correspondence", label: "Correspondence", href: "?view=correspondence" },
  { key: "cases", label: "Cases", href: "?view=cases" },
  { key: "evidence", label: "Evidence", href: "?view=evidence" },
  { key: "drafts", label: "Drafts", href: "?view=drafts" },
  { key: "assurance_support", label: "Assurance / Support", href: "?view=assurance-support" },
];

export function workspaceSectionsFor(baseHref: string) {
  return workspaceSections.map((section) => ({
    ...section,
    href: section.key === "overview" ? baseHref : `${baseHref}${section.href}`,
  }));
}

export const sidebarNavigation: NavigationNode[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  {
    label: "Import & Evidence",
    href: "/import",
    icon: Upload,
    sections: importSections,
  },
  {
    label: "Vessels",
    icon: Ship,
    children: [
      {
      label: "LNG Port Harcourt II",
      href: "/vessels/lng-portharcourt-ii",
      icon: Ship,
      sections: workspaceSectionsFor("/vessels/lng-portharcourt-ii"),
    },
    {
      label: "LPG Alfred Temile",
      href: "/vessels/lpg-alfred-temile",
      icon: Ship,
      sections: workspaceSectionsFor("/vessels/lpg-alfred-temile"),
    },
    {
      label: "LPG Alfred Temile 10",
      href: "/vessels/lpg-alfred-temile-10",
      icon: Ship,
      sections: workspaceSectionsFor("/vessels/lpg-alfred-temile-10"),
    },
  ],
  },
  {
    label: "Assurance",
    href: "/assurance",
    icon: ShieldAlert,
    sections: assuranceSections,
  },
  {
    label: "Cases",
    href: "/cases",
    icon: ClipboardList,
    sections: caseSections,
  },
  {
    label: "Drafts",
    href: "/drafts",
    icon: FileEdit,
    sections: draftSections,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    sections: [
      { key: "overview", label: "Overview", href: "/projects" },
      { key: "correspondence", label: "Correspondence", href: "/projects?view=correspondence" },
      { key: "cases", label: "Cases", href: "/projects?view=cases" },
      { key: "evidence", label: "Evidence", href: "/projects?view=evidence" },
    ],
  },
  {
    label: "Other",
    href: "/other",
    icon: Inbox,
    sections: [
      { key: "overview", label: "Overview", href: "/other" },
      { key: "correspondence", label: "Correspondence", href: "/other?view=correspondence" },
      { key: "cases", label: "Cases", href: "/other?view=cases" },
      { key: "evidence", label: "Evidence", href: "/other?view=evidence" },
    ],
  },
  {
    label: "Settings",
    href: "/settings/writing-style",
    icon: Settings2,
    sections: [{ key: "writing-style", label: "Writing Style", href: "/settings/writing-style" }],
  },
];

export const bottomNavigation = sidebarNavigation.map((item) => ({
  label:
    item.label === "Import & Evidence"
      ? "Import"
      : item.label === "Settings"
        ? "Settings"
        : item.label,
  href:
    item.href ??
    (item.label === "Vessels" ? "/vessels/lng-portharcourt-ii" : item.sections?.[0]?.href ?? "#"),
  icon: item.icon,
}));

export function matchNavigationHref(currentPath: string, currentSearch: string, href?: string) {
  if (!href) {
    return false;
  }

  const parsed = new URL(href, "http://nsml.local");
  const targetPath = parsed.pathname;

  if (targetPath !== currentPath) {
    return false;
  }

  const targetParams = parsed.searchParams;

  if (targetParams.size === 0) {
    return true;
  }

  const currentParams = new URLSearchParams(currentSearch);

  for (const [key, value] of targetParams.entries()) {
    if (currentParams.get(key) !== value) {
      return false;
    }
  }

  return true;
}
