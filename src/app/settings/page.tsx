export default function SettingsPage() {
  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8A84E]">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white md:text-5xl">
          Workspace setup
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
          Supabase, OpenAI keys, authentication, and agent defaults will be configured here.
        </p>
      </header>

      <div className="card p-4">
        <h2 className="font-semibold text-white">Environment variables needed later</h2>

        <pre className="mt-3 overflow-x-auto rounded-2xl bg-[#101B2E] p-4 text-xs text-slate-300">
{`NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=`}
        </pre>
      </div>
    </section>
  );
}