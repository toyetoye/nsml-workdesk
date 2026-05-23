import path from "node:path";
import * as yauzl from "yauzl";

export type SafeZipEntry = {
  fileName: string;
  relativePath: string;
  sizeBytes: number;
  buffer: Buffer;
};

export type ZipExtractionResult = {
  entries: SafeZipEntry[];
  unsupportedEntries: Array<{ fileName: string; reason: string }>;
  warnings: string[];
};

type ZipExtractionLimits = {
  maxFiles: number;
  maxSingleFileBytes: number;
  maxTotalBytes: number;
};

function normalizeArchivePath(fileName: string) {
  const sanitized = fileName.replace(/\\/g, "/").trim();
  const normalized = path.posix.normalize(sanitized);

  if (!normalized || normalized === "." || normalized.startsWith("../") || normalized.startsWith("..\\")) {
    return null;
  }

  if (normalized.startsWith("/")) {
    return null;
  }

  if (/^[a-zA-Z]:/.test(normalized)) {
    return null;
  }

  if (normalized.split("/").some((segment) => segment === ".." || segment === "")) {
    return null;
  }

  return normalized;
}

function openZipFromBuffer(buffer: Buffer) {
  return new Promise<yauzl.ZipFile>((resolve, reject) => {
    yauzl.fromBuffer(
      buffer,
      { lazyEntries: true, decodeStrings: true, validateEntrySizes: true },
      (error, zipfile) => {
        if (error || !zipfile) {
          reject(error ?? new Error("Unable to open ZIP archive."));
          return;
        }

        resolve(zipfile);
      },
    );
  });
}

function readEntryStream(zipfile: yauzl.ZipFile, entry: yauzl.Entry) {
  return new Promise<Buffer>((resolve, reject) => {
    zipfile.openReadStream(entry, (error, stream) => {
      if (error || !stream) {
        reject(error ?? new Error(`Unable to read ${entry.fileName}.`));
        return;
      }

      const chunks: Buffer[] = [];

      stream.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  });
}

export async function extractZipEntries(
  zipBuffer: Buffer,
  limits: ZipExtractionLimits,
): Promise<ZipExtractionResult> {
  const zipfile = await openZipFromBuffer(zipBuffer);
  const entries: SafeZipEntry[] = [];
  const unsupportedEntries: ZipExtractionResult["unsupportedEntries"] = [];
  const warnings: string[] = [];
  let totalBytes = 0;

  return await new Promise<ZipExtractionResult>((resolve, reject) => {
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      zipfile.close();
      resolve({ entries, unsupportedEntries, warnings });
    };

    const fail = (error: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      zipfile.close();
      reject(error);
    };

    zipfile.on("error", fail);
    zipfile.on("end", finish);
    zipfile.on("entry", (entry) => {
      try {
        const normalizedPath = normalizeArchivePath(entry.fileName);
        const isDirectory = entry.fileName.endsWith("/");

        if (isDirectory) {
          zipfile.readEntry();
          return;
        }

        if (!normalizedPath) {
          unsupportedEntries.push({
            fileName: entry.fileName,
            reason: "Unsupported archive entry path.",
          });
          warnings.push(`Rejected unsafe archive path: ${entry.fileName}`);
          zipfile.readEntry();
          return;
        }

        if (entries.length + unsupportedEntries.length >= limits.maxFiles) {
          fail(new Error(`The archive exceeds the ${limits.maxFiles} file limit.`));
          return;
        }

        if (!normalizedPath.toLowerCase().endsWith(".eml")) {
          unsupportedEntries.push({
            fileName: normalizedPath,
            reason: "Only .eml files are accepted from ZIP archives.",
          });
          warnings.push(`Skipped unsupported archive entry: ${normalizedPath}`);
          zipfile.readEntry();
          return;
        }

        if (entry.uncompressedSize > limits.maxSingleFileBytes) {
          unsupportedEntries.push({
            fileName: normalizedPath,
            reason: `File is larger than the ${Math.round(limits.maxSingleFileBytes / 1024 / 1024)} MB limit.`,
          });
          warnings.push(`Skipped oversized EML entry: ${normalizedPath}`);
          zipfile.readEntry();
          return;
        }

        if (totalBytes + entry.uncompressedSize > limits.maxTotalBytes) {
          fail(new Error(`The archive exceeds the total extraction limit of ${Math.round(limits.maxTotalBytes / 1024 / 1024)} MB.`));
          return;
        }

        readEntryStream(zipfile, entry)
          .then((buffer) => {
            totalBytes += buffer.length;

            if (buffer.length > limits.maxSingleFileBytes) {
              unsupportedEntries.push({
                fileName: normalizedPath,
                reason: `File is larger than the ${Math.round(limits.maxSingleFileBytes / 1024 / 1024)} MB limit.`,
              });
              warnings.push(`Skipped oversized extracted EML: ${normalizedPath}`);
            } else {
              entries.push({
                fileName: path.posix.basename(normalizedPath),
                relativePath: normalizedPath,
                sizeBytes: buffer.length,
                buffer,
              });
            }

            zipfile.readEntry();
          })
          .catch(fail);
      } catch (error) {
        fail(error instanceof Error ? error : new Error("Failed to extract ZIP entry."));
      }
    });

    zipfile.readEntry();
  });
}
