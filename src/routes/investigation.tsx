import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FolderSearch, UserSearch, Users, Share2, LayoutGrid, Paperclip, Clock } from "lucide-react";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { HubTabs, TabPanel, Breadcrumbs } from "@/components/ciap/hub-tabs";
import { Cases } from "./cases";
import { Suspects } from "./suspects";
import { Victims } from "./victims";
import { NetworkPage } from "./network";
import { cases } from "@/lib/ciap-data";

export const Route = createFileRoute("/investigation")({
  head: () => ({
    meta: [
      { title: "CIAP · Investigation Hub" },
      { name: "description", content: "Unified investigation workspace — cases, suspects, victims, network, evidence and timeline." },
      { property: "og:title", content: "CIAP · Investigation Hub" },
      { property: "og:description", content: "Cases, suspects, victims and criminal-network graph in one workspace." },
    ],
  }),
  component: InvestigationHub,
});

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "cases", label: "Cases", icon: FolderSearch },
  { id: "suspects", label: "Suspects", icon: UserSearch },
  { id: "victims", label: "Victims", icon: Users },
  { id: "network", label: "Network", icon: Share2 },
  { id: "evidence", label: "Evidence", icon: Paperclip },
  { id: "timeline", label: "Timeline", icon: Clock },
];

function InvestigationHub() {
  const [tab, setTab] = useState("overview");
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Home" }, { label: "Investigation Hub" }]} />
      <HubTabs tabs={TABS} value={tab} onChange={setTab} />

      <TabPanel active={tab === "overview"}>
        <div className="space-y-6">
          <PageHeader
            eyebrow="INVESTIGATION"
            title="Investigation Hub"
            description="Unified investigative workspace consolidating Cases, Suspects, Victims and Network analysis."
            actions={<Chip tone="primary">{cases.length} active cases</Chip>}
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              ["Active Cases", cases.length.toString(), "cases"],
              ["Suspects on file", "2,410", "suspects"],
              ["Victims tracked", "18,420", "victims"],
              ["Network entities", "11", "network"],
            ].map(([l, v, target]) => (
              <button
                key={l}
                onClick={() => setTab(target as string)}
                className="text-left rounded-2xl border border-border/60 bg-card/50 p-4 hover:border-primary/50 transition"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
                <div className="mt-1 text-2xl font-semibold text-glow tabular-nums">{v}</div>
              </button>
            ))}
          </div>
          <Panel title="Recent Cases">
            <ul className="divide-y divide-border/60">
              {cases.slice(0, 6).map((c) => (
                <li key={c.fir} className="flex items-center gap-3 py-2 text-sm">
                  <span className="font-mono text-xs text-muted-foreground w-40">{c.fir}</span>
                  <span className="flex-1">{c.type}</span>
                  <span className="text-xs text-muted-foreground">{c.station}</span>
                  <Chip tone={c.severity === "Critical" ? "danger" : c.severity === "High" ? "warn" : "default"}>{c.severity}</Chip>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </TabPanel>
      <TabPanel active={tab === "cases"}><Cases /></TabPanel>
      <TabPanel active={tab === "suspects"}><Suspects /></TabPanel>
      <TabPanel active={tab === "victims"}><Victims /></TabPanel>
      <TabPanel active={tab === "network"}><NetworkPage /></TabPanel>
      <TabPanel active={tab === "evidence"}>
        <Panel title="Evidence Locker">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground">
              <tr>{["Evidence ID", "Case", "Type", "Chain of Custody", "Status"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {cases.slice(0, 8).map((c, i) => (
                <tr key={c.fir} className="border-t border-border/60">
                  <td className="px-3 py-2 font-mono">EV-{(9000 + i).toString()}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{c.fir}</td>
                  <td className="px-3 py-2">{["CCTV", "Phone", "Weapon", "Document"][i % 4]}</td>
                  <td className="px-3 py-2 text-muted-foreground">Sealed · {c.station}</td>
                  <td className="px-3 py-2"><Chip tone="success">Integrity OK</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </TabPanel>
      <TabPanel active={tab === "timeline"}>
        <Panel title="Investigation Timeline">
          <ol className="relative border-l border-border/60 ml-3 space-y-4">
            {cases.slice(0, 10).map((c) => (
              <li key={c.fir} className="ml-4">
                <span className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary" />
                <div className="text-xs text-muted-foreground">{c.date}</div>
                <div className="text-sm font-medium">{c.type} · <span className="font-mono text-xs">{c.fir}</span></div>
                <div className="text-xs text-muted-foreground">{c.station} · {c.district}</div>
              </li>
            ))}
          </ol>
        </Panel>
      </TabPanel>
    </div>
  );
}