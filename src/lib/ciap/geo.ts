/**
 * CIAP geospatial data layer.
 *
 * Everything here is real WGS-84 geometry for Karnataka so the GIS map can run
 * true spatial operations (heatmaps, clustering, hexbins, distance measurement)
 * instead of the previous illustrative SVG.
 */

export type LatLng = [number, number];

export interface PoliceStation {
  id: string;
  name: string;
  district: string;
  position: LatLng;
  strength: number;
  openCases: number;
  clearance: number;
}

export interface Hotspot {
  id: string;
  name: string;
  district: string;
  position: LatLng;
  intensity: number; // 0..1
  dominantCrime: string;
  incidents30d: number;
  trend: number; // % change
}

export interface Incident {
  id: string;
  position: LatLng;
  district: string;
  category: CrimeCategory;
  severity: "Low" | "Medium" | "High" | "Critical";
  weight: number;
  /** Days before "today" (0 = today, 89 = 90 days ago). */
  daysAgo: number;
  hour: number;
}

export type CrimeCategory =
  | "Theft"
  | "Assault"
  | "Cyber"
  | "Narcotics"
  | "Fraud"
  | "Homicide"
  | "Kidnapping"
  | "Vehicle Theft";

export const crimeCategoryList: CrimeCategory[] = [
  "Theft",
  "Assault",
  "Cyber",
  "Narcotics",
  "Fraud",
  "Homicide",
  "Kidnapping",
  "Vehicle Theft",
];

export const KARNATAKA_CENTER: LatLng = [14.85, 75.75];
export const KARNATAKA_BOUNDS: [LatLng, LatLng] = [
  [11.3, 73.8],
  [18.6, 78.8],
];

/** District seed points (real coordinates) + analytical attributes. */
export const districtGeo: {
  name: string;
  position: LatLng;
  crimes: number;
  risk: number;
  population: number;
}[] = [
  { name: "Bengaluru Urban", position: [12.9716, 77.5946], crimes: 4820, risk: 92, population: 9621551 },
  { name: "Bengaluru Rural", position: [13.2846, 77.6236], crimes: 1210, risk: 61, population: 990923 },
  { name: "Mysuru", position: [12.2958, 76.6394], crimes: 2140, risk: 74, population: 3001127 },
  { name: "Dakshina Kannada", position: [12.8703, 74.8806], crimes: 1680, risk: 68, population: 2089649 },
  { name: "Dharwad", position: [15.3647, 75.124], crimes: 1520, risk: 65, population: 1847023 },
  { name: "Belagavi", position: [15.8497, 74.4977], crimes: 1340, risk: 58, population: 4779661 },
  { name: "Kalaburagi", position: [17.3297, 76.8343], crimes: 1180, risk: 71, population: 2566326 },
  { name: "Ballari", position: [15.1394, 76.9214], crimes: 980, risk: 63, population: 2452595 },
  { name: "Shivamogga", position: [13.9299, 75.5681], crimes: 860, risk: 49, population: 1752753 },
  { name: "Tumakuru", position: [13.3409, 77.101], crimes: 1120, risk: 55, population: 2678980 },
  { name: "Vijayapura", position: [16.8302, 75.71], crimes: 940, risk: 60, population: 2177331 },
  { name: "Raichur", position: [16.2076, 77.3463], crimes: 870, risk: 66, population: 1928812 },
  { name: "Udupi", position: [13.3409, 74.7421], crimes: 640, risk: 42, population: 1177361 },
  { name: "Chitradurga", position: [14.2251, 76.3985], crimes: 720, risk: 51, population: 1659456 },
  { name: "Hassan", position: [13.0072, 76.0962], crimes: 810, risk: 47, population: 1776221 },
  { name: "Bidar", position: [17.9104, 77.5199], crimes: 690, risk: 57, population: 1703300 },
  { name: "Bagalkote", position: [16.1691, 75.6615], crimes: 620, risk: 52, population: 1889752 },
  { name: "Davanagere", position: [14.4644, 75.9218], crimes: 780, risk: 54, population: 1945497 },
  { name: "Kolar", position: [13.1367, 78.1292], crimes: 560, risk: 48, population: 1540231 },
  { name: "Mandya", position: [12.5218, 76.8951], crimes: 610, risk: 46, population: 1805769 },
  { name: "Uttara Kannada", position: [14.7937, 74.6869], crimes: 470, risk: 38, population: 1437169 },
  { name: "Chikkamagaluru", position: [13.3161, 75.7720], crimes: 430, risk: 36, population: 1137961 },
  { name: "Koppal", position: [15.3547, 76.1549], crimes: 410, risk: 44, population: 1389920 },
  { name: "Gadag", position: [15.4315, 75.6355], crimes: 390, risk: 41, population: 1064570 },
  { name: "Haveri", position: [14.7951, 75.3991], crimes: 420, risk: 43, population: 1597668 },
  { name: "Chamarajanagar", position: [11.9261, 76.9438], crimes: 350, risk: 34, population: 1020791 },
  { name: "Kodagu", position: [12.3375, 75.8069], crimes: 290, risk: 31, population: 554519 },
];

