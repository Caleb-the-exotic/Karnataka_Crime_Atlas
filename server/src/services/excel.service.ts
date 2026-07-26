import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { createError } from "../middleware/error-handler.js";
import type { ImportStatus, LogLevel } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────
interface SheetRow {
  [key: string]: string | number | undefined;
}

interface ParseResult {
  sheetName: string;
  headers: string[];
  rows: SheetRow[];
  errors: string[];
}

// ── Utility ───────────────────────────────────────────────────────────────
function normalizeHeader(h: unknown): string {
  return String(h ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

function parseNumber(v: unknown): number | null {
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// ── Parse Excel ───────────────────────────────────────────────────────────
export function parseExcelFile(filePath: string): ParseResult[] {
  const workbook = XLSX.readFile(filePath, { type: "file", cellDates: true });
  const results: ParseResult[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
    }) as unknown[][];

    if (!rawRows.length) {
      results.push({ sheetName, headers: [], rows: [], errors: ["Sheet is empty"] });
      continue;
    }

    const headers = (rawRows[0] as unknown[]).map(normalizeHeader);
    const rows: SheetRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < rawRows.length; i++) {
      const rawRow = rawRows[i] as unknown[];
      const row: SheetRow = {};
      let hasValue = false;

      headers.forEach((h, j) => {
        const val = rawRow[j];
        if (val !== "" && val !== undefined && val !== null) hasValue = true;
        row[h] = val as string | number | undefined;
      });

      if (hasValue) rows.push(row);
    }

    results.push({ sheetName, headers, rows, errors });
  }

  return results;
}

// ── Log to DB ─────────────────────────────────────────────────────────────
async function addLog(
  batchId: number,
  level: LogLevel,
  message: string,
  rowNumber?: number,
  sheetName?: string,
  rawData?: string
) {
  await prisma.excelImportLog.create({
    data: {
      BatchID: batchId,
      LogLevel: level,
      Message: message,
      RowNumber: rowNumber,
      SheetName: sheetName,
      RawData: rawData ? rawData.slice(0, 2000) : undefined,
    },
  });
}

// ── Import District-Wise Stats ─────────────────────────────────────────────
async function importDistrictWise(rows: SheetRow[], batchId: number): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0, skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const district = String(row["districts/units"] ?? row["district"] ?? "").trim();
    const ipcCount = parseNumber(row["ipc/bns_crimes"]);
    const sllCount = parseNumber(row["sll_crimes"]);

    if (!district || district.length < 2) { skipped++; continue; }

    try {
      // Upsert into KnowledgeRecord for AI access
      await prisma.knowledgeRecord.upsert({
        where: {
          // Use a synthetic unique check via raw (Prisma doesn't support unique on non-unique fields)
          RecordID: 0, // Will never match — force create
        },
        create: {
          SourceFile: "ka-district-wise-2025.csv",
          RecordType: "DISTRICT_STATS",
          District: district,
          Category: "IPC_SLL_TOTAL",
          Year: 2025,
          Count: ipcCount ?? undefined,
          YtdCount: sllCount ?? undefined,
          Tags: ["district", "2025", "ipc", "sll"],
          RawText: `${district}: IPC/BNS=${ipcCount ?? "N/A"}, SLL=${sllCount ?? "N/A"}`,
        },
        update: {
          Count: ipcCount ?? undefined,
          YtdCount: sllCount ?? undefined,
          UpdatedAt: new Date(),
        },
      }).catch(async () => {
        // Unique constraint may fail, try plain create
        await prisma.knowledgeRecord.create({
          data: {
            SourceFile: "ka-district-wise-2025.csv",
            RecordType: "DISTRICT_STATS",
            District: district,
            Category: "IPC_SLL_TOTAL",
            Year: 2025,
            Count: ipcCount ?? undefined,
            YtdCount: sllCount ?? undefined,
            Tags: ["district", "2025", "ipc", "sll"],
            RawText: `${district}: IPC/BNS=${ipcCount ?? "N/A"}, SLL=${sllCount ?? "N/A"}`,
          },
        });
      });
      inserted++;
    } catch (err) {
      await addLog(batchId, "WARNING", `Row ${i + 2}: Skipped district "${district}" — ${String(err)}`, i + 2, "district-wise");
      skipped++;
    }
  }
  return { inserted, skipped };
}

