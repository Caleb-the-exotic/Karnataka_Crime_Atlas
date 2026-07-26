import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { Upload, Database, CheckCircle2, AlertCircle, FileWarning, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { runPipeline, autoMap, validate, canonicalFields, loadHistory, saveRun, type CanonicalField, type IngestResult, type PipelineRun } from "@/lib/ciap/ingest";
import { exportJSON } from "@/lib/ciap/export";

export const Route = createFileRoute("/data-import")({
  head: () => ({ meta: [{ title: "CIAP · Data Import" }, { name: "description", content: "Real ingestion pipeline for CSV / XLSX / JSON / GeoJSON crime datasets." }] }),
  component: DataImportPage,
});

function DataImportPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [drag, setDrag] = useState(false);
  const [history, setHistory] = useState<PipelineRun[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setHistory(loadHistory()), []);

  const handleFile = useCallback(async (file: File) => {
    setBusy(true);
    try {
      const res = await runPipeline(file);
      setResult(res);
      const run = saveRun({
        id: crypto.randomUUID(), fileName: file.name, format: res.parsed.format, at: new Date().toISOString(),
        total: res.parsed.rows.length, accepted: res.valid.length,
        rejected: res.parsed.rows.length - res.valid.length - res.duplicates.length,
        duplicates: res.duplicates.length,
      });
      setHistory(run);
      toast.success(`Ingested ${res.valid.length}/${res.parsed.rows.length} rows`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  }, [handleFile]);

  const remap = useCallback((field: CanonicalField, header: string | null) => {
    if (!result) return;
    const mapping = { ...result.mapping, [field]: header };
    setResult({ ...result, mapping, ...validate(result.parsed, mapping) });
  }, [result]);

  const summary = useMemo(() => {
    if (!result) return null;
    const errs = result.issues.filter((i) => i.severity === "error").length;
    const warns = result.issues.filter((i) => i.severity === "warning").length;
    return { errs, warns, dupes: result.duplicates.length, ok: result.valid.length, total: result.parsed.rows.length };
  }, [result]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DATA OPS"
        title="Data Import & Ingestion"
        description="Drop a CSV / XLSX / JSON / GeoJSON file. CIAP parses, auto-maps columns, validates against the crime schema and detects duplicates in-browser."
        actions={<Chip tone="success">Client-side · zero-copy</Chip>}
      />

      <Panel>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={"rounded-2xl border-2 border-dashed p-10 text-center transition " + (drag ? "border-primary bg-primary/5" : "border-border")}
        >
          {busy ? (
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
          ) : (
            <Upload className="h-10 w-10 mx-auto text-primary" />
          )}
          <div className="mt-3 font-semibold">Drop CSV / XLSX / JSON / GeoJSON</div>
          <div className="text-xs text-muted-foreground">Max 50MB · parsed entirely in the browser</div>
          <input
            ref={inputRef} type="file" hidden
            accept=".csv,.tsv,.xlsx,.xls,.json,.geojson"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
          />
          <button onClick={() => inputRef.current?.click()} disabled={busy}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60">
            Browse files
          </button>
        </div>
      </Panel>

      {result && summary && (
        <>
          <Panel title="Ingestion Summary" icon={<Database className="h-4 w-4" />}
            actions={<button onClick={() => { setResult(null); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><X className="h-3 w-3" /> Clear</button>}
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <Stat label="File" value={result.parsed.fileName} />
              <Stat label="Format" value={result.parsed.format.toUpperCase()} />
              <Stat label="Rows read" value={summary.total.toLocaleString()} />
              <Stat label="Accepted" value={summary.ok.toLocaleString()} tone="ok" />
              <Stat label="Rejected" value={(summary.total - summary.ok).toLocaleString()} tone="err" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Chip tone="success">{summary.ok} valid</Chip>
              {summary.errs > 0 && <Chip tone="danger">{summary.errs} errors</Chip>}
              {summary.warns > 0 && <Chip>{summary.warns} warnings</Chip>}
              {summary.dupes > 0 && <Chip>{summary.dupes} duplicates</Chip>}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => exportJSON(result.valid, `${result.parsed.fileName.replace(/\.[^.]+$/, "")}-normalised`)}
                className="rounded-lg border border-primary/40 bg-primary/10 text-primary px-3 py-1.5 text-xs">
                Download normalised JSON
              </button>
            </div>
          </Panel>

          <Panel title="Column Mapping">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {canonicalFields.map((f) => (
                <label key={f} className="rounded-lg border border-border bg-input/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{f}</div>
                  <select
                    value={result.mapping[f] ?? ""}
                    onChange={(e) => remap(f, e.target.value || null)}
                    className="mt-1 w-full bg-transparent text-sm outline-none border-b border-border/60 py-1"
                  >
                    <option value="">— unmapped —</option>
                    {result.parsed.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </Panel>

          {result.issues.length > 0 && (
            <Panel title="Validation Issues" icon={<FileWarning className="h-4 w-4 text-yellow-400" />}>
              <div className="max-h-72 overflow-y-auto text-xs">
                <table className="w-full">
                  <thead className="sticky top-0 bg-background/95 text-muted-foreground">
                    <tr>{["Row", "Field", "Severity", "Message"].map((h) => <th key={h} className="text-left px-3 py-2">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.issues.slice(0, 200).map((iss, i) => (
                      <tr key={i} className="border-t border-border/60">
                        <td className="px-3 py-1.5 tabular-nums">{iss.row}</td>
                        <td className="px-3 py-1.5">{iss.field}</td>
                        <td className={"px-3 py-1.5 " + (iss.severity === "error" ? "text-destructive" : "text-yellow-400")}>{iss.severity}</td>
                        <td className="px-3 py-1.5">{iss.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.issues.length > 200 && <div className="p-3 text-muted-foreground">…{result.issues.length - 200} more issues</div>}
              </div>
            </Panel>
          )}

          <Panel title={`Preview · first 20 valid records`}>
            <div className="overflow-x-auto text-xs">
              <table className="w-full">
                <thead className="text-muted-foreground">
                  <tr>{canonicalFields.map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {result.valid.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-t border-border/60">
                      {canonicalFields.map((f) => <td key={f} className="px-3 py-1.5">{String((r as any)[f] ?? "")}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      <Panel title="Ingestion History">
        {history.length === 0 ? (
          <div className="text-xs text-muted-foreground">No prior imports.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
                {r.rejected === 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-yellow-400" />}
                <span className="flex-1">{r.fileName}</span>
                <span className="text-xs text-muted-foreground">{new Date(r.at).toLocaleString()}</span>
                <span className="text-xs text-primary tabular-nums">{r.accepted}/{r.total}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "err" }) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={"text-sm font-semibold " + (tone === "ok" ? "text-emerald-400" : tone === "err" ? "text-destructive" : "text-foreground")}>{value}</div>
    </div>
  );
}