export const districtNames = districtGeo.map((d) => d.name);

export const policeStations: PoliceStation[] = [
  { id: "PS-001", name: "Cubbon Park PS", district: "Bengaluru Urban", position: [12.9762, 77.5993], strength: 84, openCases: 212, clearance: 68 },
  { id: "PS-002", name: "Whitefield PS", district: "Bengaluru Urban", position: [12.9698, 77.7499], strength: 96, openCases: 341, clearance: 61 },
  { id: "PS-003", name: "Koramangala PS", district: "Bengaluru Urban", position: [12.9352, 77.6245], strength: 72, openCases: 188, clearance: 71 },
  { id: "PS-004", name: "Yeshwanthpur PS", district: "Bengaluru Urban", position: [13.0284, 77.5409], strength: 68, openCases: 164, clearance: 66 },
  { id: "PS-005", name: "Electronic City PS", district: "Bengaluru Urban", position: [12.8452, 77.6602], strength: 78, openCases: 203, clearance: 64 },
  { id: "PS-006", name: "Devanahalli PS", district: "Bengaluru Rural", position: [13.2437, 77.7126], strength: 44, openCases: 82, clearance: 73 },
  { id: "PS-007", name: "Vijaynagar PS (Mysuru)", district: "Mysuru", position: [12.3236, 76.6083], strength: 58, openCases: 141, clearance: 70 },
  { id: "PS-008", name: "Nazarbad PS", district: "Mysuru", position: [12.3052, 76.6603], strength: 52, openCases: 118, clearance: 74 },
  { id: "PS-009", name: "Panambur PS", district: "Dakshina Kannada", position: [12.9418, 74.8065], strength: 46, openCases: 96, clearance: 69 },
  { id: "PS-010", name: "Mangaluru North PS", district: "Dakshina Kannada", position: [12.8938, 74.8420], strength: 54, openCases: 127, clearance: 66 },
  { id: "PS-011", name: "Gokul Road PS", district: "Dharwad", position: [15.3488, 75.1075], strength: 49, openCases: 104, clearance: 65 },
  { id: "PS-012", name: "Camp PS (Belagavi)", district: "Belagavi", position: [15.8577, 74.5089], strength: 51, openCases: 111, clearance: 62 },
  { id: "PS-013", name: "MB Nagar PS", district: "Kalaburagi", position: [17.3418, 76.8281], strength: 47, openCases: 132, clearance: 58 },
  { id: "PS-014", name: "Ballari City PS", district: "Ballari", position: [15.1470, 76.9241], strength: 43, openCases: 97, clearance: 60 },
  { id: "PS-015", name: "Shivamogga Town PS", district: "Shivamogga", position: [13.9316, 75.5680], strength: 41, openCases: 76, clearance: 72 },
  { id: "PS-016", name: "Tumakuru Town PS", district: "Tumakuru", position: [13.3392, 77.1140], strength: 45, openCases: 88, clearance: 67 },
  { id: "PS-017", name: "Vijayapura City PS", district: "Vijayapura", position: [16.8244, 75.7154], strength: 39, openCases: 84, clearance: 59 },
  { id: "PS-018", name: "Raichur Town PS", district: "Raichur", position: [16.2043, 77.3556], strength: 38, openCases: 91, clearance: 57 },
  { id: "PS-019", name: "Udupi Town PS", district: "Udupi", position: [13.3392, 74.7452], strength: 34, openCases: 52, clearance: 78 },
  { id: "PS-020", name: "Bidar City PS", district: "Bidar", position: [17.9133, 77.5301], strength: 36, openCases: 71, clearance: 63 },
  { id: "PS-021", name: "Davanagere Town PS", district: "Davanagere", position: [14.4696, 75.9240], strength: 40, openCases: 79, clearance: 68 },
  { id: "PS-022", name: "Hassan Town PS", district: "Hassan", position: [13.0055, 76.1004], strength: 33, openCases: 58, clearance: 75 },
  { id: "PS-023", name: "Kolar Town PS", district: "Kolar", position: [13.1362, 78.1338], strength: 31, openCases: 49, clearance: 71 },
  { id: "PS-024", name: "Mandya Town PS", district: "Mandya", position: [12.5240, 76.8977], strength: 32, openCases: 54, clearance: 73 },
  { id: "PS-025", name: "Karwar Town PS", district: "Uttara Kannada", position: [14.8135, 74.1297], strength: 28, openCases: 38, clearance: 80 },
];

