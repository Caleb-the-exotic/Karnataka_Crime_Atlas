/**
 * Real export engine — PDF, Excel, CSV, PowerPoint and PNG snapshots.
 * All work happens in the browser; nothing here is a stub.
 */
import { toast } from "sonner";

export interface ReportTable {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface ReportPayload {
  title: string;
  subtitle?: string;
  /** Executive summary paragraphs. */
  summary: string[];
  /** Applied dashboard filters, rendered into every export. */
  filters?: Record<string, string>;
  /** AI-generated findings. */
  findings?: string[];
  tables: ReportTable[];
  /** Optional base64 PNGs of charts/maps captured from the DOM. */
  images?: { title: string; dataUrl: string }[];
}

const BRAND = {
  org: "Karnataka State Police · State Crime Records Bureau",
  product: "CIAP — Crime Intelligence & Analytical Platform",
  classification: "RESTRICTED — FOR OFFICIAL USE ONLY",
};

export function timestamp() {
  return new Date().toLocaleString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" });
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/* ------------------------------------------------------------------ PDF */

export async function exportPDF(payload: ReportPayload) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 56;

  // Branded header band
  doc.setFillColor(12, 22, 40);
  doc.rect(0, 0, W, 84, "F");
  doc.setTextColor(90, 170, 255);
  doc.setFontSize(9);
  doc.text(BRAND.org.toUpperCase(), 40, 30);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.text(payload.title, 40, 54);
  doc.setFontSize(9);
  doc.setTextColor(170, 190, 215);
  doc.text(payload.subtitle ?? BRAND.product, 40, 70);
  y = 108;

  doc.setTextColor(150, 40, 40);
  doc.setFontSize(8);
  doc.text(BRAND.classification, 40, y);
  doc.setTextColor(90, 90, 90);
  doc.text(`Generated: ${timestamp()} IST`, W - 40, y, { align: "right" });
  y += 22;

  if (payload.filters && Object.keys(payload.filters).length) {
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("Applied Filters", 40, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [30, 48, 80] },
      head: [["Filter", "Value"]],
      body: Object.entries(payload.filters),
      margin: { left: 40, right: 40 },
    });
    y = (doc as any).lastAutoTable.finalY + 20;
  }

  if (payload.summary.length) {
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("Executive Summary", 40, y);
    y += 14;
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    payload.summary.forEach((p) => {
      const lines = doc.splitTextToSize(p, W - 80);
      if (y + lines.length * 12 > 780) { doc.addPage(); y = 56; }
      doc.text(lines, 40, y);
      y += lines.length * 12 + 6;
    });
    y += 8;
  }

  if (payload.findings?.length) {
    if (y > 700) { doc.addPage(); y = 56; }
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("AI Findings", 40, y);
    y += 14;
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    payload.findings.forEach((f, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${f}`, W - 90);
      if (y + lines.length * 12 > 780) { doc.addPage(); y = 56; }
      doc.text(lines, 46, y);
      y += lines.length * 12 + 4;
    });
    y += 12;
  }

  for (const img of payload.images ?? []) {
    if (y > 520) { doc.addPage(); y = 56; }
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(img.title, 40, y);
    y += 10;
    try {
      const props = doc.getImageProperties(img.dataUrl);
      const w = W - 80;
      const h = (props.height / props.width) * w;
      doc.addImage(img.dataUrl, "PNG", 40, y, w, Math.min(h, 320));
      y += Math.min(h, 320) + 22;
    } catch {
      /* skip unreadable capture */
    }
  }

  for (const table of payload.tables) {
    if (y > 700) { doc.addPage(); y = 56; }
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(table.title, 40, y);
    autoTable(doc, {
      startY: y + 8,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [30, 48, 80] },
      head: [table.columns],
      body: table.rows.map((r) => r.map(String)),
      margin: { left: 40, right: 40 },
    });
    y = (doc as any).lastAutoTable.finalY + 24;
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.text(`${BRAND.classification}  ·  ${BRAND.product}`, 40, 820);
    doc.text(`Page ${p} of ${pages}`, W - 40, 820, { align: "right" });
  }

  doc.save(`${slug(payload.title)}-${Date.now()}.pdf`);
  toast.success("PDF report generated");
}

/* ------------------------------------------------------- Excel and CSV */

export async function exportExcel(payload: ReportPayload) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const meta = [
    ["Report", payload.title],
    ["Organisation", BRAND.org],
    ["Classification", BRAND.classification],
    ["Generated", `${timestamp()} IST`],
    [],
    ...Object.entries(payload.filters ?? {}),
    [],
    ["Executive Summary"],
    ...payload.summary.map((s) => [s]),
    [],
    ["AI Findings"],
    ...(payload.findings ?? []).map((s) => [s]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(meta), "Summary");

  payload.tables.forEach((t, i) => {
    const ws = XLSX.utils.aoa_to_sheet([t.columns, ...t.rows]);
    ws["!cols"] = t.columns.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, (t.title || `Sheet${i + 1}`).slice(0, 28));
  });

  XLSX.writeFile(wb, `${slug(payload.title)}-${Date.now()}.xlsx`);
  toast.success("Excel workbook generated");
}

export function exportCSV(table: ReportTable, name = table.title) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [table.columns.map(esc).join(","), ...table.rows.map((r) => r.map(esc).join(","))].join("\n");
  downloadBlob(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }), `${slug(name)}-${Date.now()}.csv`);
  toast.success("CSV exported");
}

/* ------------------------------------------------------------- PowerPoint */

export async function exportPPTX(payload: ReportPayload) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = BRAND.org;
  pptx.title = payload.title;

  const BG = "0B1524";
  const ACCENT = "4FA8FF";

  const title = pptx.addSlide();
  title.background = { color: BG };
  title.addText(BRAND.org.toUpperCase(), { x: 0.6, y: 1.6, fontSize: 12, color: ACCENT, charSpacing: 3 });
  title.addText(payload.title, { x: 0.6, y: 2.0, fontSize: 34, bold: true, color: "FFFFFF" });
  title.addText(payload.subtitle ?? BRAND.product, { x: 0.6, y: 3.0, fontSize: 14, color: "9FB3CC" });
  title.addText(`${BRAND.classification} · Generated ${timestamp()} IST`, {
    x: 0.6, y: 4.9, fontSize: 9, color: "C05050",
  });

  if (payload.summary.length) {
    const s = pptx.addSlide();
    s.background = { color: BG };
    s.addText("Executive Summary", { x: 0.5, y: 0.4, fontSize: 22, bold: true, color: ACCENT });
    s.addText(payload.summary.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })), {
      x: 0.6, y: 1.2, w: 8.8, h: 3.8, fontSize: 13, color: "E6EEF8",
    });
  }

  if (payload.findings?.length) {
    const s = pptx.addSlide();
    s.background = { color: BG };
    s.addText("AI Findings", { x: 0.5, y: 0.4, fontSize: 22, bold: true, color: ACCENT });
    s.addText(payload.findings.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })), {
      x: 0.6, y: 1.2, w: 8.8, h: 3.8, fontSize: 13, color: "E6EEF8",
    });
  }

  for (const img of payload.images ?? []) {
    const s = pptx.addSlide();
    s.background = { color: BG };
    s.addText(img.title, { x: 0.5, y: 0.3, fontSize: 18, bold: true, color: ACCENT });
    s.addImage({ data: img.dataUrl, x: 0.5, y: 1.0, w: 9.0, h: 4.2, sizing: { type: "contain", w: 9.0, h: 4.2 } });
  }

  for (const t of payload.tables) {
    const s = pptx.addSlide();
    s.background = { color: BG };
    s.addText(t.title, { x: 0.5, y: 0.3, fontSize: 18, bold: true, color: ACCENT });
    s.addTable(
      [
        t.columns.map((c) => ({ text: c, options: { bold: true, color: "FFFFFF", fill: { color: "1B3050" } } })),
        ...t.rows.slice(0, 14).map((r) => r.map((c) => ({ text: String(c), options: { color: "D8E4F2" } }))),
      ],
      { x: 0.5, y: 1.0, w: 9.0, fontSize: 10, border: { pt: 0.5, color: "2A3F5F" } },
    );
  }

  await pptx.writeFile({ fileName: `${slug(payload.title)}-${Date.now()}.pptx` });
  toast.success("PowerPoint deck generated");
}

/* ---------------------------------------------------------- PNG snapshot */

export async function captureElement(el: HTMLElement): Promise<string> {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(el, {
    backgroundColor: getComputedStyle(document.body).backgroundColor || "#0b1524",
    scale: Math.min(2, window.devicePixelRatio || 1),
    useCORS: true,
    logging: false,
  });
  return canvas.toDataURL("image/png");
}

export async function exportDashboardPNG(el: HTMLElement, name = "ciap-dashboard") {
  const dataUrl = await captureElement(el);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${slug(name)}-${Date.now()}.png`;
  a.click();
  toast.success("Dashboard snapshot saved");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJSON(data: unknown, name: string) {
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `${slug(name)}.json`);
  toast.success("JSON exported");
}
