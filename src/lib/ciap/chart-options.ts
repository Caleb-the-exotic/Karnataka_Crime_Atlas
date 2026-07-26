/**
 * Apache ECharts option builders for every advanced CIAP visualization.
 * All builders are pure so charts stay deterministic between SSR and client.
 */
import type { EChartsOption } from "echarts";
import { crimeCategoryList, districtGeo, incidents } from "./geo";

const TOP = districtGeo.slice().sort((a, b) => b.crimes - a.crimes).slice(0, 12);

/* --------------------------------------------------------------- helpers */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const zoom = [
  { type: "inside" as const, xAxisIndex: 0, filterMode: "none" as const },
  { type: "slider" as const, xAxisIndex: 0, height: 14, bottom: 4, borderColor: "transparent", fillerColor: "rgba(79,168,255,0.15)", handleStyle: { color: "#4fa8ff" }, textStyle: { fontSize: 9 } },
];

export const districtCategoryMatrix = TOP.map((d) => {
  const rnd = mulberry32(d.name.length * 31 + d.crimes);
  return {
    district: d.name,
    values: crimeCategoryList.map((c, i) => Math.round(d.crimes * (0.05 + rnd() * 0.22) * (i === 0 ? 1.6 : 1))),
  };
});

/* -------------------------------------------------------------- treemap */

export function treemapOption(): EChartsOption {
  return {
    tooltip: { formatter: (p: any) => `<b>${p.name}</b><br/>${p.value?.toLocaleString?.() ?? p.value} incidents` },
    series: [
      {
        type: "treemap",
        roam: true,
        leafDepth: 2,
        breadcrumb: { show: true, bottom: 0, itemStyle: { color: "rgba(79,168,255,0.18)", textStyle: { color: "#c9d8ec", fontSize: 10 } } },
        upperLabel: { show: true, height: 22, color: "#e6f0ff", fontSize: 10 },
        itemStyle: { borderColor: "rgba(10,20,35,0.85)", borderWidth: 2, gapWidth: 2 },
        label: { fontSize: 10 },
        data: districtCategoryMatrix.map((d) => ({
          name: d.district,
          value: d.values.reduce((a, b) => a + b, 0),
          children: crimeCategoryList.map((c, i) => ({ name: c, value: d.values[i] })),
        })),
      },
    ],
  };
}

/* -------------------------------------------------------------- sunburst */

export function sunburstOption(): EChartsOption {
  return {
    tooltip: { formatter: (p: any) => `<b>${p.name}</b><br/>${p.value} incidents` },
    series: [
      {
        type: "sunburst",
        radius: ["12%", "92%"],
        sort: undefined,
        emphasis: { focus: "ancestor" },
        levels: [
          {},
          { r0: "12%", r: "42%", label: { rotate: 0, fontSize: 10 }, itemStyle: { borderWidth: 2, borderColor: "rgba(10,20,35,0.9)" } },
          { r0: "42%", r: "76%", label: { align: "right", fontSize: 9 } },
          { r0: "76%", r: "80%", label: { position: "outside", fontSize: 9 }, itemStyle: { borderWidth: 2 } },
        ],
        data: ["North Karnataka", "South Karnataka", "Coastal"].map((zone, zi) => ({
          name: zone,
          children: districtCategoryMatrix
            .filter((_, i) => i % 3 === zi)
            .map((d) => ({
              name: d.district,
              children: crimeCategoryList.slice(0, 5).map((c, i) => ({ name: c, value: d.values[i] })),
            })),
        })),
      },
    ],
  };
}

/* ------------------------------------------------- chord / circular graph */

export function chordOption(): EChartsOption {
  const nodes = TOP.slice(0, 9).map((d) => ({ name: d.name, value: d.crimes, symbolSize: 12 + (d.crimes / 5000) * 40 }));
  const rnd = mulberry32(7717);
  const links: any[] = [];
  nodes.forEach((a, i) =>
    nodes.forEach((b, j) => {
      if (j <= i) return;
      const w = rnd();
      if (w > 0.55) links.push({ source: a.name, target: b.name, value: Math.round(w * 120), lineStyle: { width: w * 4, opacity: 0.35, curveness: 0.32 } });
    }),
  );
  return {
    tooltip: {},
    series: [
      {
        type: "graph",
        layout: "circular",
        circular: { rotateLabel: true },
        roam: true,
        label: { show: true, position: "right", fontSize: 10, formatter: "{b}" },
        lineStyle: { color: "source", curveness: 0.3 },
        emphasis: { focus: "adjacency", lineStyle: { width: 5 } },
        data: nodes,
        links,
      },
    ],
  };
}

