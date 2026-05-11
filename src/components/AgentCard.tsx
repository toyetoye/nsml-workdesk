type AgentCardProps = {
  name: string;
  role: string;
  status: string;
};

export function AgentCard({ name, role, status }: AgentCardProps) {
  return (
    <article className="card p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-white">{name}</h3>
        <span className="rounded-full bg-[#101B2E] px-3 py-1 text-xs text-[#D8A84E]">
          {status}
        </span>
      </div>

      <p className="text-sm leading-6 text-slate-300">{role}</p>
    </article>
  );
}