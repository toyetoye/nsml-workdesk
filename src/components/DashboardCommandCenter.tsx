import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  FolderOpen,
  Inbox,
  Settings2,
  ShieldAlert,
  Ship,
} from "lucide-react";
import { DashboardCard } from "@/components/DashboardCard";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import {
  attentionQueue,
  vesselWorkspaces,
} from "@/lib/mock-data";
import {
  listAssuranceSignals,
  listBulkEvidenceBatches,
  listCases,
  listDraftRedTeamReviews,
  listDraftResponses,
  listImportBatches,
  listWritingStyleProfiles,
} from "@/lib/persistence/repository";

type OverviewCard = {
  label: string;
  count: number;
  tone: "danger" | "warning" | "accent" | "neutral";
  summary: string;
  icon: ReactNode;
};

type ModuleCard = {
  title: string;
  summary: string;
  status: string;
  tone: "danger" | "warning" | "accent" | "neutral";
  href: string;
  ctaLabel: string;
  icon: ReactNode;
};

export async function DashboardCommandCenter() {
  const [
    caseRows,
    assuranceSignals,
    importBatches,
    bulkEvidenceBatches,
    draftRows,
    draftReviews,
    writingStyleProfiles,
  ] = await Promise.all([
    listCases(),
    listAssuranceSignals(),
    listImportBatches(),
    listBulkEvidenceBatches(),
    listDraftResponses(),
    listDraftRedTeamReviews(),
    listWritingStyleProfiles(),
  ]);

  const reviewedDraftIds = new Set(draftReviews.map((review) => review.draft_id));
  const pendingRedTeamCount = draftRows.filter((draft) => !reviewedDraftIds.has(draft.draft_id)).length;
  const batchCount = importBatches.length + bulkEvidenceBatches.length;
  const activeVesselCount = vesselWorkspaces.length;
  const urgentAttentionItems = attentionQueue.slice(0, 3);
  const writingStyleCount = writingStyleProfiles.length;

  const overviewCards: OverviewCard[] = [
    {
      label: "Active vessels",
      count: activeVesselCount,
      tone: "accent",
      summary: "Three vessel workspaces are live.",
      icon: <Ship aria-hidden size={20} />,
    },
    {
      label: "Open cases",
      count: caseRows.length,
      tone: "warning",
      summary: "Cases are open across vessel, project, and general work.",
      icon: <FolderOpen aria-hidden size={20} />,
    },
    {
      label: "Assurance signals",
      count: assuranceSignals.length,
      tone: "neutral",
      summary: "Signals and support items await structured follow-up.",
      icon: <ShieldAlert aria-hidden size={20} />,
    },
    {
      label: "Drafts pending red-team",
      count: pendingRedTeamCount,
      tone: "warning",
      summary: "Drafts remain review-gated before copy is possible.",
      icon: <FileText aria-hidden size={20} />,
    },
    {
      label: "Evidence/import batches",
      count: batchCount,
      tone: "accent",
      summary: "Import batches are staged or processed.",
      icon: <Inbox aria-hidden size={20} />,
    },
    {
      label: "Urgent attention items",
      count: urgentAttentionItems.length,
      tone: "danger",
      summary: "Top items need first review.",
      icon: <AlertTriangle aria-hidden size={20} />,
    },
  ];

  const moduleCards: ModuleCard[] = [
    {
      title: "Import & Evidence",
      summary: "Capture pasted email, bulk EMLs, and evidence.",
      status: `${batchCount} batches tracked`,
      tone: "accent",
      href: "/import",
      ctaLabel: "Open Import",
      icon: <Inbox aria-hidden size={20} />,
    },
    {
      title: "Assurance",
      summary: "Track signals, support items, engagement, and weekly pack.",
      status: `${assuranceSignals.length} signals`,
      tone: "neutral",
      href: "/assurance",
      ctaLabel: "Open Assurance",
      icon: <ShieldAlert aria-hidden size={20} />,
    },
    {
      title: "Cases",
      summary: "Manage active cases, evidence, correspondence, and decisions.",
      status: `${caseRows.length} open cases`,
      tone: "warning",
      href: "/cases",
      ctaLabel: "Open Cases",
      icon: <FolderOpen aria-hidden size={20} />,
    },
    {
      title: "Drafts",
      summary: "Review red-team status and safe-to-copy drafts.",
      status: `${pendingRedTeamCount} pending red-team`,
      tone: "warning",
      href: "/drafts",
      ctaLabel: "Open Drafts",
      icon: <FileText aria-hidden size={20} />,
    },
    {
      title: "Vessels",
      summary: "Jump into vessel workspaces for correspondence.",
      status: `${activeVesselCount} workspaces`,
      tone: "accent",
      href: "/vessels/lng-portharcourt-ii",
      ctaLabel: "Open Vessels",
      icon: <Ship aria-hidden size={20} />,
    },
    {
      title: "Writing Style / Settings",
      summary: "Tune greeting, tone, brevity, and stakeholder framing.",
      status: writingStyleCount > 0 ? `${writingStyleCount} profile${writingStyleCount === 1 ? "" : "s"}` : "Default safe style",
      tone: "neutral",
      href: "/settings/writing-style",
      ctaLabel: "Open Settings",
      icon: <Settings2 aria-hidden size={20} />,
    },
  ];

  return (
    <section className="space-y-6">
      <StickyPageHeader
        eyebrow="NSML WorkDesk"
        title="Dashboard"
        description="NSML WorkDesk overview."
        context="Overview and navigation only"
        primaryAction={{ href: "/import", label: "Import evidence", variant: "primary" }}
        secondaryActions={[
          { href: "/assurance", label: "Assurance" },
          { href: "/cases", label: "Cases" },
          { href: "/drafts", label: "Drafts" },
        ]}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {overviewCards.map((card) => (
          <DashboardCard
            key={card.label}
            label={card.label}
            count={card.count}
            tone={card.tone}
            summary={card.summary}
            icon={card.icon}
          />
        ))}
      </section>

      <section className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Modules</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Click through to the detailed work</h2>
          </div>
          <p className="text-sm leading-6 text-slate-600">Details stay inside the module pages.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {moduleCards.map((card) => (
            <ModuleCard key={card.title} card={card} />
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Top attention</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Highest-priority items</h2>
          </div>
          <p className="text-sm leading-6 text-slate-600">Top three only.</p>
        </div>

        <div className="grid gap-2 lg:grid-cols-3">
          {urgentAttentionItems.map((item) => (
            <article key={`${item.vessel}-${item.topic}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.vessel}</p>
                  <h3 className="mt-1 text-sm font-bold leading-5 text-slate-950">{item.topic}</h3>
                </div>
                <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
              </div>
              <Link
                href={item.vessel === "LPG ALFRED TEMILE 10" ? "/vessels/lpg-alfred-temile-10" : "/vessels/lng-portharcourt-ii"}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
              >
                Open context
                <ArrowRight aria-hidden size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ModuleCard({ card }: { card: ModuleCard }) {
  return (
    <article className="card flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.title}</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">{card.summary}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          {card.icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <StatusBadge tone={card.tone}>{card.status}</StatusBadge>
        <Link
          href={card.href}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
        >
          {card.ctaLabel}
          <ArrowRight aria-hidden size={16} />
        </Link>
      </div>
    </article>
  );
}
