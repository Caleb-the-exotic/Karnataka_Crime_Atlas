import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as LeafletNS from "leaflet";
import {
  Layers, Satellite, Mountain, Map as MapIcon, Search, Ruler, Pentagon, Circle as CircleIcon,
  Play, Pause, Flame, Hexagon, Trash2, Crosshair, Download,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { cn } from "@/lib/utils";
import {
  KARNATAKA_BOUNDS, KARNATAKA_CENTER, crimeCategoryList, districtGeo, districtTimeline,
  haversineKm, hotspots, incidents, policeStations, type CrimeCategory, type Incident,
} from "@/lib/ciap/geo";
import { exportJSON } from "@/lib/ciap/export";
import { toast } from "sonner";

type BaseKey = "street" | "satellite" | "terrain" | "dark";

const BASES: Record<BaseKey, { label: string; url: string; attribution: string; icon: typeof MapIcon }> = {
  dark: {
    label: "Intelligence",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    icon: MapIcon,
  },
  street: {
    label: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    icon: MapIcon,
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    icon: Satellite,
  },
  terrain: {
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenTopoMap (CC-BY-SA)",
    icon: Mountain,
  },
};

const CATEGORY_COLOR: Record<CrimeCategory, string> = {
  Theft: "#4fa8ff",
  Assault: "#ff5f5f",
  Cyber: "#57e0c8",
  Narcotics: "#c084fc",
  Fraud: "#ffd166",
  Homicide: "#ff2d55",
  Kidnapping: "#ff9f43",
  "Vehicle Theft": "#7ee787",
};

export interface GisMapProps {
  height?: number;
  /** Hide the toolbar for embedded/compact use. */
  compact?: boolean;
  className?: string;
  showLayerControls?: boolean;
}

/**
 * Production GIS surface for Karnataka built on Leaflet.
 *
 * Layers: district boundary choropleth (GeoJSON), clustered police stations,
 * animated crime hotspots, kernel-density heatmap, hexbin density overlay and
 * a 90-day animated timeline. Drawing, measurement and geocoded search are
 * provided by leaflet-draw + Nominatim.
 */
export function GisMap({ height = 640, compact = false, className, showLayerControls = false }: GisMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const LRef = useRef<typeof LeafletNS | null>(null);
  const layersRef = useRef<Record<string, any>>({});
  const [ready, setReady] = useState(false);

  // ---- layer visibility + controls state
  const [base, setBase] = useState<BaseKey>("dark");
  const [showDistricts, setShowDistricts] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showHeat, setShowHeat] = useState(true);
  const [showHex, setShowHex] = useState(false); // keep state to avoid breaking drawing/bootstrapping logic but hide from UI
  const [showClusters, setShowClusters] = useState(true);
  const [heatOpacity, setHeatOpacity] = useState(0.75);
  const [categories, setCategories] = useState<CrimeCategory[]>([...crimeCategoryList]);
  const [dayWindow, setDayWindow] = useState(90);
  const [playing, setPlaying] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [measure, setMeasure] = useState<string | null>(null);

  const filtered = useMemo<Incident[]>(
    () => incidents.filter((i) => categories.includes(i.category) && i.daysAgo <= dayWindow),
    [categories, dayWindow],
  );

  /* ------------------------------------------------------- map bootstrap */
  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.heat");
      await import("leaflet.markercluster");
      await import("leaflet-draw");
      if (disposed || !containerRef.current || mapRef.current) return;
      LRef.current = L;

      const map = L.map(containerRef.current, {
        center: KARNATAKA_CENTER,
        zoom: 7,
        minZoom: 5,
        maxZoom: 18,
        zoomControl: true,
        preferCanvas: true,
        maxBounds: L.latLngBounds(KARNATAKA_BOUNDS[0], KARNATAKA_BOUNDS[1]).pad(0.6),
      });
      mapRef.current = map;

      const tile = L.tileLayer(BASES.dark.url, { attribution: BASES.dark.attribution, maxZoom: 19 }).addTo(map);
      layersRef.current.tile = tile;

      // Drawing / measurement
      const drawn = new L.FeatureGroup().addTo(map);
      layersRef.current.drawn = drawn;
      const drawControl = new (L as any).Control.Draw({
        position: "topright",
        draw: {
          polygon: { allowIntersection: false, shapeOptions: { color: "#4fa8ff", weight: 2 } },
          circle: { shapeOptions: { color: "#57e0c8", weight: 2 } },
          polyline: { shapeOptions: { color: "#ffd166", weight: 3 } },
          rectangle: { shapeOptions: { color: "#c084fc", weight: 2 } },
          marker: false,
          circlemarker: false,
        },
        edit: { featureGroup: drawn },
      });
      map.addControl(drawControl);
      layersRef.current.drawControl = drawControl;

      map.on((L as any).Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        drawn.addLayer(layer);
        if (e.layerType === "polyline") {
          const pts: LeafletNS.LatLng[] = layer.getLatLngs();
          let km = 0;
          for (let i = 1; i < pts.length; i++) km += haversineKm([pts[i - 1].lat, pts[i - 1].lng], [pts[i].lat, pts[i].lng]);
          const text = `${km.toFixed(2)} km`;
          setMeasure(text);
          layer.bindTooltip(`Distance: ${text}`, { permanent: true, direction: "center" }).openTooltip();
          toast.success(`Distance measured: ${text}`);
        } else {
          // Spatial selection: count incidents inside the drawn geometry.
          const inside = countInside(L, layer, e.layerType, filteredRef.current);
          layer
            .bindPopup(
              `<div class="ciap-pop"><b>Area of Interest</b><br/>${inside} incidents in selection<br/><span class="muted">${e.layerType}</span></div>`,
            )
            .openPopup();
          toast.success(`${inside} incidents inside the drawn ${e.layerType}`);
        }
      });

      // District boundaries
      try {
        const gj = await fetch("/geo/karnataka-districts.geojson").then((r) => r.json());
        const maxCrimes = Math.max(...districtGeo.map((d) => d.crimes));
        const districtLayer = L.geoJSON(gj, {
          style: (f: any) => {
            const d = districtGeo.find((x) => x.name === f.properties.district);
            const t = (d?.crimes ?? 300) / maxCrimes;
            return {
              color: "#4fa8ff",
              weight: 1,
              opacity: 0.55,
              fillColor: densityColor(t),
              fillOpacity: 0.28 + t * 0.35,
            };
          },
          onEachFeature: (f: any, layer: any) => {
            const name = f.properties.district;
            layer.bindPopup(() => districtPopup(name), { maxWidth: 320, className: "ciap-leaflet-popup" });
            layer.on("mouseover", () => layer.setStyle({ weight: 2.5, opacity: 1 }));
            layer.on("mouseout", () => layer.setStyle({ weight: 1, opacity: 0.55 }));
          },
        });
        layersRef.current.districts = districtLayer;
        if (!disposed) districtLayer.addTo(map);
      } catch {
        toast.error("District boundary layer failed to load");
      }

      // Police stations (clustered)
      const cluster = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 48,
        iconCreateFunction: (c: any) => {
          const n = c.getChildCount();
          return L.divIcon({
            html: `<div class="ciap-cluster"><span>${n}</span></div>`,
            className: "ciap-cluster-wrap",
            iconSize: L.point(40, 40),
          });
        },
      });
      policeStations.forEach((s) => {
        const m = L.marker(s.position, {
          icon: L.divIcon({
            className: "ciap-station-wrap",
            html: `<div class="ciap-station"></div>`,
            iconSize: [14, 14],
          }),
          title: s.name,
        });
        m.bindPopup(
          `<div class="ciap-pop"><div class="pop-title">${s.name}</div>
           <div class="muted">${s.district} · ${s.id}</div>
           <table class="pop-table">
             <tr><td>Sanctioned strength</td><td><b>${s.strength}</b></td></tr>
             <tr><td>Open cases</td><td><b>${s.openCases}</b></td></tr>
             <tr><td>Clearance rate</td><td><b>${s.clearance}%</b></td></tr>
           </table></div>`,
          { className: "ciap-leaflet-popup" },
        );
        cluster.addLayer(m);
      });
      layersRef.current.cluster = cluster;
      const plainStations = L.layerGroup(cluster.getLayers());
      layersRef.current.plainStations = plainStations;
      if (!disposed) cluster.addTo(map);

      // Hotspots (animated pulses)
      const hotspotLayer = L.layerGroup();
      hotspots.forEach((h) => {
        const marker = L.marker(h.position, {
          icon: L.divIcon({
            className: "ciap-hotspot-wrap",
            html: `<div class="ciap-hotspot" style="--i:${h.intensity}"><span class="ring"></span><span class="ring d2"></span><span class="core"></span></div>`,
            iconSize: [26, 26],
          }),
        });
        marker.bindPopup(
          `<div class="ciap-pop"><div class="pop-title">${h.name}</div>
            <div class="muted">${h.district} · ${h.id}</div>
            <table class="pop-table">
              <tr><td>Dominant crime</td><td><b>${h.dominantCrime}</b></td></tr>
              <tr><td>Incidents (30d)</td><td><b>${h.incidents30d}</b></td></tr>
              <tr><td>Trend</td><td><b class="${h.trend >= 0 ? "up" : "down"}">${h.trend >= 0 ? "+" : ""}${h.trend}%</b></td></tr>
              <tr><td>Intensity</td><td><b>${Math.round(h.intensity * 100)}/100</b></td></tr>
            </table></div>`,
          { className: "ciap-leaflet-popup" },
        );
        hotspotLayer.addLayer(marker);
      });
      layersRef.current.hotspots = hotspotLayer;
      if (!disposed) hotspotLayer.addTo(map);

      layersRef.current.hex = L.layerGroup();
      setReady(true);
    })();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep a ref of filtered incidents for the draw handler closure
  const filteredRef = useRef<Incident[]>(filtered);
  useEffect(() => {
    filteredRef.current = filtered;
  }, [filtered]);

  /* ------------------------------------------------------------- basemap */
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !ready) return;
    const cfg = BASES[base];
    layersRef.current.tile?.setUrl(cfg.url);
    layersRef.current.tile?.options && (layersRef.current.tile.options.attribution = cfg.attribution);
  }, [base, ready]);

  /* ------------------------------------------------- heat + hexbin layers */
  useEffect(() => {
    const L: any = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !ready) return;

    if (layersRef.current.heat) map.removeLayer(layersRef.current.heat);
    if (showHeat) {
      const heat = L.heatLayer(
        filtered.map((i) => [i.position[0], i.position[1], i.weight]),
        {
          radius: 22,
          blur: 18,
          maxZoom: 12,
          minOpacity: 0.12,
          gradient: { 0.2: "#1b3a6b", 0.4: "#2f7fd1", 0.6: "#57e0c8", 0.8: "#ffd166", 1.0: "#ff2d55" },
        },
      );
      heat.addTo(map);
      const el = heat._canvas as HTMLCanvasElement | undefined;
      if (el) el.style.opacity = String(heatOpacity);
      layersRef.current.heat = heat;
    }
  }, [filtered, showHeat, ready, heatOpacity]);

  useEffect(() => {
    const heat: any = layersRef.current.heat;
    if (heat?._canvas) heat._canvas.style.opacity = String(heatOpacity);
  }, [heatOpacity]);

  useEffect(() => {
    const L: any = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !ready) return;
    const group = layersRef.current.hex;
    group.clearLayers();
    if (!showHex) {
      map.removeLayer(group);
      return;
    }
    buildHexbins(L, filtered).forEach((p) => group.addLayer(p));
    group.addTo(map);
  }, [filtered, showHex, ready]);

  /* ------------------------------------------------ toggleable overlays */
  const toggleLayer = useCallback((key: string, on: boolean) => {
    const map = mapRef.current;
    const layer = layersRef.current[key];
    if (!map || !layer) return;
    if (on) layer.addTo(map);
    else map.removeLayer(layer);
  }, []);

  useEffect(() => toggleLayer("districts", showDistricts), [showDistricts, ready, toggleLayer]);
  useEffect(() => toggleLayer("hotspots", showHotspots), [showHotspots, ready, toggleLayer]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const { cluster, plainStations } = layersRef.current;
    [cluster, plainStations].forEach((l) => l && map.hasLayer(l) && map.removeLayer(l));
    if (showStations) (showClusters ? cluster : plainStations)?.addTo(map);
  }, [showStations, showClusters, ready]);

  /* ------------------------------------------------- timeline playback */
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setDayWindow((d) => (d >= 90 ? 3 : Math.min(90, d + 3)));
    }, 320);
    return () => window.clearInterval(id);
  }, [playing]);

  /* ------------------------------------------------------------ search */
  const runSearch = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !query.trim()) return;
    setSearching(true);
    try {
      // local match first (districts, stations, hotspots)
      const q = query.toLowerCase();
      const local =
        districtGeo.find((d) => d.name.toLowerCase().includes(q)) ??
        policeStations.find((s) => s.name.toLowerCase().includes(q)) ??
        hotspots.find((h) => h.name.toLowerCase().includes(q));
      if (local) {
        map.flyTo((local as any).position, 12, { duration: 1.1 });
        toast.success(`Located ${(local as any).name}`);
        return;
      }
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query + ", Karnataka")}`,
        { headers: { Accept: "application/json" } },
      ).then((r) => r.json());
      if (res?.[0]) {
        map.flyTo([Number(res[0].lat), Number(res[0].lon)], 13, { duration: 1.2 });
        toast.success(`Located ${res[0].display_name.split(",")[0]}`);
      } else {
        toast.error("No matching location found");
      }
    } catch {
      toast.error("Location search unavailable");
    } finally {
      setSearching(false);
    }
  }, [query]);

  const clearDrawings = () => {
    layersRef.current.drawn?.clearLayers();
    setMeasure(null);
    toast.info("Annotations cleared");
  };

  const exportView = () => {
    exportJSON(
      {
        generatedAt: new Date().toISOString(),
        filters: { categories, dayWindow },
        incidents: filtered.length,
        type: "FeatureCollection",
        features: filtered.map((i) => ({
          type: "Feature",
          properties: { id: i.id, category: i.category, severity: i.severity, district: i.district, daysAgo: i.daysAgo },
          geometry: { type: "Point", coordinates: [i.position[1], i.position[0]] },
        })),
      },
      "ciap-map-selection",
    );
  };

  return (
    <div className={cn("relative rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent z-[500]" />

      {!compact && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 p-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-input/40 p-1">
            {(Object.keys(BASES) as BaseKey[]).map((k) => {
              const Icon = BASES[k].icon;
              return (
                <button
                  key={k}
                  onClick={() => setBase(k)}
                  aria-pressed={base === k}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] transition",
                    base === k ? "bg-primary/20 text-primary border border-primary/40" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {BASES[k].label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-input/40 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Search district, station or address…"
              aria-label="Search location on map"
              className="w-56 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground"
            />
            <button onClick={runSearch} disabled={searching} className="text-[10px] text-primary hover:underline">
              {searching ? "…" : "Go"}
            </button>
          </div>

          <ToolBtn active={showHeat} onClick={() => setShowHeat((v) => !v)} icon={Flame} label="Heatmap" />
          <ToolBtn active={showClusters} onClick={() => setShowClusters((v) => !v)} icon={Crosshair} label="Cluster" />

          <div className="flex items-center gap-2 rounded-lg border border-border bg-input/40 px-2.5 py-1.5 text-[11px]">
            <span className="text-muted-foreground">Heat opacity</span>
            <input
              type="range" min={0.1} max={1} step={0.05} value={heatOpacity}
              onChange={(e) => setHeatOpacity(Number(e.target.value))}
              aria-label="Heatmap opacity"
              className="w-24 accent-[var(--color-primary)]"
            />
            <span className="tabular-nums text-primary w-8">{Math.round(heatOpacity * 100)}%</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {measure && (
              <span className="flex items-center gap-1 rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-2 py-1 text-[10px] text-yellow-300">
                <Ruler className="h-3 w-3" /> {measure}
              </span>
            )}
            <button onClick={clearDrawings} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[11px] text-muted-foreground hover:border-destructive/60 hover:text-destructive transition">
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
            <button onClick={exportView} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[11px] text-muted-foreground hover:border-primary/60 hover:text-primary transition">
              <Download className="h-3.5 w-3.5" /> GeoJSON
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <div ref={containerRef} style={{ height }} className="w-full ciap-map z-0" role="application" aria-label="Karnataka crime GIS map" />

        {/* Layer control */}
        {!compact && showLayerControls && (
          <div className="absolute left-3 top-3 z-[600] w-52 rounded-xl border border-border/70 bg-popover/90 backdrop-blur-xl p-3 text-[11px] shadow-xl">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Layers className="h-3.5 w-3.5 text-primary" /> Layer Control
            </div>
            <LayerToggle label="District boundaries" checked={showDistricts} onChange={setShowDistricts} />
            <LayerToggle label="Police stations" checked={showStations} onChange={setShowStations} />
            <LayerToggle label="Crime hotspots" checked={showHotspots} onChange={setShowHotspots} />
            <LayerToggle label="Density heatmap" checked={showHeat} onChange={setShowHeat} />

            <div className="mt-3 mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Crime categories</div>
            <div className="flex flex-wrap gap-1">
              {crimeCategoryList.map((c) => {
                const on = categories.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => setCategories((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))}
                    aria-pressed={on}
                    className={cn("rounded px-1.5 py-0.5 text-[9px] border transition", on ? "border-transparent text-background" : "border-border text-muted-foreground")}
                    style={on ? { background: CATEGORY_COLOR[c] } : undefined}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
              <Pentagon className="h-3 w-3" /> <CircleIcon className="h-3 w-3" /> <Ruler className="h-3 w-3" />
              <span>Draw tools · top-right</span>
            </div>
          </div>
        )}

        {/* Timeline playback */}
        {!compact && (
          <div className="absolute inset-x-0 bottom-0 z-[600] flex items-center gap-3 border-t border-border/60 bg-popover/95 backdrop-blur-xl px-4 py-3.5 text-[11px] shadow-xl">
            <button
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause timeline" : "Play timeline"}
              className="rounded-lg border border-primary/40 bg-primary/15 p-1.5 text-primary hover:bg-primary/25 transition"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <span className="text-muted-foreground whitespace-nowrap">Last {dayWindow} days</span>
            <input
              type="range" min={3} max={90} step={1} value={dayWindow}
              onChange={(e) => { setPlaying(false); setDayWindow(Number(e.target.value)); }}
              aria-label="Timeline window in days"
              className="flex-1 accent-[var(--color-primary)]"
            />
            <span className="tabular-nums text-primary whitespace-nowrap">{filtered.length.toLocaleString()} incidents</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- helpers */

function ToolBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Flame; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition",
        active ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function LayerToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 py-1 cursor-pointer">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-[var(--color-primary)]" />
    </label>
  );
}

function densityColor(t: number) {
  const stops = ["#12325c", "#1f5c9e", "#2f8fd1", "#57c8e0", "#ffd166", "#ff6b4a", "#ff2d55"];
  return stops[Math.min(stops.length - 1, Math.floor(t * stops.length))];
}

function districtPopup(name: string) {
  const d = districtGeo.find((x) => x.name === name);
  const series = districtTimeline(name);
  const max = Math.max(...series, 1);
  const bars = series
    .map((v, i) => `<rect x="${i * 13}" y="${34 - (v / max) * 32}" width="9" height="${(v / max) * 32}" rx="1.5" fill="#4fa8ff" opacity="${0.45 + (v / max) * 0.55}"></rect>`)
    .join("");
  const stations = policeStations.filter((s) => s.district === name).length;
  const hs = hotspots.filter((h) => h.district === name).length;
  return `<div class="ciap-pop">
    <div class="pop-title">${name}</div>
    <div class="muted">District intelligence summary</div>
    <table class="pop-table">
      <tr><td>Reported crimes (YTD)</td><td><b>${(d?.crimes ?? 0).toLocaleString()}</b></td></tr>
      <tr><td>Risk index</td><td><b>${d?.risk ?? "—"}/100</b></td></tr>
      <tr><td>Population</td><td><b>${(d?.population ?? 0).toLocaleString()}</b></td></tr>
      <tr><td>Crime per 100k</td><td><b>${d ? Math.round((d.crimes / d.population) * 100000) : "—"}</b></td></tr>
      <tr><td>Police stations</td><td><b>${stations}</b></td></tr>
      <tr><td>Active hotspots</td><td><b>${hs}</b></td></tr>
    </table>
    <div class="pop-sub">12-month crime timeline</div>
    <svg viewBox="0 0 156 34" width="156" height="34">${bars}</svg>
  </div>`;
}

/** Count incidents contained by a drawn polygon / rectangle / circle. */
function countInside(L: any, layer: any, type: string, list: Incident[]) {
  if (type === "circle") {
    const c = layer.getLatLng();
    const r = layer.getRadius() / 1000;
    return list.filter((i) => haversineKm([c.lat, c.lng], i.position) <= r).length;
  }
  const ring: { lat: number; lng: number }[] = layer.getLatLngs()[0];
  return list.filter((i) => pointInPolygon(i.position, ring)).length;
}

function pointInPolygon([lat, lng]: [number, number], ring: { lat: number; lng: number }[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].lng, yi = ring[i].lat, xj = ring[j].lng, yj = ring[j].lat;
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Aggregate incidents into a hexagonal density grid drawn as Leaflet polygons. */
function buildHexbins(L: any, list: Incident[]) {
  const R = 0.11; // hex "radius" in degrees
  const w = Math.sqrt(3) * R;
  const h = 1.5 * R;
  const bins = new Map<string, { q: number; r: number; n: number }>();

  list.forEach((i) => {
    const [lat, lng] = i.position;
    const r = Math.round(lat / h);
    const q = Math.round((lng - (r % 2 ? w / 2 : 0)) / w);
    const key = `${q}:${r}`;
    const b = bins.get(key) ?? { q, r, n: 0 };
    b.n++;
    bins.set(key, b);
  });

  const max = Math.max(...[...bins.values()].map((b) => b.n), 1);
  return [...bins.values()]
    .filter((b) => b.n > 1)
    .map((b) => {
      const cy = b.r * h;
      const cx = b.q * w + (b.r % 2 ? w / 2 : 0);
      const pts: [number, number][] = Array.from({ length: 6 }, (_, k) => {
        const a = (Math.PI / 180) * (60 * k + 30);
        return [cy + R * Math.sin(a), cx + (R * Math.cos(a) * w) / (Math.sqrt(3) * R)] as [number, number];
      });
      const t = b.n / max;
      return L.polygon(pts, {
        color: densityColor(t),
        weight: 1,
        opacity: 0.7,
        fillColor: densityColor(t),
        fillOpacity: 0.15 + t * 0.5,
      }).bindPopup(`<div class="ciap-pop"><b>Hexbin density</b><br/>${b.n} incidents<br/><span class="muted">${Math.round(t * 100)}% of peak cell</span></div>`);
    });
}
