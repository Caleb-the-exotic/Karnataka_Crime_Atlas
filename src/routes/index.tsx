import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Chip, Sparkline, Filters } from "@/components/ciap/primitives";
import { KarnatakaMap } from "@/components/ciap/karnataka-map";
import { kpis, crimeTrend, crimeCategories, hourly, districts } from "@/lib/ciap-data";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  TrendingUp, TrendingDown, ShieldAlert, Activity, Radar, Users, Flame, FileCheck2,
  UserX, Fingerprint,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CIAP · Command Dashboard — Karnataka State Police" },
      { name: "description", content: "Live command-center dashboard for the Karnataka State Police and State Crime Records Bureau." },
      { property: "og:title", content: "CIAP Command Dashboard" },
      { property: "og:description", content: "Live crime intelligence for KSP & SCRB." },
    ],
  }),
  component: Dashboard,
});

const iconFor: Record<string, any> = {
  total: Activity, today: Radar, active: ShieldAlert, repeat: Fingerprint,
  hot: Flame, ai: TrendingUp, wanted: UserX, solved: FileCheck2,
};

function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="COMMAND CENTER · CLASSIFIED"
        title="Karnataka State-wide Crime Intelligence"
        description="Unified live view across 15 districts, 1,247 police stations and 84.5K incidents. AI models updated 4 min ago."
        actions={
          <div className="flex items-center gap-2">
            <Chip tone="success">● LIVE</Chip>
            <Chip tone="primary">MODEL v4.2</Chip>
            <Chip>SHIFT · DAY</Chip>
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = iconFor[k.key] ?? Activity;
          const up = k.delta >= 0;
          return (
            <div key={k.key} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl p-4 hover:border-primary/50 transition">
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-primary/5 to-accent/5" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{k.label}</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums text-glow">{k.value.toLocaleString()}</div>
                </div>
                <div className="h-9 w-9 rounded-xl border border-primary/30 bg-primary/10 grid place-items-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="relative mt-3">
                <Sparkline data={k.spark} tone={up ? "primary" : "danger"} />
              </div>
              <div className="relative mt-2 flex items-center justify-between text-[11px]">
                <span className={up ? "text-emerald-400 flex items-center gap-1" : "text-destructive flex items-center gap-1"}>
                  {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {up ? "+" : ""}{k.delta}%
                </span>
                <span className="text-muted-foreground">vs last 7d</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map + side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Karnataka · Live Crime Map" subtitle="Zoomable · Heatmap · District boundaries · 1,247 stations" className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px]">
            <Filters items={["All crimes", "Robbery", "Cyber", "Narcotics", "Assault", "Homicide"]} />
            <div className="ml-auto flex items-center gap-2 text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" />Critical</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400" />High</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Watch</span>
            </div>
          </div>
          <KarnatakaMap height={480} />
        </Panel>

        <div className="space-y-4">
          <Panel title="Crime Categories" subtitle="Last 30 days">
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={crimeCategories} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                    {crimeCategories.map((_, i) => (
                      <Cell key={i} fill={`oklch(${0.6 + i * 0.04} 0.2 ${180 + i * 20})`} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              {crimeCategories.slice(0, 6).map((c, i) => (
                <div key={c.name} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-sm" style={{ background: `oklch(${0.6 + i * 0.04} 0.2 ${180 + i * 20})` }} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="tabular-nums text-foreground">{c.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="High-Risk Districts" subtitle="Ranked by AI risk score">
            <ul className="space-y-2">
              {[...districts].sort((a, b) => b.risk - a.risk).slice(0, 6).map((d, i) => (
                <li key={d.name} className="flex items-center gap-3">
                  <span className="text-[10px] w-5 tabular-nums text-muted-foreground">#{i + 1}</span>
                  <span className="flex-1 text-sm">{d.name}</span>
                  <div className="w-24 h-1.5 rounded-full bg-input overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-destructive" style={{ width: `${d.risk}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-primary w-8 text-right">{d.risk}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {/* trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Crime Trend · 30 Days" subtitle="Category-wise incident volume" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={crimeTrend}>
                <defs>
                  {["theft", "assault", "cyber", "narcotics"].map((k, i) => (
                    <linearGradient key={k} id={`g-${k}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={`oklch(${0.7 - i * 0.05} 0.2 ${230 - i * 30})`} stopOpacity={0.6} />
                      <stop offset="100%" stopColor={`oklch(${0.7 - i * 0.05} 0.2 ${230 - i * 30})`} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="oklch(0.4 0.03 240 / 0.2)" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="oklch(0.6 0.03 240)" fontSize={10} />
                <YAxis stroke="oklch(0.6 0.03 240)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="theft" stroke="oklch(0.7 0.2 230)" fill="url(#g-theft)" strokeWidth={2} />
                <Area type="monotone" dataKey="assault" stroke="oklch(0.65 0.2 200)" fill="url(#g-assault)" strokeWidth={2} />
                <Area type="monotone" dataKey="cyber" stroke="oklch(0.6 0.2 170)" fill="url(#g-cyber)" strokeWidth={2} />
                <Area type="monotone" dataKey="narcotics" stroke="oklch(0.55 0.2 140)" fill="url(#g-narcotics)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Hourly Incident Distribution" subtitle="Rolling 24h · statewide">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={hourly}>
                <CartesianGrid stroke="oklch(0.4 0.03 240 / 0.2)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" stroke="oklch(0.6 0.03 240)" fontSize={9} interval={2} />
                <YAxis stroke="oklch(0.6 0.03 240)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="incidents" radius={[4, 4, 0, 0]}>
                  {hourly.map((h, i) => (
                    <Cell key={i} fill={h.incidents > 40 ? "oklch(0.65 0.24 25)" : "oklch(0.72 0.18 235)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "oklch(0.18 0.03 250 / 0.95)",
  border: "1px solid oklch(0.72 0.18 235 / 0.5)",
  borderRadius: 12,
  fontSize: 11,
  color: "oklch(0.97 0.01 240)",
};