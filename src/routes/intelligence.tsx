import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Brain, TrendingUp, AlertTriangle, HeartPulse, PieChart, LayoutGrid, Sigma } from "lucide-react";
import { PageHeader, Panel, Chip, Sparkline } from "@/components/ciap/primitives";
import { HubTabs, TabPanel } from "@/components/ciap/hub-tabs";
import { EChart } from "@/components/ciap/echart";
import { correlationOption } from "@/lib/ciap/chart-options";
import { kpis, crimeTrend, hourly } from "@/lib/ciap-data";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  TrendingUp as TrendUp, TrendingDown, ShieldAlert, Activity, Radar, Flame, FileCheck2,
  UserX, Fingerprint,
} from "lucide-react";
import { AdvancedAnalytics } from "./advanced-analytics";
import { Predictive } from "./predictive";
import { Trends } from "./trends";
import { Anomaly } from "./anomaly";
import { SociologyPage } from "./sociology";
import { CrimeAnalytics } from "./crime-analytics";

export const Route = createFileRoute("/intelligence")({
  head: () => ({
    meta: [
      { title: "CIAP · Analytics" },
      { name: "description", content: "Predictive analytics, trends, anomalies, socio-economic analytics and advanced visualization." },
      { property: "og:title", content: "CIAP · Analytics" },
      { property: "og:description", content: "Unified analytics workspace for KSP analysts." },
    ],
  }),
  component: AnalyticsHub,
});

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "advanced", label: "Advanced Analytics", icon: Sigma },
  { id: "predictions", label: "Predictions", icon: Brain },
  { id: "anomalies", label: "Anomalies", icon: AlertTriangle },
  { id: "correlation", label: "Correlation Analysis", icon: PieChart },
];

const iconFor: Record<string, any> = {
  total: Activity, today: Radar, active: ShieldAlert, repeat: Fingerprint,
  hot: Flame, ai: TrendUp, wanted: UserX, solved: FileCheck2,
};

const tooltipStyle = {
  background: "oklch(0.18 0.03 250 / 0.95)",
  border: "1px solid oklch(0.72 0.18 235 / 0.5)",
  borderRadius: 12,
  fontSize: 11,
  color: "oklch(0.97 0.01 240)",
};

function AnalyticsHub() {
  const [tab, setTab] = useState("overview");
  return (
    <div className="space-y-6">
      <HubTabs tabs={TABS} value={tab} onChange={setTab} />

      <TabPanel active={tab === "overview"}>
        <div className="space-y-6">
          <PageHeader
            eyebrow="ANALYTICS"
            title="Analytics Workspace"
            titleStyle={{ fontFamily: '"Geist", sans-serif' }}
            description="Consolidated KPIs, trend analysis, anomaly detection, sociological correlations and predictions."
            actions={<Chip tone="primary">Model v4.2 · 87% confidence</Chip>}
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
                      {up ? <TrendUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {up ? "+" : ""}{k.delta}%
                    </span>
                    <span className="text-muted-foreground">vs last 7d</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trend + Hourly charts */}
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

          <CrimeAnalytics />
          <SociologyPage />
        </div>
      </TabPanel>
      <TabPanel active={tab === "advanced"}><AdvancedAnalytics /></TabPanel>
      <TabPanel active={tab === "predictions"}><Predictive /></TabPanel>
      <TabPanel active={tab === "anomalies"}><Anomaly /></TabPanel>
      <TabPanel active={tab === "correlation"}>
        <div className="space-y-6">
          <PageHeader eyebrow="CORRELATION" title="Socio-Crime Correlation Analysis" description="Pearson correlations between socio-economic indicators and crime intensity." />
          <EChart title="Correlation Matrix" subtitle="Pearson r · socio-economic vs crime" option={correlationOption()} height={480} />
          <SociologyPage />
        </div>
      </TabPanel>
    </div>
  );
}