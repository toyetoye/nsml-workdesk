#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function parseEnvContent(content) {
  const parsed = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    let key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1);

    if (!key) continue;

    if (key.startsWith("export ")) {
      key = key.slice(7).trim();
    }

    value = value.trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in parsed)) {
      parsed[key] = value;
    }
  }

  return parsed;
}

function loadEnvFiles() {
  const cwd = process.cwd();
  const candidates = [".env.local", ".env"];

  for (const fileName of candidates) {
    const filePath = path.join(cwd, fileName);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const parsed = parseEnvContent(content);

    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined || process.env[key] === "") {
        process.env[key] = value;
      }
    }
  }
}

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, number) => String.fromCharCode(Number(number)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}

function stripHtml(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const headingMatch =
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) ||
    html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);

  const withBreaks = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|section|article|header|footer|li|tr|table|ul|ol|blockquote|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<(h[1-6])[^>]*>/gi, "\n## ")
    .replace(/<[^>]+>/g, " ");

  const text = decodeHtmlEntities(withBreaks)
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  const title = decodeHtmlEntities(
    (titleMatch?.[1] ?? headingMatch?.[1] ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );

  return {
    title: title || "IMS document",
    text,
  };
}

function stripText(content) {
  return content.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function readTextFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function tokenize(value) {
  return [...new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3),
  )];
}

function chunkText(text, sourceTitle) {
  const lines = text.split(/\n/);
  const chunks = [];
  let currentHeading = null;
  let currentParagraphs = [];
  let currentLength = 0;
  let chunkIndex = 0;

  function pushChunk() {
    const chunkText = currentParagraphs.join("\n\n").trim();
    if (!chunkText) {
      currentHeading = null;
      currentParagraphs = [];
      currentLength = 0;
      return;
    }

    chunks.push({
      chunk_index: chunkIndex,
      heading_optional: currentHeading,
      text: chunkText,
      token_estimate: Math.max(1, Math.ceil(chunkText.split(/\s+/).filter(Boolean).length * 1.3)),
      keywords_optional: tokenize(`${sourceTitle} ${currentHeading ?? ""} ${chunkText}`).slice(0, 12),
    });
    chunkIndex += 1;
    currentHeading = null;
    currentParagraphs = [];
    currentLength = 0;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (currentParagraphs.length > 0) {
        currentParagraphs.push("");
      }
      continue;
    }

    const headingMatch = line.match(/^#{1,6}\s+(.*)$/) || line.match(/^[A-Z0-9][A-Z0-9\s/&-]{8,}$/);
    if (headingMatch && line.length < 160) {
      if (currentParagraphs.length > 0) {
        pushChunk();
      }

      currentHeading = headingMatch[1] ? headingMatch[1].trim() : line.replace(/^#{1,6}\s+/, "").trim();
      currentParagraphs.push(currentHeading ? `## ${currentHeading}` : line);
      currentLength = currentParagraphs.join("\n\n").length;
      continue;
    }

    if (currentLength > 0 && currentLength + line.length > 1200) {
      pushChunk();
    }

    currentParagraphs.push(line);
    currentLength = currentParagraphs.join("\n\n").length;
  }

  pushChunk();
  return chunks;
}

function collectFiles(rootDir) {
  const results = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      results.push(fullPath);
    }
  }

  walk(rootDir);
  return results.sort((left, right) => left.localeCompare(right));
}

function logSummary(label, state, details) {
  console.log(`- ${label}: ${state}${details ? ` - ${details}` : ""}`);
}

loadEnvFiles();

const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const sourceDir = path.resolve(process.cwd(), process.env.IMS_SOURCE_DIR?.trim() || "private/ims-source");

console.log("NSML WorkDesk IMS indexing");
console.log(`Source directory: ${sourceDir}`);

