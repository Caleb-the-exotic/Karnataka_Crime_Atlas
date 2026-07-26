import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { crimeTrend, crimeCategories } from "@/lib/ciap-data";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const tt = { background: "oklch(0.18 0.03 250 / 0.95)", border: "1px solid oklch(0.72 0.18 235 / 0.5)", borderRadius: 12, fontSize: 11, color: "oklch(0.97 0.01 240)" } as const;

export const Route = createFileRoute("/crime-analytics")({
  beforeLoad: () => { throw redirect({ to: "/intelligence" }); },
});

export function CrimeAnalytics() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="ANALYTICS" title="Crime Analytics"
        description="Multi-dimensional analysis across categories, districts, time-of-day, weapon and demographic axes."
        actions={<Chip tone="primary">30 days</Chip>} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Category Volume">
          <div className="h-64"><ResponsiveContainer>
            <BarChart data={crimeCategories}>
              <CartesianGrid stroke="oklch(0.4 0.03 240 / 0.2)" vertical={false} />
              <XAxis dataKey="name" stroke="oklch(0.6 0.03 240)" fontSize={10} />
              <YAxis stroke="oklch(0.6 0.03 240)" fontSize={10} />
              <Tooltip contentStyle={tt} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {crimeCategories.map((_, i) => <Cell key={i} fill={`oklch(${0.6 + i * 0.04} 0.2 ${180 + i * 20})`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="MO Radar — Top 3 Districts">
          <div className="h-64"><ResponsiveContainer>
            <RadarChart data={[
              { axis: "Robbery", A: 80, B: 60, C: 40 },
              { axis: "Cyber", A: 90, B: 40, C: 70 },
              { axis: "Assault", A: 60, B: 80, C: 55 },
              { axis: "Narcotics", A: 50, B: 70, C: 65 },
              { axis: "Fraud", A: 75, B: 55, C: 60 },
              { axis: "Homicide", A: 30, B: 45, C: 25 },
            ]}>
              <PolarGrid stroke="oklch(0.4 0.03 240 / 0.3)" />
              <PolarAngleAxis dataKey="axis" stroke="oklch(0.7 0.03 240)" fontSize={10} />
              <PolarRadiusAxis stroke="oklch(0.5 0.03 240)" fontSize={9} />
              <Radar name="Bengaluru" dataKey="A" stroke="oklch(0.72 0.18 235)" fill="oklch(0.72 0.18 235)" fillOpacity={0.35} />
              <Radar name="Mysuru" dataKey="B" stroke="oklch(0.78 0.17 200)" fill="oklch(0.78 0.17 200)" fillOpacity={0.3} />
              <Radar name="Mangaluru" dataKey="C" stroke="oklch(0.65 0.24 25)" fill="oklch(0.65 0.24 25)" fillOpacity={0.25} />
              <Tooltip contentStyle={tt} />
            </RadarChart>
          </ResponsiveContainer></div>
        </Panel>
      </div>
    </div>
  );
}