export const hotspots: Hotspot[] = [
  { id: "HS-01", name: "Majestic Transit Hub", district: "Bengaluru Urban", position: [12.9774, 77.5716], intensity: 1.0, dominantCrime: "Theft", incidents30d: 412, trend: 14.2 },
  { id: "HS-02", name: "Whitefield IT Corridor", district: "Bengaluru Urban", position: [12.9698, 77.7499], intensity: 0.93, dominantCrime: "Cyber", incidents30d: 366, trend: 22.8 },
  { id: "HS-03", name: "Electronic City Ring", district: "Bengaluru Urban", position: [12.8452, 77.6602], intensity: 0.81, dominantCrime: "Vehicle Theft", incidents30d: 288, trend: 9.1 },
  { id: "HS-04", name: "KR Market Belt", district: "Bengaluru Urban", position: [12.9629, 77.5775], intensity: 0.88, dominantCrime: "Assault", incidents30d: 301, trend: -3.4 },
  { id: "HS-05", name: "Mysuru Palace Quarter", district: "Mysuru", position: [12.3052, 76.6551], intensity: 0.72, dominantCrime: "Theft", incidents30d: 194, trend: 6.5 },
  { id: "HS-06", name: "Mangaluru Port Zone", district: "Dakshina Kannada", position: [12.9418, 74.8065], intensity: 0.69, dominantCrime: "Narcotics", incidents30d: 172, trend: 18.3 },
  { id: "HS-07", name: "Hubballi Market", district: "Dharwad", position: [15.3496, 75.1350], intensity: 0.64, dominantCrime: "Theft", incidents30d: 151, trend: 4.7 },
  { id: "HS-08", name: "Kalaburagi Old City", district: "Kalaburagi", position: [17.3297, 76.8343], intensity: 0.7, dominantCrime: "Assault", incidents30d: 166, trend: 11.9 },
  { id: "HS-09", name: "Ballari Mining Belt", district: "Ballari", position: [15.1394, 76.9214], intensity: 0.61, dominantCrime: "Fraud", incidents30d: 138, trend: 7.2 },
  { id: "HS-10", name: "Belagavi Cantonment", district: "Belagavi", position: [15.8577, 74.5089], intensity: 0.56, dominantCrime: "Theft", incidents30d: 121, trend: -1.8 },
  { id: "HS-11", name: "Raichur Bus Terminus", district: "Raichur", position: [16.2043, 77.3556], intensity: 0.59, dominantCrime: "Kidnapping", incidents30d: 118, trend: 13.4 },
  { id: "HS-12", name: "Vijayapura Fort Area", district: "Vijayapura", position: [16.8302, 75.71], intensity: 0.53, dominantCrime: "Theft", incidents30d: 104, trend: 2.6 },
];

/**
 * Deterministic pseudo-random generator so map/chart data is stable between
 * SSR and hydration (a Math.random() feed would cause hydration mismatch).
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const severities = ["Low", "Medium", "High", "Critical"] as const;

/** ~2,600 synthetic-but-realistic incidents scattered around real hotspots. */
export const incidents: Incident[] = (() => {
  const rnd = mulberry32(20260725);
  const out: Incident[] = [];
  let n = 0;

  const push = (center: LatLng, district: string, spread: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const lat = center[0] + (rnd() - 0.5) * spread;
      const lng = center[1] + (rnd() - 0.5) * spread;
      const category = crimeCategoryList[Math.floor(rnd() * crimeCategoryList.length)];
      const severity = severities[Math.floor(rnd() * severities.length)];
      out.push({
        id: `INC-${(++n).toString().padStart(5, "0")}`,
        position: [Number(lat.toFixed(5)), Number(lng.toFixed(5))],
        district,
        category,
        severity,
        weight: Number((0.3 + rnd() * 0.7).toFixed(2)),
        daysAgo: Math.floor(rnd() * 90),
        hour: Math.floor(rnd() * 24),
      });
    }
  };

  hotspots.forEach((h) => push(h.position, h.district, 0.09, Math.round(h.intensity * 110)));
  districtGeo.forEach((d) => push(d.position, d.name, 0.55, Math.round(d.crimes / 40) + 12));
  return out;
})();

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Crime timeline (12 months) used by the district popup chart. */
export function districtTimeline(district: string): number[] {
  const base = districtGeo.find((d) => d.name === district)?.crimes ?? 500;
  const rnd = mulberry32(district.length * 977 + base);
  return Array.from({ length: 12 }, (_, i) =>
    Math.round((base / 12) * (0.72 + Math.sin(i / 1.9) * 0.16 + rnd() * 0.3)),
  );
}

export function incidentsToGeoJSON(list: Incident[]) {
  return {
    type: "FeatureCollection" as const,
    features: list.map((i) => ({
      type: "Feature" as const,
      properties: {
        id: i.id,
        district: i.district,
        category: i.category,
        severity: i.severity,
        daysAgo: i.daysAgo,
        hour: i.hour,
      },
      geometry: { type: "Point" as const, coordinates: [i.position[1], i.position[0]] },
    })),
  };
}