if (!supabaseUrl || !serviceRoleKey) {
  console.error("IMS indexing requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exitCode = 1;
  process.exit(1);
}

if (!fs.existsSync(sourceDir)) {
  console.error(`IMS source directory not found: ${sourceDir}`);
  process.exitCode = 1;
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supportedExtensions = new Set([".html", ".htm", ".txt", ".md"]);
const allFiles = collectFiles(sourceDir);
const totalFiles = allFiles.length;
let indexedFiles = 0;
let skippedFiles = 0;
let failedFiles = 0;
const warnings = [];
const runId = `ims-run-${Date.now()}`;

await client.from("ims_index_runs").upsert({
  id: runId,
  source_label: normalizePath(path.relative(process.cwd(), sourceDir)) || "private/ims-source",
  status: "running",
  total_files: totalFiles,
  indexed_files: 0,
  skipped_files: 0,
  failed_files: 0,
  warnings: [],
  started_at: new Date().toISOString(),
  completed_at: null,
});

for (const fullPath of allFiles) {
  const relativePath = normalizePath(path.relative(sourceDir, fullPath));
  const extension = path.extname(fullPath).toLowerCase();

  if (!supportedExtensions.has(extension)) {
    skippedFiles += 1;
    warnings.push(`Skipped ${relativePath}: unsupported source format.`);
    continue;
  }

  try {
    const rawContent = readTextFile(fullPath);
    const checksum = sha256(rawContent);
    const sourceType = extension.slice(1);
    const versionLabel = path.basename(fullPath);
    let title = path.parse(fullPath).name;
    let extractedText = "";

    if (extension === ".html" || extension === ".htm") {
      const extracted = stripHtml(rawContent);
      title = extracted.title || title;
      extractedText = extracted.text;
    } else {
      extractedText = stripText(rawContent);
      const firstLine = extractedText.split(/\r?\n/).find((line) => line.trim())?.trim();
      title = firstLine && firstLine.length <= 140 ? firstLine : title;
    }

    if (!extractedText) {
      skippedFiles += 1;
      warnings.push(`Skipped ${relativePath}: no readable text found.`);
      await client.from("ims_reference_documents").upsert({
        id: `ims-doc-${sha256(relativePath).slice(0, 16)}`,
        title,
        source_path: relativePath,
        source_type: sourceType,
        version_label: versionLabel,
        effective_date_optional: null,
        status: "skipped",
        indexed_at: new Date().toISOString(),
        checksum_optional: checksum,
        notes: "No readable text found during IMS indexing.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      continue;
    }

    const documentId = `ims-doc-${sha256(relativePath).slice(0, 16)}`;
    const indexedAt = new Date().toISOString();
    const chunks = chunkText(extractedText, title);

    await client.from("ims_reference_documents").upsert({
      id: documentId,
      title,
      source_path: relativePath,
      source_type: sourceType,
      version_label: versionLabel,
      effective_date_optional: null,
      status: "indexed",
      indexed_at: indexedAt,
      checksum_optional: checksum,
      notes: "Indexed from local/admin IMS source tree.",
      created_at: indexedAt,
      updated_at: indexedAt,
    });

    if (chunks.length === 0) {
      warnings.push(`Indexed ${relativePath}, but no chunks were produced.`);
      skippedFiles += 1;
      continue;
    }

    const chunkRows = chunks.map((chunk) => ({
      id: `ims-chunk-${documentId}-${String(chunk.chunk_index).padStart(4, "0")}`,
      document_id: documentId,
      source_path: relativePath,
      heading_optional: chunk.heading_optional,
      chunk_index: chunk.chunk_index,
      text: chunk.text,
      token_estimate: chunk.token_estimate,
      keywords_optional: chunk.keywords_optional,
      status: "indexed",
      created_at: indexedAt,
      updated_at: indexedAt,
    }));

    const { error: chunkError } = await client.from("ims_reference_chunks").upsert(chunkRows);

    if (chunkError) {
      throw chunkError;
    }

    indexedFiles += 1;
    console.log(`Indexed ${relativePath} (${chunks.length} chunks)`);
  } catch (error) {
    failedFiles += 1;
    const message = error instanceof Error ? error.message : "Unknown IMS indexing failure.";
    warnings.push(`Failed ${relativePath}: ${message}`);
    console.error(`Failed ${relativePath}: ${message}`);

    await client.from("ims_reference_documents").upsert({
      id: `ims-doc-${sha256(relativePath).slice(0, 16)}`,
      title: path.parse(fullPath).name,
      source_path: relativePath,
      source_type: extension.slice(1),
      version_label: path.basename(fullPath),
      effective_date_optional: null,
      status: "failed",
      indexed_at: new Date().toISOString(),
      checksum_optional: null,
      notes: message.slice(0, 500),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

const finalStatus =
  failedFiles > 0 && indexedFiles === 0
    ? "failed"
    : warnings.length > 0
      ? "completed_with_warnings"
      : "completed";

await client.from("ims_index_runs").upsert({
  id: runId,
  source_label: normalizePath(path.relative(process.cwd(), sourceDir)) || "private/ims-source",
  status: finalStatus,
  total_files: totalFiles,
  indexed_files: indexedFiles,
  skipped_files: skippedFiles,
  failed_files: failedFiles,
  warnings,
  started_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
});

console.log("");
console.log("IMS indexing complete");
logSummary("Files scanned", "completed", String(totalFiles));
logSummary("Indexed files", "completed", String(indexedFiles));
logSummary("Skipped files", warnings.length > 0 ? "warnings" : "completed", String(skippedFiles));
logSummary("Failed files", failedFiles > 0 ? "failed" : "completed", String(failedFiles));
logSummary("Warnings", warnings.length > 0 ? "present" : "none", String(warnings.length));

if (warnings.length > 0) {
  console.log("Warnings:");
  for (const warning of warnings.slice(0, 25)) {
    console.log(`- ${warning}`);
  }
}

if (finalStatus === "failed") {
  process.exitCode = 1;
}
