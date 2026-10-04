"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit2,
  Plus,
  ShieldAlert,
  X,
} from "lucide-react";
import type {
  VesselHealthItem,
  VesselHealthCategory,
  VesselHealthStatus,
  VesselHealthSource,
} from "@/lib/persistence/vessel-health-types";
import {
  addHealthItemAction,
  updateHealthItemAction,
  deleteHealthItemAction,
} from "@/app/(protected)/vessels/health-actions";

// ─── config ──────────────────────────────────────────────────────────────────

const CATEGORIES: Array<{ key: VesselHealthCategory; label: string; icon: string }> = [
  { key: "machinery", label: "Machinery & Equipment", icon: "⚙️" },
  { key: "safety-certificates", label: "Safety & Certificates", icon: "📋" },
  { key: "crew-manning", label: "Crew & Manning", icon: "👷" },
  { key: "performance", label: "Performance", icon: "📊" },
  { key: "hseq", label: "HSEQ", icon: "🛡" },
];

const STATUSES: Array<{ value: VesselHealthStatus; label: string; color: string }> = [
  { value: "ok", label: "OK", color: "text-green-700 bg-green-50 border-green-200" },
  { value: "watch", label: "Watch", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { value: "flag", label: "Flag", color: "text-orange-700 bg-orange-50 border-orange-200" },
  { value: "critical", label: "Critical", color: "text-red-700 bg-red-50 border-red-200" },
];

const SOURCES: Array<{ value: VesselHealthSource; label: string }> = [
  { value: "manual", label: "Manual entry" },
  { value: "noon-report", label: "Noon report" },
  { value: "inspection-report", label: "Inspection report" },
  { value: "defect-log", label: "Defect / maintenance log" },
  { value: "ai-detected", label: "AI detected from evidence" },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function statusBadge(status: VesselHealthStatus) {
  const s = STATUSES.find((x) => x.value === status)!;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${s.color}`}>
      {status === "critical" ? "⚠" : status === "flag" ? "⚑" : status === "watch" ? "~" : "✓"} {s.label}
    </span>
  );
}

function conflictBanner(item: VesselHealthItem) {
  if (item.crew_reported_ok && item.status !== "ok" && item.independently_verified) {
    return (
      <div className="mt-1 flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">
        <AlertTriangle size={11} />
        Crew reports OK — evidence conflicts
      </div>
    );
  }
  return null;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── add / edit form ─────────────────────────────────────────────────────────

type FormState = {
  item_name: string;
  category: VesselHealthCategory;
  status: VesselHealthStatus;
  source: VesselHealthSource;
  notes: string;
  due_date: string;
  crew_reported_ok: boolean;
  independently_verified: boolean;
};

const BLANK: FormState = {
  item_name: "",
  category: "machinery",
  status: "ok",
  source: "manual",
  notes: "",
  due_date: "",
  crew_reported_ok: true,
  independently_verified: false,
};

function HealthForm({
  vesselKey,
  initial,
  healthId,
  onClose,
}: {
  vesselKey: string;
  initial?: FormState;
  healthId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial ?? BLANK);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const set = (k: keyof FormState, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  function handleSave() {
    if (!form.item_name.trim()) { setError("Item name is required."); return; }
    setError("");
    startTransition(async () => {
      const payload = { ...form, vessel_key: vesselKey };
      const result = healthId
        ? await updateHealthItemAction(healthId, form)
        : await addHealthItemAction(payload);
      if (result.ok) { router.refresh(); onClose(); }
      else setError(result.error ?? "Save failed.");
    });
  }

  const inputCls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none";
  const labelCls = "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1";

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-teal-900">{healthId ? "Edit item" : "Add health item"}</p>
        <button onClick={onClose}><X size={15} className="text-slate-400" /></button>
      </div>

      <div>
        <label className={labelCls}>Item name</label>
        <input className={inputCls} value={form.item_name} onChange={(e) => set("item_name", e.target.value)} placeholder="e.g. Main engine — cylinder liner No.3" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Category</label>
          <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value as VesselHealthCategory)}>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value as VesselHealthStatus)}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Source</label>
          <select className={inputCls} value={form.source} onChange={(e) => set("source", e.target.value as VesselHealthSource)}>
            {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Due / expiry date</label>
          <input type="date" className={inputCls} value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Additional context, action taken, follow-up required…" />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={form.crew_reported_ok} onChange={(e) => set("crew_reported_ok", e.target.checked)} className="rounded" />
          Crew reports OK
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={form.independently_verified} onChange={(e) => set("independently_verified", e.target.checked)} className="rounded" />
          Independently verified
        </label>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-teal-800"
        >
          {isPending ? "Saving…" : "Save item"}
        </button>
        <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── health row ───────────────────────────────────────────────────────────────

function HealthRow({
  item,
  vesselKey,
}: {
  item: VesselHealthItem;
  vesselKey: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${item.item_name}"?`)) return;
    startTransition(async () => {
      await deleteHealthItemAction(item.health_id);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="px-4 py-3">
        <HealthForm
          vesselKey={vesselKey}
          initial={{
            item_name: item.item_name,
            category: item.category,
            status: item.status,
            source: item.source,
            notes: item.notes ?? "",
            due_date: item.due_date ?? "",
            crew_reported_ok: item.crew_reported_ok,
            independently_verified: item.independently_verified,
          }}
          healthId={item.health_id}
          onClose={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{item.item_name}</p>
          {statusBadge(item.status)}
        </div>
        {conflictBanner(item)}
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <span>{SOURCES.find((s) => s.value === item.source)?.label ?? item.source}</span>
          {item.due_date ? <span className="flex items-center gap-1"><Clock size={10} /> Due {formatDate(item.due_date)}</span> : null}
          <span>Updated {formatDate(item.last_updated)}</span>
          {item.crew_reported_ok && <span className="text-green-600">✓ Crew OK</span>}
          {item.independently_verified && <span className="text-teal-600">✓ Verified</span>}
        </div>
        {item.notes ? <p className="mt-1 text-xs text-slate-500 leading-4">{item.notes}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button onClick={() => setEditing(true)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <Edit2 size={13} />
        </button>
        <button onClick={handleDelete} disabled={isPending} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── category section ─────────────────────────────────────────────────────────

function CategorySection({
  category,
  items,
  vesselKey,
}: {
  category: typeof CATEGORIES[number];
  items: VesselHealthItem[];
  vesselKey: string;
}) {
  const [open, setOpen] = useState(true);

  const flags = items.filter((i) => i.status === "flag" || i.status === "critical").length;
  const watches = items.filter((i) => i.status === "watch").length;
  const signal = flags > 0 ? "flag" : watches > 0 ? "watch" : "ok";

  const signalColor =
    signal === "flag" ? "text-red-500"
    : signal === "watch" ? "text-amber-500"
    : "text-green-500";

  const signalLabel =
    signal === "flag" ? `${flags} flag${flags > 1 ? "s" : ""}`
    : signal === "watch" ? `${watches} watch`
    : "All clear";

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{category.icon}</span>
          <span className="text-sm font-semibold text-slate-800">{category.label}</span>
          <span className="text-[11px] text-slate-400">({items.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold ${signalColor}`}>{signalLabel}</span>
          {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
        </div>
      </button>

      {open ? (
        <div>
          {items.length === 0 ? (
            <p className="px-4 pb-3 text-xs text-slate-400">No items in this category yet.</p>
          ) : (
            items.map((item) => (
              <HealthRow key={item.health_id} item={item} vesselKey={vesselKey} />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

export function VesselHealthTab({
  vesselKey,
  items,
}: {
  vesselKey: string;
  items: VesselHealthItem[];
}) {
  const [showForm, setShowForm] = useState(false);

  const totalFlags = items.filter((i) => i.status === "flag" || i.status === "critical").length;
  const conflicts = items.filter(
    (i) => i.crew_reported_ok && i.status !== "ok" && i.independently_verified,
  ).length;

  const byCategory = CATEGORIES.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.category === cat.key),
  }));

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {totalFlags > 0 || conflicts > 0 ? (
        <div className="flex flex-wrap gap-2">
          {totalFlags > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
              <ShieldAlert size={14} />
              {totalFlags} health flag{totalFlags > 1 ? "s" : ""} on this vessel
            </div>
          )}
          {conflicts > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              <AlertTriangle size={14} />
              {conflicts} crew self-report conflict{conflicts > 1 ? "s" : ""} — crew says OK but evidence differs
            </div>
          )}
        </div>
      ) : items.length > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
          <CheckCircle2 size={14} />
          No health flags on this vessel
        </div>
      ) : null}

      {/* Add form */}
      {showForm ? (
        <HealthForm vesselKey={vesselKey} onClose={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white py-3 text-sm font-semibold text-slate-600 hover:border-teal-400 hover:text-teal-700"
        >
          <Plus size={15} />
          Add health item
        </button>
      )}

      {/* Category sections */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            <p className="font-semibold">No health data yet for this vessel.</p>
            <p className="mt-1">Add items manually, or upload a life condition report to extract findings.</p>
          </div>
        ) : (
          byCategory.map(({ category, items: catItems }) => (
            <CategorySection
              key={category.key}
              category={category}
              items={catItems}
              vesselKey={vesselKey}
            />
          ))
        )}
      </div>

      {/* Upload nudge */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span className="font-semibold">Have a life condition report or inspection PDF?</span> Upload it via{" "}
        <a href="?view=evidence" className="font-semibold text-teal-700 hover:underline">Evidence</a> and WorkDesk will extract health items automatically when AI parsing is enabled.
      </div>
    </div>
  );
}
