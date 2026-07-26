import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { crimeTrend } from "@/lib/ciap-data";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tt = { background: "oklch(0.18 0.03 250 / 0.95)", border: "1px solid oklch(0.72 0.18 235 / 0.5)", borderRadius: 12, fontSize: 11, color: "oklch(0.97 0.01 240)" } as const;

export const Route = createFileRoute("/trends")({
  beforeLoad: () => { throw redirect({ to: "/intelligence" }); },
});

export function Trends() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="TREND ANALYSIS" title="Time-series & Seasonality"
        description="Stacked area charts, moving averages and forecast overlays."
        actions={<Chip tone="primary">MA(7)</Chip>} />
      <Panel title="Stacked Category Trend · 30 Days">
        <div className="h-96"><ResponsiveContainer>
          <AreaChart data={crimeTrend}>
            <CartesianGrid stroke="oklch(0.4 0.03 240 / 0.2)" />
            <XAxis dataKey="day" stroke="oklch(0.6 0.03 240)" fontSize={10} />
            <YAxis stroke="oklch(0.6 0.03 240)" fontSize={10} />
            <Tooltip contentStyle={tt} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="theft" stackId="1" stroke="oklch(0.72 0.18 235)" fill="oklch(0.72 0.18 235 / 0.6)" />
            <Area type="monotone" dataKey="assault" stackId="1" stroke="oklch(0.78 0.17 200)" fill="oklch(0.78 0.17 200 / 0.6)" />
            <Area type="monotone" dataKey="cyber" stackId="1" stroke="oklch(0.68 0.2 155)" fill="oklch(0.68 0.2 155 / 0.6)" />
            <Area type="monotone" dataKey="narcotics" stackId="1" stroke="oklch(0.65 0.24 25)" fill="oklch(0.65 0.24 25 / 0.6)" />
          </AreaChart>
        </ResponsiveContainer></div>
      </Panel>
    </div>
  );
}