import { useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Filter, LayoutGrid, Network, Radar as RadarIcon, Sigma, X } from "lucide-react";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { EChart } from "@/components/ciap/echart";
import {
  boxPlotOption, calendarOption, categoryPieOption, chordOption, correlationOption,
  districtBarOption, edgeBundlingOption, forceGraphOption, hexbinScatterOption,
  parallelOption, radarOption, sankeyOption, sunburstOption, timelineOption,
  treemapOption, violinOption,
} from "@/lib/ciap/chart-options";

export const Route = createFileRoute("/advanced-analytics")({
  beforeLoad: () => { throw redirect({ to: "/intelligence" }); },
});

const TABS = [
  { id: "composition", label: "Composition", icon: LayoutGrid },
  { id: "flow", label: "Flow & Relations", icon: Network },
  { id: "temporal", label: "Temporal", icon: Sigma },
  { id: "statistical", label: "Statistical", icon: RadarIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdvancedAnalytics() {
  const [tab, setTab] = useState<TabId>("composition");
  // Cross-filter selection shared by the bar / pie / treemap panels.
  const [selected, setSelected] = useState<string | null>(null);

  const bar = useMemo(() => districtBarOption(selected), [selected]);
  const pie = useMemo(() => categoryPieOption(selected), [selected]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ADVANCED VISUALISATION"
        title="Advanced Analytics Studio"
        description="Sixteen high-density Apache ECharts visualisations over 27 districts, 12 crime categories and 2,600+ geocoded incidents. Every panel supports zoom, PNG export and fullscreen."
        actions={
          <div className="flex items-center gap-2">
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-primary"
              >
                <Filter className="h-3 w-3" /> {selected} <X className="h-3 w-3" />
              </button>
            )}
            <Chip tone="primary">Live dataset</Chip>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Analytics views">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={
              "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition " +
              (tab === t.id
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-primary")
            }
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "composition" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <EChart
            title="District → Category Treemap"
            subtitle="Click a tile to cross-filter the panels below"
            option={treemapOption()}
            height={420}
            onSelect={(name) => setSelected((s) => (s === name ? null : name))}
          />
          <EChart title="Zone · District · Category Sunburst" subtitle="Radial hierarchy, click to drill" option={sunburstOption()} height={420} />
          <EChart title="District Volume" subtitle="Cross-filtered" option={bar} height={320} onSelect={(n) => setSelected((s) => (s === n ? null : n))} />
          <EChart title="Category Share" subtitle="Cross-filtered" option={pie} height={320} onSelect={(n) => setSelected((s) => (s === n ? null : n))} />
        </div>
      )}

      {tab === "flow" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <EChart title="Zone → Category → Outcome Sankey" subtitle="Case disposition flow" option={sankeyOption()} height={440} className="xl:col-span-2" />
          <EChart title="Inter-district Chord" subtitle="Cross-border offence linkage" option={chordOption()} height={420} />
          <EChart title="Hierarchical Edge Bundling" subtitle="Station co-offending clusters" option={edgeBundlingOption()} height={420} />
          <EChart title="Force-directed Entity Network" subtitle="Suspects, gangs, vehicles, phones — drag to explore" option={forceGraphOption()} height={460} className="xl:col-span-2" />
        </div>
      )}

      {tab === "temporal" && (
        <div className="grid grid-cols-1 gap-4">
          <EChart title="Interactive Timeline" subtitle="120 days · brush to zoom, drag to pan" option={timelineOption()} height={360} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <EChart title="Calendar Heatmap 2026" subtitle="Daily incident intensity" option={calendarOption(2026)} height={280} />
            <EChart title="Geographic Density Scatter" subtitle="2,600 geocoded incidents (hexbin proxy)" option={hexbinScatterOption()} height={280} />
          </div>
        </div>
      )}

      {tab === "statistical" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <EChart
            title="Socio-economic Correlation Matrix"
            subtitle="Pearson r across 9 indicators"
            option={correlationOption()}
            height={460}
            className="xl:col-span-2"
          />
          <EChart title="Parallel Coordinates" subtitle="27 districts across 6 dimensions" option={parallelOption()} height={380} />
          <EChart title="Category MO Radar" subtitle="Top 4 districts" option={radarOption()} height={380} />
          <EChart title="Box Plot — Daily Distribution" subtitle="Quartiles by category" option={boxPlotOption()} height={360} />
          <EChart title="Violin Plot — Kernel Density" subtitle="Distribution shape by category" option={violinOption()} height={360} />
        </div>
      )}

      <Panel title="Reading the analytics" subtitle="Analyst guidance">
        <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <li>• Treemap area encodes absolute volume; click any tile to cross-filter the district and category panels.</li>
          <li>• Sankey widths are proportional to case counts moving from zone to category to final disposition.</li>
          <li>• Correlation values above 0.6 (red) indicate strong positive association with crime density.</li>
          <li>• Every panel exports to PNG at 2× pixel ratio for direct inclusion in briefing decks.</li>
        </ul>
      </Panel>
    </div>
  );
}
