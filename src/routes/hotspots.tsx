import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { KarnatakaMap } from "@/components/ciap/karnataka-map";
import { hourly } from "@/lib/ciap-data";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tt = { background: "oklch(0.18 0.03 250 / 0.95)", border: "1px solid oklch(0.72 0.18 235 / 0.5)", borderRadius: 12, fontSize: 11, color: "oklch(0.97 0.01 240)" } as const;

export const Route = createFileRoute("/hotspots")({
  beforeLoad: () => { throw redirect({ to: "/crime-map" }); },
});

export function Hotspots() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="HOTSPOT DETECTION" title="Kernel Density Analysis"
        description="Animated hotspot pulses, hourly and weekly patterns, and predictive overlays for the next 7 days."
        actions={<div className="flex gap-2"><Chip tone="danger">3 CRITICAL</Chip><Chip tone="primary">Prediction ON</Chip></div>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><KarnatakaMap height={560} /></div>
        <div className="space-y-4">
          <Panel title="Top Hotspots">
            <ul className="space-y-2 text-sm">
              {["MG Road, Bengaluru", "Panambur, Mangaluru", "Whitefield, Bengaluru", "MB Nagar, Kalaburagi", "Vijaynagar, Mysuru"].map((h, i) => (
                <li key={h} className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-2">
                  <div className="relative h-2 w-2 rounded-full bg-destructive"><span className="absolute inset-0 rounded-full bg-destructive/50 animate-pulse-ring" /></div>
                  <span className="flex-1">{h}</span>
                  <span className="text-xs text-destructive tabular-nums">{95 - i * 4}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Weekly Pattern">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 * 12 }).map((_, i) => {
                const v = ((i * 37) % 100) / 100;
                return <div key={i} className="aspect-square rounded-sm" style={{ background: `oklch(${0.25 + v * 0.5} ${0.05 + v * 0.2} ${240 - v * 40})` }} />;
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
          </Panel>
        </div>
      </div>
      <Panel title="Hourly Crime Distribution">
        <div className="h-48"><ResponsiveContainer>
          <BarChart data={hourly}>
            <CartesianGrid stroke="oklch(0.4 0.03 240 / 0.2)" vertical={false} />
            <XAxis dataKey="hour" stroke="oklch(0.6 0.03 240)" fontSize={10} interval={1} />
            <YAxis stroke="oklch(0.6 0.03 240)" fontSize={10} />
            <Tooltip contentStyle={tt} />
            <Bar dataKey="incidents" radius={[4, 4, 0, 0]}>{hourly.map((h, i) => <Cell key={i} fill={h.incidents > 40 ? "oklch(0.65 0.24 25)" : "oklch(0.72 0.18 235)"} />)}</Bar>
          </BarChart>
        </ResponsiveContainer></div>
      </Panel>
    </div>
  );
}