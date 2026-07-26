import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { AlertTriangle, Sparkles } from "lucide-react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

const tt = { background: "oklch(0.18 0.03 250 / 0.95)", border: "1px solid oklch(0.72 0.18 235 / 0.5)", borderRadius: 12, fontSize: 11, color: "oklch(0.97 0.01 240)" } as const;

const normal = Array.from({ length: 120 }, (_, i) => ({ x: ((i * 17) % 100), y: ((i * 41) % 100), z: 40 + (i % 40) }));
const outliers = Array.from({ length: 8 }, (_, i) => ({ x: 5 + i * 2, y: 82 + i, z: 120 }));

export const Route = createFileRoute("/anomaly")({
  beforeLoad: () => { throw redirect({ to: "/intelligence" }); },
});

export function Anomaly() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="ANOMALY DETECTION" title="Outlier & Rare-Pattern Radar"
        description="Unsupervised models surface unusual clusters, rare MOs and unexpected geographies."
        actions={<Chip tone="danger">14 anomalies today</Chip>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Incident Space" className="lg:col-span-2">
          <div className="h-96"><ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid stroke="oklch(0.4 0.03 240 / 0.2)" />
              <XAxis type="number" dataKey="x" stroke="oklch(0.6 0.03 240)" fontSize={10} />
              <YAxis type="number" dataKey="y" stroke="oklch(0.6 0.03 240)" fontSize={10} />
              <ZAxis type="number" dataKey="z" range={[20, 200]} />
              <Tooltip contentStyle={tt} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={normal} fill="oklch(0.72 0.18 235 / 0.6)" />
              <Scatter data={outliers} fill="oklch(0.65 0.24 25)" />
            </ScatterChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Flagged Anomalies">
          <ul className="space-y-2">
            {[
              { t: "Rare MO · knife+drone", d: "Bengaluru · 2h ago", c: 92 },
              { t: "Unexpected location cluster", d: "Udupi coastline", c: 88 },
              { t: "Behaviour shift · SUS-00318", d: "Mysuru", c: 84 },
              { t: "Unusual crowd density", d: "Majestic", c: 76 },
              { t: "Vehicle path deviation", d: "KA-05 MZ 4471", c: 71 },
            ].map((a, i) => (
              <li key={i} className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-destructive font-medium"><AlertTriangle className="h-3 w-3" />{a.t}</span>
                  <span className="text-[10px] tabular-nums">{a.c}%</span>
                </div>
                <div className="text-muted-foreground mt-0.5">{a.d}</div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-primary"><Sparkles className="h-2.5 w-2.5" />AI reasoning available</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}