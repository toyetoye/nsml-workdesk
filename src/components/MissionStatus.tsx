type MissionStats = {
  taskCount: number;
  outputCount: number;
  evidenceCount: number;
  decisionCount: number;
  memoryCount: number;
};

function getMissionState(stats: MissionStats) {
  if (stats.taskCount === 0) {
    return {
      stage: "Brief",
      progress: 10,
      action: "Run Chief of Staff",
      detail: "No tasks exist yet. Generate the workplan first.",
    };
  }

  if (stats.outputCount === 0) {
    return {
      stage: "Staff Runs",
      progress: 35,
      action: "Run All Agents",
      detail: "Tasks exist. Now let the assigned staff investigate.",
    };
  }

  if (stats.evidenceCount === 0) {
    return {
      stage: "Evidence",
      progress: 50,
      action: "Review agent outputs",
      detail: "Agent outputs exist, but no evidence has been captured yet.",
    };
  }

  if (stats.decisionCount === 0) {
    return {
      stage: "Memo",
      progress: 75,
      action: "Generate Executive Memo",
      detail: "Evidence exists. Convert the findings into a decision memo.",
    };
  }

  if (stats.memoryCount === 0) {
    return {
      stage: "Memory",
      progress: 90,
      action: "Save Memory",
      detail: "Memo exists. Save useful decisions and lessons into memory.",
    };
  }

  return {
    stage: "Decision Ready",
    progress: 100,
    action: "Close or continue project",
    detail: "This project has gone through the full decision pipeline.",
  };
}

export function MissionStatus({ stats }: { stats: MissionStats }) {
  const state = getMissionState(stats);

  return (
    <section className="card p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D8A84E]">
            Mission Status
          </p>

          <h2 className="mt-2 text-3xl font-bold text-white">
            {state.stage}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            {state.detail}
          </p>
        </div>

        <div className="rounded-2xl border border-[#233450] bg-[#101B2E] p-4 md:min-w-64">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Recommended Action
          </p>
          <p className="mt-2 text-lg font-bold text-white">{state.action}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>Pipeline Progress</span>
          <span>{state.progress}%</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[#101B2E]">
          <div
            className="h-full rounded-full bg-[#D8A84E]"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <div className="rounded-2xl bg-[#101B2E] p-3">
          <p className="text-xs text-slate-400">Tasks</p>
          <p className="mt-1 text-xl font-bold text-white">{stats.taskCount}</p>
        </div>

        <div className="rounded-2xl bg-[#101B2E] p-3">
          <p className="text-xs text-slate-400">Outputs</p>
          <p className="mt-1 text-xl font-bold text-white">{stats.outputCount}</p>
        </div>

        <div className="rounded-2xl bg-[#101B2E] p-3">
          <p className="text-xs text-slate-400">Evidence</p>
          <p className="mt-1 text-xl font-bold text-white">{stats.evidenceCount}</p>
        </div>

        <div className="rounded-2xl bg-[#101B2E] p-3">
          <p className="text-xs text-slate-400">Memos</p>
          <p className="mt-1 text-xl font-bold text-white">{stats.decisionCount}</p>
        </div>

        <div className="rounded-2xl bg-[#101B2E] p-3">
          <p className="text-xs text-slate-400">Memory</p>
          <p className="mt-1 text-xl font-bold text-white">{stats.memoryCount}</p>
        </div>
      </div>
    </section>
  );
}