/* --------------------------------------------------------------- sankey */

export function sankeyOption(): EChartsOption {
  const zones = ["Bengaluru Metro", "North Karnataka", "Coastal Belt"];
  const outcomes = ["Charge-sheeted", "Under Investigation", "Convicted", "Closed / Cold"];
  const rnd = mulberry32(4242);
  const nodes = [...zones, ...crimeCategoryList, ...outcomes].map((name) => ({ name }));
  const links: any[] = [];
  zones.forEach((z) => crimeCategoryList.forEach((c) => links.push({ source: z, target: c, value: Math.round(60 + rnd() * 380) })));
  crimeCategoryList.forEach((c) => outcomes.forEach((o) => links.push({ source: c, target: o, value: Math.round(30 + rnd() * 190) })));
  return {
    tooltip: { trigger: "item", triggerOn: "mousemove" },
    series: [
      {
        type: "sankey",
        emphasis: { focus: "adjacency" },
        nodeAlign: "justify",
        lineStyle: { color: "gradient", opacity: 0.35, curveness: 0.5 },
        label: { color: "#c9d8ec", fontSize: 10 },
        data: nodes,
        links,
      },
    ],
  };
}

/* ------------------------------------------------------ calendar heatmap */

export function calendarOption(year = 2026): EChartsOption {
  const rnd = mulberry32(year);
  const start = new Date(`${year}-01-01`);
  const data: [string, number][] = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    data.push([d.toISOString().slice(0, 10), Math.round(140 + rnd() * 180 + (weekend ? 60 : 0))]);
  }
  return {
    tooltip: { formatter: (p: any) => `${p.value[0]}<br/><b>${p.value[1]}</b> incidents` },
    visualMap: {
      min: 120, max: 400, type: "continuous", orient: "horizontal", left: "center", bottom: 0,
      itemWidth: 10, itemHeight: 90, textStyle: { fontSize: 9 },
      inRange: { color: ["#12325c", "#2f8fd1", "#57e0c8", "#ffd166", "#ff2d55"] },
    },
    calendar: {
      top: 40, left: 42, right: 24, cellSize: ["auto", 13], range: String(year),
      itemStyle: { borderWidth: 2, borderColor: "rgba(10,20,35,0.9)", color: "rgba(120,170,240,0.06)" },
      splitLine: { lineStyle: { color: "rgba(120,170,240,0.18)" } },
      yearLabel: { show: false },
      monthLabel: { color: "#8aa0be", fontSize: 9 },
      dayLabel: { color: "#8aa0be", fontSize: 9 },
    },
    series: [{ type: "heatmap", coordinateSystem: "calendar", data }],
  };
}

/* -------------------------------------------------- parallel coordinates */

export function parallelOption(): EChartsOption {
  const rnd = mulberry32(919);
  return {
    parallelAxis: [
      { dim: 0, name: "Crime rate", nameTextStyle: { fontSize: 9 } },
      { dim: 1, name: "Urbanisation", nameTextStyle: { fontSize: 9 } },
      { dim: 2, name: "Literacy", nameTextStyle: { fontSize: 9 } },
      { dim: 3, name: "Unemployment", nameTextStyle: { fontSize: 9 } },
      { dim: 4, name: "Poverty", nameTextStyle: { fontSize: 9 } },
      { dim: 5, name: "Clearance %", nameTextStyle: { fontSize: 9 } },
    ],
    parallel: {
      left: 50, right: 50, bottom: 28, top: 40,
      parallelAxisDefault: {
        axisLine: { lineStyle: { color: "rgba(120,170,240,0.3)" } },
        axisLabel: { color: "#8aa0be", fontSize: 9 },
        nameTextStyle: { color: "#8aa0be" },
      },
    },
    tooltip: {},
    series: [
      {
        type: "parallel",
        smooth: true,
        lineStyle: { width: 1.4, opacity: 0.55 },
        emphasis: { lineStyle: { width: 3, opacity: 1 } },
        data: districtGeo.map((d) => [
          Math.round((d.crimes / d.population) * 100000),
          Math.round(25 + rnd() * 70),
          Math.round(62 + rnd() * 30),
          Math.round(3 + rnd() * 12),
          Math.round(6 + rnd() * 24),
          Math.round(52 + rnd() * 30),
          d.name,
        ]),
      },
    ],
  };
}

