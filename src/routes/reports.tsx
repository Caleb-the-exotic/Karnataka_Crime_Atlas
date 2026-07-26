import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { FileText, FileSpreadsheet, Presentation, Download, Loader2, Send, X, AlertTriangle } from "lucide-react";
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
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    district: districtGeo[0]?.name || "Bengaluru Urban",
    category: crimeCategoryList[0] || "Theft",
    details: "",
  });

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.details) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("https://formspree.io/f/mqegqzdw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Complaint submitted successfully! An email has been sent.");
        setComplaintOpen(false);
        setFormData({ name: "", email: "", phone: "", district: districtGeo[0]?.name || "Bengaluru Urban", category: crimeCategoryList[0] || "Theft", details: "" });
      } else {
        toast.error("Failed to submit complaint. Please try again.");
      }
    } catch {
      toast.error("Network error submitting complaint.");
    } finally {
      setSubmitting(false);
    }
  };

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
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setComplaintOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-xs font-semibold hover:bg-destructive/90 transition shadow-md"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Submit Complaint</span>
            </button>
            <Chip tone="primary">{incidents.length.toLocaleString()} records ready</Chip>
          </div>
        }
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

      {/* Complaint Modal with Formspree */}
      {complaintOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm" onClick={() => setComplaintOpen(false)}>
          <div className="w-[500px] max-w-[92vw] rounded-2xl border border-destructive/40 bg-popover/95 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Submit Official Complaint / Incident Report</span>
              </div>
              <button onClick={() => setComplaintOpen(false)} aria-label="Close" className="rounded-md p-1 hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleComplaintSubmit} className="p-6 space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground mb-1 block">Full Name</label>
                <input
                  type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Officer R. Sharma" required
                  className="w-full rounded-lg border border-border bg-input/60 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground mb-1 block">Email Address (Required)</label>
                  <input
                    type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@ksp.gov.in" required
                    className="w-full rounded-lg border border-border bg-input/60 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block">Phone Number</label>
                  <input
                    type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg border border-border bg-input/60 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground mb-1 block">District</label>
                  <select
                    value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full rounded-lg border border-border bg-input/60 px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {districtGeo.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block">Crime Category</label>
                  <select
                    value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-border bg-input/60 px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {crimeCategoryList.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block">Complaint Details (Required)</label>
                <textarea
                  rows={4} value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Describe the complaint or incident in detail..." required
                  className="w-full rounded-lg border border-border bg-input/60 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-destructive text-destructive-foreground px-4 py-2.5 text-sm font-semibold hover:bg-destructive/90 transition disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Submit Complaint (Formspree Mail)</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}