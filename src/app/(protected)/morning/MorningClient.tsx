"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  MessageSquarePlus,
  Plus,
  Upload,
} from "lucide-react";
import type { ImportIntakeStatus, ImportWorkspaceAssignment } from "@/lib/mock-data";
import { importScoutOutputAction, quickLogAction } from "./actions";

// ─── types ───────────────────────────────────────────────────────────────────

type MorningItem = {
  id: string;
  title: string;
  from: string;
  status: ImportIntakeStatus;
  workspace: string;
  receivedAt: string;
  routeNote: string;
};

type Props = {
  today: string;
  activeItems: MorningItem[];
  unclassifiedCount: number;
  pendingDraftCount: number;
  failedDraftCount: number;
  needReply: number;
  waiting: number;
  monitoring: number;
};

// ─── constants ───────────────────────────────────────────────────────────────

const WORKSPACES: Array<{ value: ImportWorkspaceAssignment; label: string }> = [
  { value: "LNG PORTHARCOURT II", label: "LNG Port Harcourt II" },
  { value: "LPG ALFRED TEMILE", label: "LPG Alfred Temile" },
  { value: "LPG ALFRED TEMILE 10", label: "LPG Alfred Temile 10" },
  { value: "Other", label: "LNG Rivers / Adamawa / Other" },
  { value: "Projects", label: "Projects" },
  { value: "Import/Staging", label: "General / Not vessel-specific" },
];

const STATUSES: Array<{ value: ImportIntakeStatus; label: string }> = [
  { value: "pending-my-reply", label: "Need to reply" },
  { value: "waiting-on-vessel", label: "Waiting on vessel" },
  { value: "waiting-on-vendor", label: "Waiting on vendor" },
  { value: "waiting-on-class", label: "Waiting on class" },
  { value: "waiting-on-management", label: "Waiting on management" },
  { value: "decision-required", label: "Decision required" },
  { value: "monitoring", label: "Monitoring" },
  { value: "needs-evidence", label: "Needs evidence" },
];