/* ----------------------------------------------------- correlation matrix */

export const socioIndicators = [
  "Population density", "Urbanisation", "Literacy", "Unemployment",
  "Migration", "Poverty", "Education index", "Median income", "Crime density",
];

export function correlationMatrix(): number[][] {
  const rnd = mulberry32(31337);
  const n = socioIndicators.length;
  const m: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = i; j < n; j++) {
      const v = i === j ? 1 : Number((rnd() * 1.7 - 0.75).toFixed(2));
      m[i][j] = v;
      m[j][i] = v;
    }
  // Domain-anchored relationships so the matrix reads sensibly.
  const set = (a: string, b: string, v: number) => {
    const i = socioIndicators.indexOf(a), j = socioIndicators.indexOf(b);
    m[i][j] = v; m[j][i] = v;
  };
  set("Urbanisation", "Crime density", 0.78);
  set("Population density", "Crime density", 0.71);
  set("Unemployment", "Crime density", 0.63);
  set("Poverty", "Crime density", 0.58);
  set("Literacy", "Crime density", -0.44);
  set("Education index", "Crime density", -0.52);
  set("Median income", "Crime density", -0.31);
  set("Migration", "Crime density", 0.49);
  return m;
}

export function correlationOption(): EChartsOption {
  const m = correlationMatrix();
  const data: [number, number, number][] = [];
  m.forEach((row, i) => row.forEach((v, j) => data.push([j, i, v])));
  return {
    tooltip: {
      formatter: (p: any) => `${socioIndicators[p.data[1]]} ↔ ${socioIndicators[p.data[0]]}<br/><b>r = ${p.data[2]}</b>`,
    },
    grid: { left: 130, right: 24, top: 16, bottom: 90 },
    xAxis: { type: "category", data: socioIndicators, axisLabel: { rotate: 40, fontSize: 9 }, splitArea: { show: true } },
    yAxis: { type: "category", data: socioIndicators, axisLabel: { fontSize: 9 }, splitArea: { show: true } },
    visualMap: {
      min: -1, max: 1, calculable: true, orient: "horizontal", left: "center", bottom: 4,
      textStyle: { fontSize: 9 },
      inRange: { color: ["#2f6fd1", "#1b2c46", "#ff5f5f"] },
    },
    series: [
      {
        type: "heatmap",
        data,
        label: { show: true, fontSize: 8, formatter: (p: any) => (p.data[2] as number).toFixed(2) },
        itemStyle: { borderColor: "rgba(10,20,35,0.85)", borderWidth: 1 },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(79,168,255,0.6)" } },
      },
    ],
  };
}

/* ----------------------------------------------------------------- radar */

export function radarOption(): EChartsOption {
  const rnd = mulberry32(555);
  const dims = ["Violent", "Property", "Cyber", "Narcotics", "Economic", "Public order"];
  return {
    legend: { bottom: 0 },
    tooltip: {},
    radar: {
      indicator: dims.map((d) => ({ name: d, max: 100 })),
      splitLine: { lineStyle: { color: "rgba(120,170,240,0.18)" } },
      splitArea: { areaStyle: { color: ["rgba(79,168,255,0.03)", "rgba(79,168,255,0.06)"] } },
      axisLine: { lineStyle: { color: "rgba(120,170,240,0.25)" } },
      axisName: { color: "#8aa0be", fontSize: 10 },
    },
    series: [
      {
        type: "radar",
        areaStyle: { opacity: 0.18 },
        symbolSize: 4,
        data: TOP.slice(0, 4).map((d) => ({
          name: d.name,
          value: dims.map(() => Math.round(28 + rnd() * 70)),
        })),
      },
    ],
  };
}

/* ------------------------------------------------------- box & violin */

function quantiles(v: number[]) {
  const s = [...v].sort((a, b) => a - b);
  const q = (p: number) => s[Math.floor(p * (s.length - 1))];
  return [s[0], q(0.25), q(0.5), q(0.75), s[s.length - 1]];
}

export function categorySamples() {
  const rnd = mulberry32(2468);
  return crimeCategoryList.map((c) => ({
    name: c,
    values: Array.from({ length: 90 }, () => Math.round(20 + rnd() * 120 + (c === "Theft" ? 60 : 0))),
  }));
}

