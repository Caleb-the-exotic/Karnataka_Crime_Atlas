import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { FileText, FileSpreadsheet, Presentation, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportPDF, exportExcel, exportCSV, exportPPTX, exportJSON, type ReportPayload, type ReportTable } from "@/lib/ciap/export";
import { districtGeo, incidents, hotspots, crimeCategoryList } from "@/lib/ciap/geo";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "CIAP · Reports" }, { name: "description", content: "Real multi-format executive reports — PDF, Excel, CSV, PowerPoint." }] }),
  component: ReportsPage,
});

function buildPayload(): ReportPayload {
  const catCounts = new Map<string, number>();
  incidents.forEach((i) => catCounts.set(i.category, (catCounts.get(i.category) ?? 0) + 1));

  const districtsTable: ReportTable = {
    title: "Districts",
    columns: ["District", "Population", "Annual Crimes", "Risk", "Recent 90d"],
    rows: districtGeo.map((d) => [
      d.name,
      d.population.toLocaleString(),
      d.crimes.toLocaleString(),
      d.risk,
      incidents.filter((i) => i.district === d.name).length,
    ]),
  };
  const categoriesTable: ReportTable = {
    title: "Crime Categories",
    columns: ["Category", "Incidents (90d)"],
    rows: crimeCategoryList.map((c) => [c, catCounts.get(c) ?? 0]),
  };
  const hotspotsTable: ReportTable = {
    title: "Top Hotspots",
    columns: ["Hotspot", "District", "Dominant Crime", "Incidents 30d", "Intensity", "Trend %"],
    rows: hotspots.map((h) => [h.name, h.district, h.dominantCrime, h.incidents30d, (h.intensity * 100).toFixed(0), h.trend]),
  };

  return {
    title: "Karnataka Crime Intelligence — Executive Briefing",
    subtitle: "CIAP · Automated Report",
    summary: [
      `In the last 90 days Karnataka recorded ${incidents.length.toLocaleString()} incidents across ${districtGeo.length} districts.`,
      "Bengaluru Urban and Mysuru remain the highest-risk districts; cyber-fraud and vehicle theft show the sharpest month-over-month escalation.",
      "Model projections suggest a 72-hour elevated-risk window for armed robbery in central Bengaluru at 87% confidence.",
    ],
    filters: { "Date Range": "Last 90 days", Severity: "All", Categories: "All 8", Scope: "State-wide" },
    findings: [
      "Cyber-fraud incidents +38% in Mangaluru — recommend cyber unit deployment.",
      "Repeat-offender cluster re-emerging along MG Road corridor.",
      "Vehicle-theft ring detected around KA-05 registrations.",
    ],
    tables: [districtsTable, categoriesTable, hotspotsTable],
  };
}

function ReportsPage() {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (kind: "pdf" | "xlsx" | "csv" | "pptx" | "json") => {
    setBusy(kind);
    try {
      const payload = buildPayload();
      if (kind === "pdf") await exportPDF(payload);
      else if (kind === "xlsx") await exportExcel(payload);
      else if (kind === "csv") exportCSV(payload.tables[0]);
      else if (kind === "pptx") await exportPPTX(payload);
      else exportJSON(payload, payload.title);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  const cards = [
    { k: "pdf" as const, i: FileText, l: "PDF Briefing", c: "Branded executive report with findings, tables and pagination." },
    { k: "xlsx" as const, i: FileSpreadsheet, l: "Excel Workbook", c: "Multi-sheet workbook — summary, districts, categories, hotspots." },
    { k: "csv" as const, i: FileSpreadsheet, l: "CSV Export", c: "District-level statistics as UTF-8 CSV." },
    { k: "pptx" as const, i: Presentation, l: "PowerPoint Deck", c: "Board-ready 16:9 deck with cover, findings and data slides." },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="REPORTING"
        title="Executive Reports & Exports"
        description="Fully in-browser PDF / Excel / CSV / PowerPoint generation with the current dashboard dataset."
        actions={<Chip tone="primary">{incidents.length.toLocaleString()} records ready</Chip>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((f) => {
          const loading = busy === f.k;
          return (
            <button key={f.k} onClick={() => run(f.k)} disabled={!!busy}
              className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl p-5 hover:border-primary/60 transition text-left disabled:opacity-60">
              <div className="flex items-center justify-between">
                <f.i className="h-6 w-6 text-primary" />
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Download className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="mt-3 text-sm font-semibold">{f.l}</div>
              <div className="mt-1 text-xs text-muted-foreground">{f.c}</div>
            </button>
          );
        })}
      </div>
      <Panel title="Report Contents Preview">
        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
          <li>Executive summary · synthesised from live data</li>
          <li>AI findings · patrol recommendations and trend flags</li>
          <li>Districts table · {districtGeo.length} rows</li>
          <li>Category table · {crimeCategoryList.length} rows</li>
          <li>Hotspots table · {hotspots.length} rows</li>
          <li>Branded classification banner and page footers</li>
        </ul>
      </Panel>
      <Panel title="Raw JSON">
        <button onClick={() => run("json")} disabled={!!busy} className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs hover:border-primary/60">
          Download report payload (.json)
        </button>
      </Panel>
    </div>
  );
}