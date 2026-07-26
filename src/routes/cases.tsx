import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader, Panel, Chip, Filters } from "@/components/ciap/primitives";
import { cases } from "@/lib/ciap-data";
import { Search, Paperclip, Clock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/cases")({
  beforeLoad: () => { throw redirect({ to: "/investigation" }); },
});

export function Cases() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="CASE EXPLORER" title="AI-Powered Case Search"
        description="Semantic search across FIRs, names, phones, vehicles, locations and dates."
        actions={<Chip tone="primary">84,520 cases indexed</Chip>} />
      <Panel>
        <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-input/60 px-4 py-3">
          <Search className="h-5 w-5 text-primary" />
          <input placeholder='Try: "Robbery cases in Whitefield last month" or "FIR/2026/07/1042"' className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground flex items-center gap-1"><Sparkles className="h-3 w-3" />AI Search</button>
        </div>
        <div className="mt-3"><Filters items={["FIR number", "Name", "Phone", "Vehicle", "Location", "Crime Type", "Date"]} /></div>
      </Panel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cases.map((c) => (
          <div key={c.fir} className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl p-4 hover:border-primary/60 transition">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-xs text-muted-foreground">{c.fir}</div>
                <div className="mt-1 text-base font-semibold">{c.type}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.station} · {c.district}</div>
              </div>
              <Chip tone={c.severity === "Critical" ? "danger" : c.severity === "High" ? "warn" : "default"}>{c.severity}</Chip>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.date}</span>
              <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />4 evidence</span>
              <span className="ml-auto"><Chip tone={c.status === "Solved" ? "success" : c.status === "Active" ? "primary" : "default"}>{c.status}</Chip></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}