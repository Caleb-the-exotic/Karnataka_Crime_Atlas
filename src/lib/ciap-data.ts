export const districts = [
  { name: "Bengaluru Urban", crimes: 4820, risk: 92, x: 55, y: 62 },
  { name: "Bengaluru Rural", crimes: 1210, risk: 61, x: 52, y: 58 },
  { name: "Mysuru", crimes: 2140, risk: 74, x: 42, y: 74 },
  { name: "Mangaluru", crimes: 1680, risk: 68, x: 22, y: 62 },
  { name: "Hubballi-Dharwad", crimes: 1520, risk: 65, x: 30, y: 40 },
  { name: "Belagavi", crimes: 1340, risk: 58, x: 26, y: 28 },
  { name: "Kalaburagi", crimes: 1180, risk: 71, x: 58, y: 22 },
  { name: "Ballari", crimes: 980, risk: 63, x: 52, y: 38 },
  { name: "Shivamogga", crimes: 860, risk: 49, x: 34, y: 56 },
  { name: "Tumakuru", crimes: 1120, risk: 55, x: 48, y: 58 },
  { name: "Vijayapura", crimes: 940, risk: 60, x: 38, y: 24 },
  { name: "Raichur", crimes: 870, risk: 66, x: 58, y: 32 },
  { name: "Udupi", crimes: 640, risk: 42, x: 24, y: 56 },
  { name: "Chitradurga", crimes: 720, risk: 51, x: 46, y: 46 },
  { name: "Hassan", crimes: 810, risk: 47, x: 38, y: 62 },
];

export const crimeTrend = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  theft: 40 + Math.round(Math.sin(i / 3) * 12 + Math.random() * 8),
  assault: 20 + Math.round(Math.cos(i / 4) * 8 + Math.random() * 6),
  cyber: 12 + Math.round(Math.sin(i / 2) * 6 + Math.random() * 5),
  narcotics: 8 + Math.round(Math.cos(i / 5) * 4 + Math.random() * 4),
}));

export const hourly = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h.toString().padStart(2, "0")}:00`,
  incidents: Math.round(20 + 30 * Math.abs(Math.sin((h - 3) / 3)) + Math.random() * 10),
}));

export const crimeCategories = [
  { name: "Theft", value: 3240 },
  { name: "Assault", value: 1820 },
  { name: "Cyber", value: 1560 },
  { name: "Narcotics", value: 940 },
  { name: "Fraud", value: 1120 },
  { name: "Homicide", value: 320 },
  { name: "Kidnapping", value: 210 },
];

export const liveAlerts = [
  { id: 1, level: "critical", title: "Armed robbery reported", where: "MG Road, Bengaluru", ago: "2m" },
  { id: 2, level: "high", title: "Suspect vehicle flagged (KA-05 MZ 4471)", where: "Hosur Road toll", ago: "8m" },
  { id: 3, level: "medium", title: "Cybercrime cluster detected", where: "Whitefield sector", ago: "17m" },
  { id: 4, level: "high", title: "Repeat offender re-entered geofence", where: "Mysuru city", ago: "24m" },
  { id: 5, level: "medium", title: "Unusual crowd density", where: "Majestic bus stand", ago: "41m" },
];

export const suspects = [
  { id: "SUS-00421", name: "Ramesh K.", alias: "Bull", risk: 94, cases: 12, district: "Bengaluru Urban", status: "At large" },
  { id: "SUS-00318", name: "Farhan A.", alias: "Ghost", risk: 88, cases: 9, district: "Mysuru", status: "Wanted" },
  { id: "SUS-00902", name: "Suresh M.", alias: "—", risk: 81, cases: 7, district: "Hubballi-Dharwad", status: "Under surveillance" },
  { id: "SUS-01120", name: "Anitha D.", alias: "Nova", risk: 76, cases: 5, district: "Mangaluru", status: "Bailed" },
  { id: "SUS-00554", name: "Prakash R.", alias: "Tiger", risk: 71, cases: 8, district: "Kalaburagi", status: "Wanted" },
  { id: "SUS-01444", name: "Vikas S.", alias: "Silent", risk: 68, cases: 4, district: "Belagavi", status: "Custody" },
];

export const cases = [
  { fir: "FIR/2026/07/1042", type: "Armed Robbery", district: "Bengaluru Urban", station: "Cubbon Park", status: "Active", severity: "Critical", date: "2026-07-24" },
  { fir: "FIR/2026/07/1039", type: "Cyber Fraud", district: "Bengaluru Urban", station: "Whitefield", status: "Under Investigation", severity: "High", date: "2026-07-24" },
  { fir: "FIR/2026/07/1033", type: "Narcotics", district: "Mangaluru", station: "Panambur", status: "Active", severity: "High", date: "2026-07-23" },
  { fir: "FIR/2026/07/1027", type: "Kidnapping", district: "Mysuru", station: "Vijaynagar", status: "Solved", severity: "Critical", date: "2026-07-22" },
  { fir: "FIR/2026/07/1020", type: "Assault", district: "Hubballi-Dharwad", station: "Gokul Road", status: "Active", severity: "Medium", date: "2026-07-22" },
  { fir: "FIR/2026/07/1011", type: "Vehicle Theft", district: "Belagavi", station: "Camp", status: "Cold", severity: "Low", date: "2026-07-20" },
  { fir: "FIR/2026/07/1004", type: "Homicide", district: "Kalaburagi", station: "MB Nagar", status: "Under Investigation", severity: "Critical", date: "2026-07-19" },
];

export const kpis = [
  { key: "total", label: "Total Crimes (YTD)", value: 84520, delta: +4.2, spark: [30,32,28,35,40,42,38,44,48,52,50,58] },
  { key: "today", label: "Today's Crimes", value: 312, delta: -6.1, spark: [40,42,38,36,34,32,30,28,26,24,22,20] },
  { key: "active", label: "Active Investigations", value: 5240, delta: +1.8, spark: [10,12,14,13,15,17,18,19,21,22,24,26] },
  { key: "repeat", label: "Repeat Offenders", value: 1147, delta: +2.4, spark: [8,9,11,10,12,13,14,15,17,18,20,22] },
  { key: "hot", label: "Crime Hotspots", value: 62, delta: +12.5, spark: [4,5,7,8,10,12,14,17,20,24,28,32] },
  { key: "ai", label: "AI Risk Alerts", value: 148, delta: +8.9, spark: [2,3,5,6,8,10,12,15,18,22,26,30] },
  { key: "wanted", label: "Wanted Criminals", value: 284, delta: -1.2, spark: [30,29,28,27,28,27,26,25,26,25,24,23] },
  { key: "solved", label: "Solved Cases", value: 39210, delta: +5.7, spark: [10,14,18,22,26,30,34,38,42,46,50,54] },
];