"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Eye, ArrowRight } from "lucide-react";

type VesselCard = {
  slug: string;
  name: string;
  shortName: string;
  type: string;
  href: string;
  needReply: number;
  openMatters: number;
  monitoring: number;
  healthScore: number;
  healthSignal: "critical" | "issue" | "watch" | "good";
  healthFlags: number;
};

type Props = {
  vessels: VesselCard[];
};

function HealthBar({ score, signal }: { score: number; signal: VesselCard["healthSignal"] }) {
  const color =
    signal === "critical" ? "#ef4444"
    : signal === "issue" ? "#f59e0b"
    : signal === "watch" ? "#eab308"
    : "#22c55e";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-400 uppercase tracking-wide">Health</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span
        className="text-[10px] font-bold"
        style={{ color }}
      >
        {signal === "critical" ? "⚠ Critical"
          : signal === "issue" ? "⚠ Issues"
          : signal === "watch" ? "~ Watch"
          : "✓ Good"}
      </span>
    </div>
  );
}

function VesselCard({ v }: { v: VesselCard }) {
  const hasBadge = v.needReply > 0 || v.healthSignal === "critical" || v.healthSignal === "issue";
  const borderColor =
    v.healthSignal === "critical" ? "border-t-red-500"
    : v.healthSignal === "issue" ? "border-t-amber-400"
    : "border-t-transparent";

  return (
    <Link
      href={v.href}
      className={`block rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-slate-300 hover:shadow-md transition border-t-4 ${borderColor}`}
    >
      {/* Head */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-sm text-slate-900 leading-5">{v.name}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{v.type}</p>
        </div>
        {hasBadge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
            v.healthSignal === "critical" || v.needReply > 0
              ? "bg-red-50 text-red-600"
              : "bg-amber-50 text-amber-600"
          }`}>
            {v.needReply > 0 ? `${v.needReply} reply` : "⚠ Issues"}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border-t border-slate-100">
        <div className="py-2.5 text-center border-r border-slate-100">
          <p className={`text-xl font-bold ${v.needReply > 0 ? "text-red-600" : "text-slate-900"}`}>
            {v.needReply}
          </p>
          <p className="text-[9px] text-slate-400 uppercase tracking-wide mt-0.5">Need reply</p>
        </div>
        <div className="py-2.5 text-center border-r border-slate-100">
          <p className={`text-xl font-bold ${v.openMatters > 3 ? "text-amber-600" : "text-slate-900"}`}>
            {v.openMatters}
          </p>
          <p className="text-[9px] text-slate-400 uppercase tracking-wide mt-0.5">Open</p>
        </div>
        <div className="py-2.5 text-center">
          <p className="text-xl font-bold text-slate-900">{v.monitoring}</p>
          <p className="text-[9px] text-slate-400 uppercase tracking-wide mt-0.5">Monitor</p>
        </div>
      </div>

      {/* Health bar */}
      <div className="px-4 py-2.5 border-t border-slate-100">
        <HealthBar score={v.healthScore} signal={v.healthSignal} />
      </div>

      {/* Open link */}
      <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Tap to open vessel</span>
        <ArrowRight size={12} className="text-slate-300" />
      </div>
    </Link>
  );
}

export function FleetClient({ vessels }: Props) {
  const hasAnyFlags = vessels.some(
    (v) => v.healthSignal === "critical" || v.healthSignal === "issue",
  );

  return (
    <div className="space-y-4 py-4">
      {/* Fleet alert if health issues exist */}
      {hasAnyFlags && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            One or more vessels have health flags. Open the vessel and check the{" "}
            <strong>Health tab</strong> — crew self-reports may not reflect actual condition.
          </p>
        </div>
      )}

      {/* Vessel cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vessels.map((v) => (
          <VesselCard key={v.slug} v={v} />
        ))}
      </div>

      {/* Footer links */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/cases"
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300"
        >
          All cases
          <ArrowRight size={14} className="text-slate-400" />
        </Link>
        <Link
          href="/import"
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300"
        >
          Capture evidence
          <ArrowRight size={14} className="text-slate-400" />
        </Link>
      </div>
    </div>
  );
}
