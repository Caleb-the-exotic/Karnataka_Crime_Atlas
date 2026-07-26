import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, Flame, Map as MapIcon, Clock, PieChart, Layers } from "lucide-react";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { HubTabs, TabPanel, Breadcrumbs } from "@/components/ciap/hub-tabs";
import { GisMap } from "@/components/ciap/gis-map";
import { districtGeo, incidents } from "@/lib/ciap/geo";
import { Hotspots } from "./hotspots";

export const Route = createFileRoute("/crime-map")({
  head: () => ({
    meta: [
      { title: "CIAP · Crime Map" },
      { name: "description", content: "Real Leaflet GIS map of Karnataka with heatmap, hotspots, drawing tools and timeline playback." },
      { property: "og:title", content: "CIAP · Crime Map" },
      { property: "og:description", content: "State-wide geospatial intelligence for KSP." },
    ],
  }),
  component: CrimeMapPage,
});

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "heatmap", label: "Heatmap", icon: MapIcon },
  { id: "hotspots", label: "Hotspots", icon: Flame },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "districts", label: "District Analysis", icon: PieChart },
  { id: "layers", label: "Layer Controls", icon: Layers },
];

function CrimeMapPage() {
  const [tab, setTab] = useState("overview");
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="GEOSPATIAL INTELLIGENCE"
        title="State-wide Crime Map"
        titleStyle={{ fontFamily: '"Geist", sans-serif' }}
        description="Real WGS-84 Leaflet map — choropleth districts, station markers, clustered incidents, heatmap and 90-day timeline playback."
        actions={<div className="flex gap-2"><Chip tone="primary">{incidents.length.toLocaleString()} incidents</Chip><Chip>{districtGeo.length} districts</Chip></div>}
      />
      <HubTabs tabs={TABS} value={tab} onChange={setTab} />

      <TabPanel active={tab === "overview"}>
        <GisMap height={680} />
      </TabPanel>
      <TabPanel active={tab === "heatmap"}>
        <GisMap height={680} />
      </TabPanel>
      <TabPanel active={tab === "hotspots"}>
        <Hotspots />
      </TabPanel>
      <TabPanel active={tab === "timeline"}>
        <GisMap height={680} />
      </TabPanel>
      <TabPanel active={tab === "districts"}>
        <Panel title="District Roll-up">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr>{["District", "Population", "Crimes (annual)", "Risk", "Recent 90d", "Rate / 100k"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {districtGeo.map((d) => {
                  const recent = incidents.filter((i) => i.district === d.name).length;
                  const rate = ((d.crimes / d.population) * 100000).toFixed(1);
                  return (
                    <tr key={d.name} className="border-t border-border/60 hover:bg-secondary/40">
                      <td className="px-3 py-2 font-medium">{d.name}</td>
                      <td className="px-3 py-2 tabular-nums">{d.population.toLocaleString()}</td>
                      <td className="px-3 py-2 tabular-nums">{d.crimes.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 rounded-full bg-input overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-destructive" style={{ width: `${d.risk}%` }} />
                          </div>
                          <span className="tabular-nums">{d.risk}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 tabular-nums">{recent}</td>
                      <td className="px-3 py-2 tabular-nums text-primary">{rate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </TabPanel>
      <TabPanel active={tab === "layers"}>
        <Panel title="Map Layers" subtitle="Toggle overlays on the live map">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {[
              "Base tiles (dark / satellite / streets)",
              "District choropleth (risk score)",
              "Police station markers",
              "Incident clusters",
              "Kernel density heatmap",
              "Hotspot pulses",
              "Timeline playback (90d)",
              "Drawing tools (polygons / circles)",
            ].map((l) => (
              <li key={l} className="rounded-lg border border-border/60 bg-secondary/30 p-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />{l}
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-muted-foreground">Layer toggles are available in the live map's control panel (top-right of the map).</div>
        </Panel>
        <div className="mt-4"><GisMap height={520} /></div>
      </TabPanel>
    </div>
  );
}