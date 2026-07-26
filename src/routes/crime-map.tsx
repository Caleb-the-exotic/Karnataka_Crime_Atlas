import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { PageHeader, Panel } from "@/components/ciap/primitives";
import { GisMap } from "@/components/ciap/gis-map";
import { districtGeo, incidents } from "@/lib/ciap/geo";

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

function CrimeMapPage() {
  const [layerControlOpen, setLayerControlOpen] = useState(false);

  const [showRollup, setShowRollup] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="GEOSPATIAL INTELLIGENCE"
        title="State-wide Crime Map"
        titleStyle={{ fontFamily: '"Geist", sans-serif' }}
        description="Real WGS-84 Leaflet map — choropleth districts, station markers, clustered incidents, heatmap and 90-day timeline playback."
        actions={
          <button
            onClick={() => setLayerControlOpen(!layerControlOpen)}
            className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20 transition"
          >
            <Layers className="h-4 w-4" />
            <span>Layer Controls</span>
          </button>
        }
      />

      <GisMap height={680} showLayerControls={layerControlOpen} />

      <Panel
        title="District Roll-up"
        actions={
          <button
            onClick={() => setShowRollup(!showRollup)}
            className="text-xs text-primary hover:underline font-medium border border-primary/30 rounded-lg px-2.5 py-1 bg-primary/5 hover:bg-primary/15 transition"
          >
            {showRollup ? "Hide Districts" : "Show Districts"}
          </button>
        }
      >
        {showRollup && (
          <div className="overflow-x-auto animate-in fade-in duration-200 mt-2">
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
        )}
      </Panel>
    </div>
  );
}