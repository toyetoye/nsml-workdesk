import { ProjectControls } from "@/components/ProjectControls";
import { AgentOutputs } from "@/components/AgentOutputs";
import { RunAllAgentsButton } from "@/components/RunAllAgentsButton";
import { ChiefOfStaffPanel } from "@/components/ChiefOfStaffPanel";
import { EvidencePanel } from "@/components/EvidencePanel";
import { ExecutiveMemoPanel } from "@/components/ExecutiveMemoPanel";
import { MemoryPanel } from "@/components/MemoryPanel";
import { MissionStatus } from "@/components/MissionStatus";
import { ProjectWorkspaceTabs } from "@/components/ProjectWorkspaceTabs";
import { RedTeamPanel } from "@/components/RedTeamPanel";
import { TaskList } from "@/components/TaskList";
import { createTask } from "@/actions/tasks";

type Project = {
  id: string;
  name: string;
  decision_question: string;
  objective?: string | null;
  status: string;
  confidence: string;
};

type Agent = {
  id: string;
  name: string;
  role: string;
};

type Task = {
  id: string;
  title: string;
  assigned_agent: string;
  priority: string;
  status: string;
  confidence: string;
  evidence_count: number;
};

const workflowSteps = [
  "Brief",
  "Workplan",
  "Staff Runs",
  "Evidence",
  "Red Team",
  "Memo",
  "Memory",
];

function StepRail() {
  return (
    <div className="card p-4">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#D8A84E]">
        Operating Sequence
      </p>

      <div className="grid gap-2 md:grid-cols-7">
        {workflowSteps.map((step, index) => (
          <div
            key={step}
            className="rounded-2xl border border-[#233450] bg-[#101B2E] p-3"
          >
            <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#D8A84E] text-xs font-bold text-[#08111F]">
              {index + 1}
            </div>
            <p className="text-sm font-semibold text-white">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectHealth({ project, agents, tasks }: { project: Project; agents: Agent[]; tasks: Task[] }) {
  const reviewedTasks = tasks.filter((task) => task.status === "Review").length;
  const evidenceCount = tasks.reduce((sum, task) => sum + (task.evidence_count ?? 0), 0);

  return (
    <section className="grid gap-3 md:grid-cols-4">
      <div className="card p-4">
        <p className="text-sm text-slate-400">Status</p>
        <p className="mt-2 text-2xl font-bold text-white">{project.status}</p>
      </div>

      <div className="card p-4">
        <p className="text-sm text-slate-400">Staff Available</p>
        <p className="mt-2 text-2xl font-bold text-white">{agents.length}</p>
      </div>

      <div className="card p-4">
        <p className="text-sm text-slate-400">Tasks in Review</p>
        <p className="mt-2 text-2xl font-bold text-white">{reviewedTasks}</p>
      </div>

      <div className="card p-4">
        <p className="text-sm text-slate-400">Evidence Items</p>
        <p className="mt-2 text-2xl font-bold text-white">{evidenceCount}</p>
      </div>
    </section>
  );
}

function ManualTaskForm({ projectId, agents }: { projectId: string; agents: Agent[] }) {
  return (
    <section className="card p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D8A84E]">
        Manual Override
      </p>
      <h2 className="mt-1 text-2xl font-bold text-white">Add Task</h2>
      <p className="mt-1 text-sm text-slate-400">
        Use this when you want to directly assign work without waiting for the Chief of Staff.
      </p>

      <form action={createTask} className="mt-5 grid gap-3 md:grid-cols-[1fr_220px_160px_auto]">
        <input type="hidden" name="project_id" value={projectId} />

        <input
          name="title"
          required
          placeholder="Task title"
          className="rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-sm text-white outline-none"
        />

        <select
          name="assigned_agent"
          className="rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-sm text-white outline-none"
        >
          <option value="">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.name}>
              {agent.name}
            </option>
          ))}
        </select>

        <select
          name="priority"
          className="rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-sm text-white outline-none"
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>

        <button className="btn-primary">Add</button>
      </form>
    </section>
  );
}

function StaffDirectory({ agents }: { agents: Agent[] }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-2xl font-bold text-white">Available Staff</h2>
        <p className="mt-1 text-sm text-slate-400">
          Permanent staff members available for assignment across projects.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {agents.map((agent) => (
          <article key={agent.id} className="card p-4">
            <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{agent.role}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProjectCommandCenter({
  project,
  agents,
  tasks,
  missionStats,
}: {
  project: Project;
  agents: Agent[];
  tasks: Task[];
  missionStats: {
    taskCount: number;
    outputCount: number;
    evidenceCount: number;
    decisionCount: number;
    memoryCount: number;
  };
}) {
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8A84E]">
          Project Command Center
        </p>

        <h1 className="text-4xl font-bold text-white">{project.name}</h1>

        <p className="max-w-3xl text-lg leading-7 text-slate-300">
          {project.decision_question}
        </p>
      </header>

      <ProjectHealth project={project} agents={agents} tasks={tasks} />

      <MissionStatus stats={missionStats} />

      <ProjectControls project={project} />

      <StepRail />

      <ProjectWorkspaceTabs
        sections={{
          Command: (
  <div className="space-y-4">
    <div className="flex flex-col gap-3 md:flex-row">
      <RunAllAgentsButton projectId={project.id} />
    </div>
    <ChiefOfStaffPanel projectId={project.id} />
  </div>
),
          Tasks: (
            <div className="space-y-5">
              <TaskList tasks={tasks} />
              <ManualTaskForm projectId={project.id} agents={agents} />
            </div>
          ),
          Outputs: <AgentOutputs projectId={project.id} />,
          Evidence: <EvidencePanel projectId={project.id} />,
          "Red Team": <RedTeamPanel projectId={project.id} />,
          Memo: <ExecutiveMemoPanel projectId={project.id} />,
          Memory: <MemoryPanel projectId={project.id} />,
          Staff: <StaffDirectory agents={agents} />,
        }}
      />
    </section>
  );
}