// ── Import IPC Crime Heads ─────────────────────────────────────────────────
async function importIpcCrimeHeads(rows: SheetRow[], batchId: number): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0, skipped = 0;
  let currentHead = "";

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const headField = String(row["heads_of_crime"] ?? row["sl._no."] ?? row["heads"] ?? "").trim();
    const count = parseNumber(row["for_2025"] ?? row["count"] ?? row["total"]);

    if (!headField) { skipped++; continue; }

    if (/^[A-Z]/.test(headField) && headField.length > 3) {
      currentHead = headField;
    }

    const subCategory = headField !== currentHead ? headField : undefined;

    try {
      await prisma.knowledgeRecord.create({
        data: {
          SourceFile: "ka-ipc-crimes-2025.csv",
          RecordType: "IPC_CRIME_HEAD",
          Category: currentHead || headField,
          SubCategory: subCategory,
          Year: 2025,
          Count: count ?? undefined,
          Tags: ["ipc", "2025", "crime-head"],
          RawText: `${currentHead}${subCategory ? " > " + subCategory : ""}: ${count ?? "N/A"}`,
        },
      });
      inserted++;
    } catch (err) {
      await addLog(batchId, "WARNING", `Row ${i + 2}: ${String(err)}`, i + 2, "ipc-crimes");
      skipped++;
    }
  }
  return { inserted, skipped };
}

// ── Generic Knowledge Import ───────────────────────────────────────────────
async function importGenericKnowledge(
  rows: SheetRow[],
  sourceFile: string,
  recordType: string,
  batchId: number
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0, skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawText = Object.entries(row)
      .filter(([, v]) => v !== "" && v !== undefined)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");

    if (rawText.length < 5) { skipped++; continue; }

    const countKey = Object.keys(row).find((k) => /count|total|for_2025|cases/.test(k));
    const distKey = Object.keys(row).find((k) => /district|unit/.test(k));
    const catKey = Object.keys(row).find((k) => /head|crime|category/.test(k));

    try {
      await prisma.knowledgeRecord.create({
        data: {
          SourceFile: sourceFile,
          RecordType: recordType,
          District: distKey ? String(row[distKey] ?? "").trim() : undefined,
          Category: catKey ? String(row[catKey] ?? "").trim() : undefined,
          Year: 2025,
          Count: countKey ? parseNumber(row[countKey]) ?? undefined : undefined,
          Tags: [recordType.toLowerCase(), "2025"],
          RawText: rawText.slice(0, 1000),
        },
      });
      inserted++;
    } catch (err) {
      await addLog(batchId, "WARNING", `Row ${i + 2}: ${String(err)}`, i + 2, sourceFile);
      skipped++;
    }
  }
  return { inserted, skipped };
}

// ── Detect Source & Route ──────────────────────────────────────────────────
function detectImportStrategy(sheetName: string, headers: string[]): string {
  const h = headers.join(",");
  if (h.includes("ipc/bns_crimes") || h.includes("sll_crimes")) return "DISTRICT_WISE";
  if (h.includes("heads_of_crime") && h.includes("for_2025")) return "IPC_CRIME_HEAD";
  if (h.includes("crimes_against_women") || h.includes("crimes_against_children")) return "VULNERABLE_GROUPS";
  if (h.includes("major_heads") && h.includes("during_the_current_month")) return "MONTHLY_REVIEW";
  if (h.includes("2021") || h.includes("2022") || h.includes("2023")) return "HISTORICAL";
  return "GENERIC";
}

