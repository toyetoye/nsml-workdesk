import Link from "next/link";

type ProjectCardProps = {
  id: string;
  name: string;
  status: string;
  decisionQuestion: string;
  confidence: string;
};

export function ProjectCard({
  id,
  name,
  status,
  decisionQuestion,
  confidence,
}: ProjectCardProps) {
  return (
    <Link href={`/projects/${id}`} className="card block p-4 transition hover:-translate-y-0.5 hover:border-[#D8A84E]/50">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <span className="shrink-0 rounded-full border border-[#233450] px-3 py-1 text-xs text-slate-300">
          {status}
        </span>
      </div>

      <p className="text-sm leading-6 text-slate-300">{decisionQuestion}</p>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>Decision project</span>
        <span>Confidence: {confidence}</span>
      </div>
    </Link>
  );
}