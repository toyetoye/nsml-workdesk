import Link from "next/link";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { IMSReferenceList } from "@/components/IMSReferenceList";
import {
  listIMSDocuments,
  listIMSIndexRuns,
  listIMSChunks,
} from "@/lib/persistence/repository";
import { isPersistenceAvailable } from "@/lib/persistence/client";
import { buildIMSReferencesForContext, getIMSStatusSnapshot } from "@/lib/ims/search";

type SearchParamsValue =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined> | undefined>
  | undefined;

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not indexed";
  }

  return value;
}

export default async function IMSReferenceLibraryPage({
  searchParams,
}: {
  searchParams?: SearchParamsValue;
}) {
  const resolvedSearchParams = (await Promise.resolve(searchParams ?? {})) ?? {};
  const query = firstValue(resolvedSearchParams.q).trim();
  const selectedChunkId = firstValue(resolvedSearchParams.chunk).trim();

  const [status, documents, chunks, runs] = await Promise.all([
    getIMSStatusSnapshot(),
    listIMSDocuments(),
    listIMSChunks(),
    listIMSIndexRuns(),
  ]);

  const searchResult = query
    ? await buildIMSReferencesForContext({
        sourceType: "settings_ims",
        sourceLabel: query,
        sourceSnapshot: { query },
      })
    : null;

  const latestRun = runs[0] ?? null;
  const indexedDocuments = documents.filter((document) => document.status === "indexed");
  const indexedChunks = chunks.filter((chunk) => chunk.status === "indexed");

  const searchSelectedChunk =
    searchResult?.references.find((item) => item.chunk_id === selectedChunkId) ??
    searchResult?.references[0] ??
    null;
  const fallbackSelectedChunk =
    searchSelectedChunk ??
    (indexedChunks[0] && documents.find((document) => document.id === indexedChunks[0].document_id)
      ? {
          document_title:
            documents.find((document) => document.id === indexedChunks[0].document_id)?.title ?? "IMS document",
          source_path: indexedChunks[0].source_path,
          chunk_id: indexedChunks[0].id,
          heading_optional: indexedChunks[0].heading_optional,
          chunk_index: indexedChunks[0].chunk_index,
          token_estimate: indexedChunks[0].token_estimate,
          snippet: indexedChunks[0].text.slice(0, 360),
          relevance_note: "Preview from the first indexed chunk because no search was run yet.",
          score: 0,
        }
      : null);

  return (
    <section className="space-y-6">
      <StickyPageHeader
        eyebrow="Settings"
        title="IMS Reference Library"
        description="IMS is controlled company reference guidance. It supports triage, drafting, red-team review, and assurance support, but it is not case evidence and must not flow through normal evidence intake."
        context={
          isPersistenceAvailable()
            ? status.note
            : "IMS reference not configured in this environment."
        }
        primaryAction={{ href: "#ims-search", label: "Search IMS" }}
        secondaryActions={[
          { href: "/settings/writing-style", label: "Writing Style" },
          { href: "/drafts", label: "Drafts" },
          { href: "/cases", label: "Cases" },
        ]}
        quickLinks={[
          { href: "#ims-status", label: "Status" },
          { href: "#ims-search", label: "Search" },
          { href: "#ims-documents", label: "Documents" },
          { href: "#ims-runs", label: "Index runs" },
        ]}
      />

      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        IMS is controlled reference guidance, not case evidence. Do not upload it through normal
        Bulk Evidence Intake and do not treat it as investigation material.
      </div>

      <section id="ims-status" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {status.configured ? "Configured" : "Not configured"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isPersistenceAvailable()
              ? "Backend IMS tables are reachable."
              : "Persistence is unavailable, so IMS remains a local fallback only."}
          </p>
        </article>

        <article className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Documents indexed
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{indexedDocuments.length}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Controlled reference documents currently available for retrieval.
          </p>
        </article>

        <article className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chunks indexed</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{indexedChunks.length}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Retrieval snippets available to AI prompt builders.
          </p>
        </article>

        <article className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Latest index run
          </p>
          <p className="mt-2 text-lg font-bold text-slate-950">
            {latestRun ? latestRun.status.replace(/_/g, " ") : "No runs yet"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {latestRun
              ? `${latestRun.indexed_files}/${latestRun.total_files} files indexed`
              : "Run the local IMS indexing script to populate the library."}
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <article id="ims-search" className="card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                Search / test IMS
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                Search indexed reference material
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Search uses keyword and chunk text matching only. It does not parse case evidence or
                replace human review.
              </p>
            </div>
            <StatusBadge tone={searchResult?.configured ? "accent" : "warning"}>
              {searchResult?.configured ? "Search ready" : "No IMS index"}
            </StatusBadge>
          </div>

          <form className="mt-4 flex flex-wrap items-end gap-3" method="get">
            <label className="block min-w-0 flex-1">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search terms
              </span>
              <input
                name="q"
                defaultValue={query}
                className="field-input"
                placeholder="e.g. class survey, vessel correspondence, technical note"
              />
            </label>
            <button type="submit" className="btn-primary">
              Search IMS
            </button>
            <Link href="/settings/ims" className="btn-secondary">
              Clear
            </Link>
          </form>

          <div className="mt-4">
            {searchResult ? (
              <IMSReferenceList
                title="Search results"
                note={searchResult.note}
                references={searchResult.references.map((reference) => ({
                  document_title: reference.document_title,
                  source_path: reference.source_path,
                  chunk_id: reference.chunk_id,
                  snippet: reference.snippet,
                  relevance_note: reference.relevance_note,
                }))}
                emptyLabel="No relevant IMS reference found for this query."
              />
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Enter a short search phrase to test IMS retrieval.
              </div>
            )}
          </div>
        </article>

        <aside className="space-y-4">
          <article className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Selected reference chunk preview
            </p>
            {fallbackSelectedChunk ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {fallbackSelectedChunk.document_title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{fallbackSelectedChunk.source_path}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Chunk {fallbackSelectedChunk.chunk_id} ·{" "}
                    {fallbackSelectedChunk.heading_optional ?? "No heading"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-800">
                    {fallbackSelectedChunk.snippet}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {fallbackSelectedChunk.relevance_note}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                    Token estimate {fallbackSelectedChunk.token_estimate}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                    Score {fallbackSelectedChunk.score.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Search IMS to preview a reference chunk here.
              </p>
            )}
          </article>

          <article className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Controlled reference note
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              IMS references guide alignment and citation. They do not create automatic conclusions
              and they do not replace case evidence.
            </p>
          </article>
        </aside>
      </section>

      <section id="ims-documents" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Indexed documents
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">IMS document registry</h2>
          </div>
          <span className="text-sm text-slate-500">{documents.length} total records</span>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {documents.length > 0 ? (
            documents.map((document) => (
              <article key={document.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{document.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{document.source_path}</p>
                  </div>
                  <StatusBadge tone={document.status === "indexed" ? "accent" : "warning"}>
                    {document.status}
                  </StatusBadge>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <InfoRow label="Source type" value={document.source_type} />
                  <InfoRow label="Version" value={document.version_label || "Not provided"} />
                  <InfoRow label="Effective date" value={formatDate(document.effective_date_optional)} />
                  <InfoRow label="Indexed at" value={document.indexed_at} />
                  <InfoRow label="Checksum" value={document.checksum_optional ?? "Not captured"} />
                  <InfoRow label="Notes" value={document.notes || "No notes"} />
                </div>
              </article>
            ))
          ) : (
            <div className="card p-4 text-sm leading-6 text-slate-600">
              No IMS documents have been indexed yet.
            </div>
          )}
        </div>
      </section>

      <section id="ims-runs" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Index runs
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Latest IMS index run</h2>
          </div>
          <span className="text-sm text-slate-500">
            {runs.length} run{runs.length === 1 ? "" : "s"}
          </span>
        </div>

        {runs.length > 0 ? (
          <div className="space-y-3">
            {runs.map((run) => (
              <article key={run.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{run.source_label}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Started {run.started_at}
                      {run.completed_at ? ` · Completed ${run.completed_at}` : ""}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      run.status === "failed"
                        ? "danger"
                        : run.status === "completed_with_warnings"
                          ? "warning"
                          : run.status === "completed"
                            ? "accent"
                            : "neutral"
                    }
                  >
                    {run.status}
                  </StatusBadge>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <InfoRow label="Total files" value={String(run.total_files)} />
                  <InfoRow label="Indexed files" value={String(run.indexed_files)} />
                  <InfoRow label="Skipped files" value={String(run.skipped_files)} />
                  <InfoRow label="Failed files" value={String(run.failed_files)} />
                  <InfoRow label="Warnings" value={String(run.warnings.length)} />
                </div>

                {run.warnings.length > 0 ? (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                    {run.warnings.join(" · ")}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="card p-4 text-sm leading-6 text-slate-600">
            No IMS index runs recorded yet.
          </div>
        )}
      </section>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}
