import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { districts } from "@/lib/ciap-data";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, ReferenceLine, ComposedChart } from "recharts";

const tt = { background: "oklch(0.18 0.03 250 / 0.95)", border: "1px solid oklch(0.72 0.18 235 / 0.5)", borderRadius: 12, fontSize: 11, color: "oklch(0.97 0.01 240)" } as const;

const forecast = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  actual: i < 20 ? 100 + Math.round(Math.sin(i / 3) * 20 + ((i * 17) % 10)) : null,
  forecast: 100 + Math.round(Math.sin(i / 3) * 20 + i * 1.5),
  upper: 100 + Math.round(Math.sin(i / 3) * 20 + i * 1.5) + 20,
}));

export const Route = createFileRoute("/predictive")({
  beforeLoad: () => { throw redirect({ to: "/intelligence" }); },
});

export function Predictive() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="AI PREDICTION" title="Predictive Intelligence"
        description="7 / 14 / 30-day crime forecasts, high-risk districts and SHAP-based ML explanations."
        actions={<div className="flex gap-2"><Chip tone="primary">Model v4.2</Chip><Chip tone="success">Confidence 87%</Chip></div>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="30-Day Forecast · Statewide" className="lg:col-span-2">
          <div className="h-72"><ResponsiveContainer>
            <ComposedChart data={forecast}>
              <defs>
                <linearGradient id="conf" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="oklch(0.72 0.18 235)" stopOpacity={0.35} /><stop offset="100%" stopColor="oklch(0.72 0.18 235)" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.4 0.03 240 / 0.2)" />
              <XAxis dataKey="day" stroke="oklch(0.6 0.03 240)" fontSize={10} />
              <YAxis stroke="oklch(0.6 0.03 240)" fontSize={10} />
              <Tooltip contentStyle={tt} />
              <Area type="monotone" dataKey="upper" stroke="none" fill="url(#conf)" />
              <Line type="monotone" dataKey="actual" stroke="oklch(0.78 0.17 200)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="forecast" stroke="oklch(0.72 0.18 235)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              <ReferenceLine x="D20" stroke="oklch(0.65 0.24 25)" strokeDasharray="2 2" label={{ value: "NOW", fill: "oklch(0.65 0.24 25)", fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="High-Risk Districts · Next 7d">
          <ul className="space-y-2">
            {[...districts].sort((a, b) => b.risk - a.risk).slice(0, 8).map((d, i) => (
              <li key={d.name} className="flex items-center gap-3 text-sm">
                <span className="text-[10px] w-5 tabular-nums text-destructive">#{i + 1}</span>
                <span className="flex-1">{d.name}</span>
                <div className="w-16 h-1 rounded-full bg-input overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-destructive" style={{ width: `${d.risk}%` }} />
                </div>
                <span className="tabular-nums text-xs text-primary">{d.risk}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Feature Importance (SHAP)" className="lg:col-span-2">
          <div className="h-56"><ResponsiveContainer>
            <BarChart layout="vertical" data={[
              { f: "Prior incident density", v: 0.31 },
              { f: "Time of day", v: 0.22 },
              { f: "Weather", v: 0.14 },
              { f: "Repeat offender proximity", v: 0.12 },
              { f: "Population density", v: 0.09 },
              { f: "Event calendar", v: 0.07 },
              { f: "Economic index", v: 0.05 },
            ]}>
              <CartesianGrid stroke="oklch(0.4 0.03 240 / 0.2)" horizontal={false} />
              <XAxis type="number" stroke="oklch(0.6 0.03 240)" fontSize={10} />
              <YAxis type="category" dataKey="f" stroke="oklch(0.7 0.03 240)" fontSize={10} width={160} />
              <Tooltip contentStyle={tt} />
              <Bar dataKey="v" fill="oklch(0.72 0.18 235)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="ML Explanation">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Bengaluru Urban risk driven primarily by <span className="text-primary">prior incident density (+31%)</span> and <span className="text-primary">evening time-band</span>.
            The model attributes 22% weight to time-of-day and 14% to weather. Overall <span className="text-emerald-400">87%</span> confidence.
          </p>
          <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs">
            <div className="text-destructive font-semibold text-[10px] uppercase tracking-wider">High-priority alert</div>
            <div className="mt-1">Predicted robbery cluster · MG Road corridor · next 48–72h</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}