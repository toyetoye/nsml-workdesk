import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LockKeyhole, ShieldAlert } from "lucide-react";
import { getAccessGateStatus, normalizeRedirectTarget } from "@/lib/access-gate";
import { getAccessSessionState } from "@/lib/auth-session";
import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    status?: string;
    redirectTo?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const gate = getAccessGateStatus();
  const session = await getAccessSessionState();
  const resolvedSearchParams = await searchParams;
  const redirectTo = normalizeRedirectTarget(resolvedSearchParams?.redirectTo);

  if (session.authenticated) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card w-full max-w-xl p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-teal-50 text-teal-800">
            <LockKeyhole aria-hidden size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              NSML WorkDesk access
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">Single-user gate</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Protected access for deployed use. The app opens only after the session token is
              issued.
            </p>
          </div>
        </div>

        {resolvedSearchParams?.error === "invalid" ? (
          <Alert tone="danger" title="Password not accepted">
            Check the app password and try again.
          </Alert>
        ) : null}

        {resolvedSearchParams?.error === "setup" || gate.mode === "production-misconfigured" ? (
          <Alert tone="warning" title="Setup required">
            {gate.warningMessage} The app will stay closed until the access-gate env vars are
            configured.
          </Alert>
        ) : null}

        {resolvedSearchParams?.status === "logged-out" ? (
          <Alert tone="neutral" title="Logged out">
            The session cookie has been cleared.
          </Alert>
        ) : null}

        {gate.mode === "development-fallback" ? (
          <Alert tone="neutral" title="Development fallback active">
            {gate.warningMessage} You can continue locally without the gate, but the app should
            not be treated as protected until the env vars are configured.
          </Alert>
        ) : null}

        {gate.mode === "configured" ? (
          <form action={loginAction} className="mt-6 space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <Field label="App password">
              <input
                type="password"
                name="password"
                className="field-input"
                autoComplete="current-password"
                placeholder="Enter the NSML WorkDesk app password"
              />
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm leading-6 text-slate-600">
                Signed HTTP-only session cookie, single-user only.
              </p>
              <button type="submit" className="btn-primary">
                Enter app
                <ArrowRight aria-hidden size={16} />
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-900">
              <ShieldAlert aria-hidden size={18} />
              <p className="text-sm font-semibold">Local fallback mode</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              The app can be opened locally while the access-gate env vars are missing, but the
              fallback should only be used for development.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href="/dashboard" className="btn-primary">
                Continue to app
                <ArrowRight aria-hidden size={16} />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function Alert({
  tone,
  title,
  children,
}: {
  tone: "danger" | "warning" | "neutral";
  title: string;
  children: React.ReactNode;
}) {
  const toneStyles =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-950"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-slate-200 bg-slate-50 text-slate-900";

  return (
    <div className={`mt-4 rounded-md border p-4 ${toneStyles}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6">{children}</p>
    </div>
  );
}