export function boxPlotOption(): EChartsOption {
  const samples = categorySamples();
  return {
    tooltip: { trigger: "item" },
    dataZoom: zoom,
    xAxis: { type: "category", data: samples.map((s) => s.name), axisLabel: { rotate: 25, fontSize: 9 } },
    yAxis: { type: "value", name: "Daily incidents", nameTextStyle: { fontSize: 9 } },
    series: [
      { type: "boxplot", data: samples.map((s) => quantiles(s.values)), itemStyle: { color: "rgba(79,168,255,0.25)", borderColor: "#4fa8ff" } },
    ],
  };
}

/** Violin plot rendered as mirrored kernel-density ridges (custom series). */
export function violinOption(): EChartsOption {
  const samples = categorySamples();
  const bins = 22;
  const series = samples.map((s, idx) => {
    const min = Math.min(...s.values), max = Math.max(...s.values);
    const hist = Array(bins).fill(0);
    s.values.forEach((v) => hist[Math.min(bins - 1, Math.floor(((v - min) / (max - min || 1)) * bins))]++);
    const peak = Math.max(...hist, 1);
    const pts: [number, number][] = [];
    hist.forEach((h, i) => pts.push([idx + (h / peak) * 0.42, min + ((i + 0.5) / bins) * (max - min)]));
    for (let i = hist.length - 1; i >= 0; i--) pts.push([idx - (hist[i] / peak) * 0.42, min + ((i + 0.5) / bins) * (max - min)]);
    return {
      type: "line" as const,
      name: s.name,
      data: pts,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 1 },
      areaStyle: { opacity: 0.28 },
    };
  });
  return {
    tooltip: { trigger: "item" },
    legend: { bottom: 0, type: "scroll" },
    xAxis: { type: "value", min: -0.6, max: samples.length - 0.4, axisLabel: { formatter: (v: number) => samples[Math.round(v)]?.name ?? "", rotate: 25, fontSize: 9 }, interval: 1 },
    yAxis: { type: "value", name: "Daily incidents", nameTextStyle: { fontSize: 9 } },
    series,
  };
}

/* ------------------------------------------------------------- hexbin */

export function hexbinScatterOption(): EChartsOption {
  const pts = incidents.slice(0, 1800).map((i) => [i.position[1], i.position[0], i.weight]);
  return {
    tooltip: { formatter: (p: any) => `lng ${p.data[0].toFixed(3)}, lat ${p.data[1].toFixed(3)}` },
    dataZoom: [{ type: "inside" }, { type: "inside", yAxisIndex: 0 }],
    xAxis: { type: "value", name: "Longitude", scale: true, nameTextStyle: { fontSize: 9 } },
    yAxis: { type: "value", name: "Latitude", scale: true, nameTextStyle: { fontSize: 9 } },
    visualMap: { min: 0, max: 1, dimension: 2, calculable: true, orient: "horizontal", left: "center", bottom: 0, textStyle: { fontSize: 9 }, inRange: { color: ["#12325c", "#2f8fd1", "#57e0c8", "#ffd166", "#ff2d55"] } },
    series: [{ type: "scatter", symbolSize: 5, data: pts, large: true, progressive: 600, itemStyle: { opacity: 0.7 } }],
  };
}

/* -------------------------------------------------- force / network graph */

export function forceGraphOption(animated = true): EChartsOption {
  const rnd = mulberry32(8080);
  const cats = ["Suspect", "Gang", "Vehicle", "Phone", "Address", "Financial"];
  const nodes = Array.from({ length: 64 }, (_, i) => {
    const c = Math.floor(rnd() * cats.length);
    return { id: String(i), name: `${cats[c]}-${i}`, category: c, symbolSize: 8 + rnd() * 26, value: Math.round(rnd() * 100) };
  });
  const links = Array.from({ length: 108 }, () => {
    const a = Math.floor(rnd() * nodes.length), b = Math.floor(rnd() * nodes.length);
    return { source: String(a), target: String(b === a ? (b + 1) % nodes.length : b), value: Number(rnd().toFixed(2)) };
  });
  return {
    tooltip: { formatter: (p: any) => (p.dataType === "edge" ? `Confidence ${p.data.value}` : `<b>${p.name}</b><br/>Centrality ${p.value}`) },
    legend: { data: cats, bottom: 0 },
    series: [
      {
        type: "graph",
        layout: "force",
        roam: true,
        draggable: true,
        categories: cats.map((name) => ({ name })),
        force: { repulsion: 190, edgeLength: [40, 130], gravity: 0.08, friction: 0.12 },
        label: { show: false },
        emphasis: { focus: "adjacency", label: { show: true, fontSize: 9 } },
        lineStyle: { opacity: 0.35, width: 1, curveness: 0.16 },
        edgeSymbol: animated ? ["none", "arrow"] : undefined,
        edgeSymbolSize: 5,
        data: nodes,
        links,
      },
    ],
  };
}