const STATUS_GROUPS: Array<{
  key: ImportIntakeStatus[];
  label: string;
  color: "red" | "amber" | "purple" | "slate";
}> = [
  { key: ["pending-my-reply"], label: "Need to reply", color: "amber" },
  { key: ["decision-required"], label: "Decision required", color: "amber" },
  {
    key: ["waiting-on-vessel", "waiting-on-vendor", "waiting-on-class", "waiting-on-management"],
    label: "Waiting on others",
    color: "purple",
  },
  { key: ["monitoring", "needs-evidence"], label: "Monitoring", color: "slate" },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function workspaceLabel(ws: string) {
  return ws
    .replace("LNG PORTHARCOURT II", "LNG PHC II")
    .replace("LPG ALFRED TEMILE 10", "LPG AT 10")
    .replace("LPG ALFRED TEMILE", "LPG AT")
    .replace("Import/Staging", "Staging");
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatusBorderColor(color: "red" | "amber" | "purple" | "slate") {
  return {
    red: "border-l-red-500",
    amber: "border-l-amber-500",
    purple: "border-l-violet-500",
    slate: "border-l-slate-300",
  }[color];
}

function StatusPillClass(color: "red" | "amber" | "purple" | "slate") {
  return {
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-500",
  }[color];
}

function MorningCard({
  item,
  color,
}: {
  item: MorningItem;
  color: "red" | "amber" | "purple" | "slate";
}) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white border-l-4 ${StatusBorderColor(color)}`}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 leading-5">{item.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-block rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {workspaceLabel(item.workspace)}
            </span>
            {item.from ? (
              <span className="text-xs text-slate-500 truncate">{item.from}</span>
            ) : null}
            <span className="text-xs text-slate-400">{relativeTime(item.receivedAt)}</span>
          </div>
          {item.routeNote ? (
            <p className="mt-1 text-xs text-slate-400">{item.routeNote}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${StatusPillClass(color)}`}
          >
            {item.status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <Link
            href="/drafts"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900"
          >
            {color === "amber" ? "Draft reply" : "View"}
            <ArrowRight aria-hidden size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── quick log form ───────────────────────────────────────────────────────────

function QuickLogForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [what, setWhat] = useState("");
  const [vessel, setVessel] = useState<ImportWorkspaceAssignment>("LNG PORTHARCOURT II");
  const [status, setStatus] = useState<ImportIntakeStatus>("pending-my-reply");
  const [due, setDue] = useState("");
  const [from, setFrom] = useState("");

  function handleSave() {
    if (!what.trim()) { setError("Description is required."); return; }
    setError("");
    startTransition(async () => {
      const result = await quickLogAction({ what, vessel, status, due, from });
      if (result.ok) {
        router.refresh();
        onDone();
      } else {
        setError(result.error ?? "Failed to save.");
      }
    });
  }

  const inputCls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none";

  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-teal-800">Log an obligation</p>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">What needs doing</label>
        <input className={inputCls} value={what} onChange={e => setWhat(e.target.value)} placeholder="e.g. Reply to class survey notice — certificates expire 15 Sept" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Vessel</label>
          <select className={inputCls} value={vessel} onChange={e => setVessel(e.target.value as ImportWorkspaceAssignment)}>
            {WORKSPACES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
          <select className={inputCls} value={status} onChange={e => setStatus(e.target.value as ImportIntakeStatus)}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Due date (optional)</label>
          <input type="date" className={inputCls} value={due} onChange={e => setDue(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">From (optional)</label>
          <input className={inputCls} value={from} onChange={e => setFrom(e.target.value)} placeholder="e.g. surveyor@class.org" />
        </div>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-teal-800"
        >
          {isPending ? "Saving…" : "Save obligation"}
        </button>
        <button onClick={onDone} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── scout paste import ───────────────────────────────────────────────────────

function ScoutImport({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");

  function handleImport() {
    if (!text.trim()) { setError("Paste the Scout output first."); return; }
    setError("");
    startTransition(async () => {
      const res = await importScoutOutputAction(text);
      if (res.ok) {
        setResult(res);
        router.refresh();
      } else {
        setError(res.errors[0] ?? "Import failed.");
        setResult(res);
      }
    });
  }

  if (result && result.created > 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
          <CheckCircle2 size={16} />
          {result.created} obligation{result.created === 1 ? "" : "s"} added to your Morning list.
        </div>
        {result.skipped > 0 ? <p className="mt-1 text-xs text-slate-500">{result.skipped} items skipped (unrecognised format).</p> : null}
        {result.errors.length > 0 ? <p className="mt-1 text-xs text-red-600">{result.errors.join(" · ")}</p> : null}
        <button onClick={onDone} className="mt-3 text-xs font-semibold text-teal-700 hover:underline">Done</button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">Paste WorkDesk Scout output</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Open Copilot in Outlook, ask your WorkDesk Scout agent "What needs my attention this week?", then paste the result here.
        </p>
      </div>
      <textarea
        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-mono leading-5 focus:border-teal-400 focus:outline-none"
        rows={10}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={"---\nVESSEL: LNG Port Harcourt II\nWHAT: Reply to class survey notice\nFROM: surveyor@class.org\nSTATUS: Need to reply\nDUE: 15 Sept 2026\n---\nVESSEL: LPG Alfred Temile\nWHAT: Fuel consumption query from charterer\n..."}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-slate-800"
        >
          {isPending ? "Importing…" : "Import obligations"}
        </button>
        <button onClick={onDone} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function MorningClient({
  today,
  activeItems,
  unclassifiedCount,
  pendingDraftCount,
  failedDraftCount,
  needReply,
  waiting,
  monitoring,
}: Props) {
  const [mode, setMode] = useState<"list" | "quick-log" | "scout">("list");

  function colorForGroup(color: "red" | "amber" | "purple" | "slate") {
    return color;
  }

  return (
    <div className="space-y-4 py-4">
      {/* Hero summary */}
      <div className="rounded-xl bg-slate-900 p-4 text-white">
        <p className="text-xs text-slate-400">{today}</p>
        <p className="mt-1 text-xl font-bold">
          {needReply > 0
            ? `${needReply} item${needReply === 1 ? "" : "s"} need your reply today`
            : "Nothing needs your reply right now"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {needReply > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
              {needReply} need reply
            </span>
          )}
          {waiting > 0 && (
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-800">
              {waiting} waiting on others
            </span>
          )}
          {monitoring > 0 && (
            <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200">
              {monitoring} monitoring
            </span>
          )}
          {pendingDraftCount > 0 && (
            <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-800">
              {pendingDraftCount} draft{pendingDraftCount === 1 ? "" : "s"} pending review
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {mode === "list" && (
        <div className="flex gap-2">
          <button
            onClick={() => setMode("quick-log")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-100"
          >
            <Plus size={15} />
            Log obligation
          </button>
          <button
            onClick={() => setMode("scout")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <MessageSquarePlus size={15} />
            Paste Scout output
          </button>
        </div>
      )}

      {/* Quick log */}
      {mode === "quick-log" && <QuickLogForm onDone={() => setMode("list")} />}

      {/* Scout import */}
      {mode === "scout" && <ScoutImport onDone={() => setMode("list")} />}

      {/* Alerts */}
      {unclassifiedCount > 0 && mode === "list" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{unclassifiedCount}</span> captured item{unclassifiedCount === 1 ? "" : "s"} still need routing.
          </p>
          <Link href="/import?view=manual" className="text-xs font-semibold text-amber-800 hover:underline">
            Route now →
          </Link>
        </div>
      )}

      {failedDraftCount > 0 && mode === "list" && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
          <p className="text-sm text-red-800">
            <span className="font-semibold">{failedDraftCount}</span> draft{failedDraftCount === 1 ? "" : "s"} failed red-team review.
          </p>
          <Link href="/drafts" className="text-xs font-semibold text-red-800 hover:underline">
            Review →
          </Link>
        </div>
      )}

      {/* Triage list */}
      {mode === "list" && (
        <>
          {activeItems.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center">
              <CheckCircle2 className="mx-auto mb-3 text-slate-300" size={32} />
              <p className="text-sm font-semibold text-slate-500">Nothing outstanding</p>
              <p className="mt-1 text-xs text-slate-400">
                Log an obligation above, or paste your Copilot Scout output to populate this list.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {STATUS_GROUPS.map((group) => {
                const items = activeItems.filter((item) =>
                  (group.key as string[]).includes(item.status),
                );
                if (items.length === 0) return null;
                return (
                  <section key={group.label}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      {group.label} ({items.length})
                    </p>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <MorningCard key={item.id} item={item} color={group.color} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
