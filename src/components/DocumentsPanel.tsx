import { uploadProjectDocument } from "@/actions/documents";
import { supabase } from "@/lib/supabase";

function formatFileSize(size?: number | null) {
  if (!size) return "Unknown size";

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export async function DocumentsPanel({ projectId }: { projectId: string }) {
  const { data: documents } = await supabase
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .order("uploaded_at", { ascending: false });

  return (
    <section className="space-y-5">
      <div className="card p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D8A84E]">
          Project Documents
        </p>

        <h2 className="mt-1 text-2xl font-bold text-white">
          Upload project context
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          Attach PDFs, Word documents, text files, spreadsheets, or source documents to this project.
          Text extraction and agent document reading comes next.
        </p>

        <form action={uploadProjectDocument} className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <input type="hidden" name="project_id" value={projectId} />

          <input
            name="file"
            type="file"
            required
            className="rounded-2xl border border-[#233450] bg-[#101B2E] p-3 text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-[#D8A84E] file:px-4 file:py-2 file:font-semibold file:text-[#08111F]"
          />

          <button className="btn-primary">Upload</button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-bold text-white">Uploaded Documents</h3>

        {(documents ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#233450] p-5 text-sm text-slate-400">
            No documents uploaded yet.
          </div>
        )}

        {(documents ?? []).map((doc) => (
          <article key={doc.id} className="card p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h4 className="font-semibold text-white">{doc.file_name}</h4>
                <p className="mt-1 text-sm text-slate-400">
                  {doc.file_type || "unknown"} - {formatFileSize(doc.file_size)}
                </p>
              </div>

              <span className="rounded-full bg-[#101B2E] px-3 py-1 text-xs text-[#D8A84E]">
                Attached
              </span>
            </div>

            <p className="mt-3 break-all text-xs text-slate-500">
              {doc.file_path}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}