/** Hierarchical edge bundling of station ↔ station co-offending links. */
export function edgeBundlingOption(): EChartsOption {
  const rnd = mulberry32(1212);
  const groups = ["Bengaluru", "Mysuru", "Coastal", "North", "Central"];
  const nodes: any[] = [];
  groups.forEach((g, gi) =>
    Array.from({ length: 8 }, (_, i) => nodes.push({ name: `${g}-${i}`, category: gi, value: Math.round(rnd() * 60) })),
  );
  const links: any[] = [];
  for (let i = 0; i < 90; i++) {
    const a = Math.floor(rnd() * nodes.length), b = Math.floor(rnd() * nodes.length);
    if (a !== b) links.push({ source: nodes[a].name, target: nodes[b].name });
  }
  return {
    legend: { data: groups, bottom: 0 },
    tooltip: {},
    series: [
      {
        type: "graph",
        layout: "circular",
        circular: { rotateLabel: true },
        categories: groups.map((name) => ({ name })),
        label: { show: true, position: "right", fontSize: 8, formatter: "{b}" },
        lineStyle: { color: "source", curveness: 0.6, opacity: 0.3, width: 1 },
        emphasis: { focus: "adjacency", lineStyle: { width: 3, opacity: 0.9 } },
        symbolSize: 7,
        roam: true,
        data: nodes,
        links,
      },
    ],
  };
}

/* --------------------------------------------------- interactive timeline */

export function timelineOption(): EChartsOption {
  const rnd = mulberry32(606);
  const days = Array.from({ length: 120 }, (_, i) => {
    const d = new Date(Date.now() - (119 - i) * 86400000);
    return d.toISOString().slice(5, 10);
  });
  const mk = (base: number, amp: number) => days.map((_, i) => Math.round(base + Math.sin(i / 9) * amp + rnd() * amp * 0.6));
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { bottom: 0 },
    dataZoom: zoom,
    xAxis: { type: "category", data: days, boundaryGap: false },
    yAxis: { type: "value" },
    series: [
      { name: "Theft", type: "line", smooth: true, showSymbol: false, areaStyle: { opacity: 0.18 }, data: mk(120, 34) },
      { name: "Assault", type: "line", smooth: true, showSymbol: false, areaStyle: { opacity: 0.18 }, data: mk(64, 20) },
      { name: "Cyber", type: "line", smooth: true, showSymbol: false, areaStyle: { opacity: 0.18 }, data: mk(48, 26) },
      { name: "Narcotics", type: "line", smooth: true, showSymbol: false, areaStyle: { opacity: 0.18 }, data: mk(28, 14) },
    ],
  };
}

/* --------------------------------------------------- cross-filter bar/pie */

export function districtBarOption(highlight?: string | null): EChartsOption {
  return {
    tooltip: { trigger: "axis" },
    dataZoom: zoom,
    xAxis: { type: "category", data: TOP.map((d) => d.name), axisLabel: { rotate: 32, fontSize: 9 } },
    yAxis: { type: "value", name: "Crimes (YTD)", nameTextStyle: { fontSize: 9 } },
    series: [
      {
        type: "bar",
        barMaxWidth: 26,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: (p: any) => (highlight && p.name !== highlight ? "rgba(79,168,255,0.22)" : "#4fa8ff"),
        },
        data: TOP.map((d) => d.crimes),
      },
    ],
  };
}

export function categoryPieOption(highlight?: string | null): EChartsOption {
  const totals = crimeCategoryList.map((c, i) => ({
    name: c,
    value: districtCategoryMatrix.reduce((a, d) => a + d.values[i], 0),
  }));
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, type: "scroll" },
    series: [
      {
        type: "pie",
        radius: ["45%", "72%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: "rgba(10,20,35,0.9)", borderWidth: 2, borderRadius: 4 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 12, fontWeight: 600 }, scaleSize: 8 },
        data: totals.map((t) => ({
          ...t,
          itemStyle: highlight && t.name !== highlight ? { opacity: 0.3 } : undefined,
        })),
      },
    ],
  };
}