// ── Main Import Function ───────────────────────────────────────────────────
export async function importExcelFile(batchId: number, filePath: string): Promise<void> {
  let totalInserted = 0, totalSkipped = 0, totalInvalid = 0;

  await prisma.excelImportBatch.update({
    where: { BatchID: batchId },
    data: { Status: "PROCESSING", StartedAt: new Date() },
  });

  await addLog(batchId, "INFO", `Starting import of ${path.basename(filePath)}`);

  try {
    const sheets = parseExcelFile(filePath);
    let totalRows = 0;

    for (const sheet of sheets) {
      totalRows += sheet.rows.length;
      if (sheet.errors.length) {
        for (const err of sheet.errors) {
          await addLog(batchId, "WARNING", err, undefined, sheet.sheetName);
        }
      }
    }

    await prisma.excelImportBatch.update({
      where: { BatchID: batchId },
      data: { TotalRows: totalRows },
    });

    for (const sheet of sheets) {
      if (!sheet.rows.length) continue;

      const strategy = detectImportStrategy(sheet.sheetName, sheet.headers);
      await addLog(batchId, "INFO", `Processing sheet "${sheet.sheetName}" [${strategy}] — ${sheet.rows.length} rows`, undefined, sheet.sheetName);

      let result: { inserted: number; skipped: number };

      switch (strategy) {
        case "DISTRICT_WISE":
          result = await importDistrictWise(sheet.rows, batchId);
          break;
        case "IPC_CRIME_HEAD":
          result = await importIpcCrimeHeads(sheet.rows, batchId);
          break;
        default:
          result = await importGenericKnowledge(
            sheet.rows,
            path.basename(filePath),
            strategy,
            batchId
          );
      }

      totalInserted += result.inserted;
      totalSkipped += result.skipped;
      await addLog(batchId, "SUCCESS", `Sheet "${sheet.sheetName}": ${result.inserted} inserted, ${result.skipped} skipped`, undefined, sheet.sheetName);
    }

    const finalStatus: ImportStatus = totalInserted > 0 ? "COMPLETED" : "PARTIALLY_COMPLETED";

    await prisma.excelImportBatch.update({
      where: { BatchID: batchId },
      data: {
        Status: finalStatus,
        ValidRows: totalInserted,
        SkippedRows: totalSkipped,
        InvalidRows: totalInvalid,
        InsertedRows: totalInserted,
        CompletedAt: new Date(),
      },
    });

    await addLog(batchId, "SUCCESS", `Import complete: ${totalInserted} inserted, ${totalSkipped} skipped, ${totalInvalid} invalid`);
    logger.info(`Excel import batch ${batchId} completed: ${totalInserted} records inserted`);
  } catch (err) {
    logger.error(`Excel import batch ${batchId} failed:`, err);
    await prisma.excelImportBatch.update({
      where: { BatchID: batchId },
      data: { Status: "FAILED", ErrorMessage: String(err), CompletedAt: new Date() },
    });
    await addLog(batchId, "ERROR", `Import failed: ${String(err)}`);
  }
}

// ── Create Batch Record ────────────────────────────────────────────────────
export async function createImportBatch(file: Express.Multer.File, importedBy: string, isReImport = false) {
  return prisma.excelImportBatch.create({
    data: {
      FileName: file.filename,
      OriginalName: file.originalname,
      FileSizeBytes: BigInt(file.size),
      MimeType: file.mimetype,
      StoragePath: file.path,
      ImportedBy: importedBy,
      Status: "PENDING",
      IsReImport: isReImport,
    },
  });
}

// ── Get Import History ──────────────────────────────────────────────────────
export async function getImportHistory(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [batches, total] = await prisma.$transaction([
    prisma.excelImportBatch.findMany({
      skip,
      take: limit,
      orderBy: { CreatedAt: "desc" },
      include: {
        Logs: { where: { LogLevel: "ERROR" }, take: 5 },
      },
    }),
    prisma.excelImportBatch.count(),
  ]);
  return { batches, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
}

// ── Get Batch Logs ──────────────────────────────────────────────────────────
export async function getBatchLogs(batchId: number) {
  const batch = await prisma.excelImportBatch.findUnique({ where: { BatchID: batchId } });
  if (!batch) throw createError("Import batch not found", 404);
  const logs = await prisma.excelImportLog.findMany({
    where: { BatchID: batchId },
    orderBy: { CreatedAt: "asc" },
  });
  return { batch, logs };
}
