"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

const BUCKET = "project-documents";

export async function uploadProjectDocument(formData: FormData) {
  const projectId = String(formData.get("project_id") || "");
  const file = formData.get("file") as File | null;

  if (!projectId) {
    throw new Error("Project ID is required.");
  }

  if (!file || file.size === 0) {
    throw new Error("A file is required.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filePath = `${projectId}/${Date.now()}-${safeName}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { error: insertError } = await supabase.from("project_documents").insert({
      project_id: projectId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type || "unknown",
      file_size: file.size,
      storage_bucket: BUCKET,
    });

    if (insertError) {
      throw new Error(`Document record insert failed: ${insertError.message}`);
    }

    revalidatePath("/projects");
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(`Document upload failed: ${message}`);
  }
}
