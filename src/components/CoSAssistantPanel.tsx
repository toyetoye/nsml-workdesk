import { LockKeyhole, MessageSquareText, Sparkles } from "lucide-react";

export function CoSAssistantPanel() {
  return (
    <aside className="card h-fit p-4 xl:sticky xl:top-24 xl:w-80 2xl:w-[22rem]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            CoS Assistant
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Future workspace aide</h2>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-800">
          <Sparkles aria-hidden size={20} />
        </div>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Context
        </p>
        <p className="mt-1 text-sm font-bold text-slate-900">Current workspace</p>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        CoS Assistant will help analyse imports, cases, drafts, vessel issues, and
        pending actions. AI functionality will be added in a later sprint.
      </p>

      <div className="mt-4 grid gap-2">
        {[
          "Review imported material",
          "Summarise open cases",
          "Spot pending actions",
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            <MessageSquareText aria-hidden className="text-teal-700" size={16} />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <label className="mt-5 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Mock input
        </span>
        <textarea
          disabled
          rows={4}
          placeholder="Assistant input disabled for Sprint 000"
          className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-slate-100 p-3 text-sm text-slate-500 outline-none"
        />
      </label>

      <button
        disabled
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-bold text-slate-500"
      >
        <LockKeyhole aria-hidden size={16} />
        Disabled until AI sprint
      </button>
    </aside>
  );
}
