/**
 * Data import pipeline: real parsing, schema validation, duplicate detection
 * and column mapping for CSV / Excel / JSON / GeoJSON crime datasets.
 */
import { z } from "zod";

export type SourceFormat = "csv" | "xlsx" | "json" | "geojson";

export interface ParsedFile {
  format: SourceFormat;
  headers: string[];
  rows: Record<string, unknown>[];
  fileName: string;
  bytes: number;
}

export interface ValidationIssue {
  row: number;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface IngestResult {
  parsed: ParsedFile;
  mapping: Record<CanonicalField, string | null>;
  valid: CanonicalRecord[];
  issues: ValidationIssue[];
  duplicates: { row: number; matchesRow: number; key: string }[];
}

export const canonicalFields = [
  "fir",
  "date",
  "category",
  "district",
  "station",
  "severity",
  "latitude",
  "longitude",
  "status",
] as const;
export type CanonicalField = (typeof canonicalFields)[number];

export interface CanonicalRecord {
  fir: string;
  date: string;
  category: string;
  district: string;
  station?: string;
  severity?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}

/** Candidate header names for automatic column mapping. */
const synonyms: Record<CanonicalField, string[]> = {
  fir: ["fir", "fir_no", "firno", "fir number", "case", "case_id", "caseid", "id", "crime_id"],
  date: ["date", "incident_date", "occurred", "occurrence_date", "reported_on", "datetime", "timestamp"],
  category: ["category", "crime_type", "type", "offence", "offense", "crime", "head"],
  district: ["district", "dist", "zone", "region"],
  station: ["station", "police_station", "ps", "thana", "unit"],
  severity: ["severity", "priority", "grade", "level"],
  latitude: ["latitude", "lat", "y"],
  longitude: ["longitude", "lon", "lng", "long", "x"],
  status: ["status", "case_status", "state", "disposition"],
};

const norm = (s: string) => s.toLowerCase().trim().replace(/[\s\-.]+/g, "_");

export function autoMap(headers: string[]): Record<CanonicalField, string | null> {
  const map = {} as Record<CanonicalField, string | null>;
  for (const field of canonicalFields) {
    const hit = headers.find((h) => synonyms[field].includes(norm(h))) ?? null;
    map[field] = hit;
  }
  return map;
}

const recordSchema = z.object({
  fir: z.string().trim().min(1, "FIR/case identifier is required").max(64),
  date: z.string().trim().min(4, "Date is required"),
  category: z.string().trim().min(1, "Crime category is required").max(64),
  district: z.string().trim().min(1, "District is required").max(64),
  station: z.string().trim().max(96).optional(),
  severity: z.string().trim().max(32).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  status: z.string().trim().max(48).optional(),
});

/* ------------------------------------------------------------- parsing */

export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name.toLowerCase();
  const base = { fileName: file.name, bytes: file.size };

  if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) {
    const Papa = (await import("papaparse")).default;
    const text = await file.text();
    const res = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: "greedy",
      dynamicTyping: false,
      transformHeader: (h) => h.trim(),
    });
    return { ...base, format: "csv", headers: (res.meta.fields ?? []).filter(Boolean), rows: res.data };
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", raw: false });
    return { ...base, format: "xlsx", headers: Object.keys(rows[0] ?? {}), rows };
  }

  if (name.endsWith(".geojson")) {
    const gj = JSON.parse(await file.text());
    const feats: any[] = gj.features ?? [];
    const rows = feats.map((f) => ({
      ...f.properties,
      longitude: f.geometry?.coordinates?.[0],
      latitude: f.geometry?.coordinates?.[1],
    }));
    return { ...base, format: "geojson", headers: Object.keys(rows[0] ?? {}), rows };
  }

  if (name.endsWith(".json")) {
    const data = JSON.parse(await file.text());
    const rows: Record<string, unknown>[] = Array.isArray(data) ? data : (data.records ?? data.data ?? [data]);
    return { ...base, format: "json", headers: Object.keys(rows[0] ?? {}), rows };
  }

  throw new Error(`Unsupported file type: ${file.name}. Use CSV, XLSX, JSON or GeoJSON.`);
}

/* ---------------------------------------------------------- validation */

function num(v: unknown): number | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

export function validate(
  parsed: ParsedFile,
  mapping: Record<CanonicalField, string | null>,
): Pick<IngestResult, "valid" | "issues" | "duplicates"> {
  const issues: ValidationIssue[] = [];
  const duplicates: IngestResult["duplicates"] = [];
  const valid: CanonicalRecord[] = [];
  const seen = new Map<string, number>();

  parsed.rows.forEach((raw, i) => {
    const pick = (f: CanonicalField) => (mapping[f] ? raw[mapping[f] as string] : undefined);
    const candidate = {
      fir: str(pick("fir")),
      date: str(pick("date")),
      category: str(pick("category")),
      district: str(pick("district")),
      station: str(pick("station")) || undefined,
      severity: str(pick("severity")) || undefined,
      latitude: num(pick("latitude")),
      longitude: num(pick("longitude")),
      status: str(pick("status")) || undefined,
    };

    const res = recordSchema.safeParse(candidate);
    if (!res.success) {
      res.error.issues.forEach((e) =>
        issues.push({ row: i + 1, field: String(e.path[0] ?? "row"), message: e.message, severity: "error" }),
      );
      return;
    }

    if (candidate.latitude === undefined || candidate.longitude === undefined) {
      issues.push({ row: i + 1, field: "coordinates", message: "Missing coordinates — record will not appear on the map", severity: "warning" });
    }
    if (Number.isNaN(Date.parse(candidate.date))) {
      issues.push({ row: i + 1, field: "date", message: "Unrecognised date format", severity: "warning" });
    }

    const key = `${candidate.fir}|${candidate.date}|${candidate.district}`.toLowerCase();
    const prev = seen.get(key);
    if (prev !== undefined) {
      duplicates.push({ row: i + 1, matchesRow: prev, key: candidate.fir });
      return;
    }
    seen.set(key, i + 1);
    valid.push(res.data);
  });

  return { valid, issues, duplicates };
}

export async function runPipeline(file: File): Promise<IngestResult> {
  const parsed = await parseFile(file);
  const mapping = autoMap(parsed.headers);
  return { parsed, mapping, ...validate(parsed, mapping) };
}

/* --------------------------------------------------------- run history */

export interface PipelineRun {
  id: string;
  fileName: string;
  format: SourceFormat;
  at: string;
  total: number;
  accepted: number;
  rejected: number;
  duplicates: number;
}

const HISTORY_KEY = "ciap.pipeline.history";

export function loadHistory(): PipelineRun[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as PipelineRun[];
  } catch {
    return [];
  }
}

export function saveRun(run: PipelineRun): PipelineRun[] {
  const next = [run, ...loadHistory()].slice(0, 25);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}
