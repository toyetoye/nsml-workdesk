import { evidence } from "@/lib/mock-data";

export default function EvidencePage() {
  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8A84E]">
          Evidence
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white md:text-5xl">
          Claims before conclusions
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
          Every recommendation should be traceable to evidence, assumptions,
          confidence level, or open risks.
        </p>
      </header>

      <div className="grid gap-3">
        {evidence.map((item) => (
          <article key={item.claim} className="card p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="font-semibold text-white">{item.claim}</h3>
              <span className="rounded-full bg-[#101B2E] px-3 py-1 text-xs text-slate-300">
                {item.reliability}
              </span>
            </div>

            <p className="text-sm leading-6 text-slate-300">{item.source}</p>

            <p className="mt-3 text-xs text-slate-400">
              Used in memo: {item.used ? "Yes" : "No"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}