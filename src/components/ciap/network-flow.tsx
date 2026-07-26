import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { User, Car, Phone, MapPin, Users, DollarSign, Skull, Building2 } from "lucide-react";

type NType = "suspect" | "victim" | "vehicle" | "phone" | "address" | "gang" | "txn" | "station";

const style: Record<NType, { color: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  suspect: { color: "#ef4444", label: "Suspect", icon: User },
  victim:  { color: "#22d3ee", label: "Victim", icon: User },
  vehicle: { color: "#3b82f6", label: "Vehicle", icon: Car },
  phone:   { color: "#10b981", label: "Phone", icon: Phone },
  address: { color: "#f59e0b", label: "Address", icon: MapPin },
  gang:    { color: "#b91c1c", label: "Gang", icon: Skull },
  txn:     { color: "#84cc16", label: "Financial", icon: DollarSign },
  station: { color: "#8b5cf6", label: "Station", icon: Building2 },
};

interface Raw { id: string; type: NType; label: string; hint?: string; x: number; y: number }
const raw: Raw[] = [
  { id: "s1", type: "suspect", label: "Ramesh K.",   hint: "wanted · 3 FIRs", x: 300, y: 200 },
  { id: "s2", type: "suspect", label: "Farhan A.",   hint: "flagged",         x: 90,  y: 90  },
  { id: "s3", type: "gang",    label: "Gang · Red-9", hint: "9 members",      x: 560, y: 90  },
  { id: "v1", type: "victim",  label: "Victim #4471",                          x: 40,  y: 320 },
  { id: "car1", type: "vehicle", label: "KA-05 MZ 4471",                       x: 620, y: 240 },
  { id: "p1", type: "phone", label: "+91 98••4212",                            x: 400, y: 380 },
  { id: "p2", type: "phone", label: "+91 96••1188",                            x: 180, y: 400 },
  { id: "a1", type: "address", label: "Whitefield",                            x: 20,  y: 190 },
  { id: "a2", type: "address", label: "MG Road",                               x: 720, y: 160 },
  { id: "t1", type: "txn",     label: "₹4.2L transfer",                        x: 460, y: 20  },
  { id: "st1", type: "station", label: "PS Cubbon",                            x: 780, y: 380 },
];

interface RawEdge { a: string; b: string; strength: number; label?: string }
const rawEdges: RawEdge[] = [
  { a: "s1", b: "s2", strength: 0.9, label: "known" },
  { a: "s1", b: "s3", strength: 0.7, label: "affiliate" },
  { a: "s1", b: "car1", strength: 0.8, label: "owns" },
  { a: "s1", b: "p1", strength: 0.95, label: "primary" },
  { a: "s2", b: "p2", strength: 0.85 },
  { a: "s2", b: "a1", strength: 0.6, label: "resides" },
  { a: "s3", b: "t1", strength: 0.55, label: "beneficiary" },
  { a: "s3", b: "a2", strength: 0.7 },
  { a: "car1", b: "st1", strength: 0.4, label: "seized" },
  { a: "v1", b: "a1", strength: 0.65 },
  { a: "v1", b: "s2", strength: 0.5, label: "assaulted" },
  { a: "p1", b: "p2", strength: 0.75, label: "CDR" },
];

const filterMap: Record<string, NType[] | null> = {
  All: null,
  Suspects: ["suspect", "gang"],
  Victims: ["victim"],
  Vehicles: ["vehicle"],
  Phones: ["phone"],
  Addresses: ["address"],
  Gangs: ["gang"],
  Financial: ["txn"],
};

export function NetworkFlow({ filter = "All" }: { filter?: string }) {
  const allow = filterMap[filter] ?? null;

  const nodes: Node[] = useMemo(() => raw.map((n) => {
    const s = style[n.type];
    const dimmed = allow && !allow.includes(n.type);
    return {
      id: n.id,
      position: { x: n.x, y: n.y },
      data: { label: <NodeChip label={n.label} hint={n.hint} type={n.type} /> },
      style: {
        border: `2px solid ${s.color}`,
        background: "rgba(15,25,45,0.85)",
        color: "#e6eef8",
        borderRadius: 14,
        padding: 8,
        minWidth: 140,
        boxShadow: `0 0 22px ${s.color}44`,
        opacity: dimmed ? 0.25 : 1,
      },
    };
  }), [allow]);

  const edges: Edge[] = useMemo(() => rawEdges.map((e, i) => {
    const src = raw.find((n) => n.id === e.a)!;
    const dst = raw.find((n) => n.id === e.b)!;
    const dimmed = allow && !(allow.includes(src.type) && allow.includes(dst.type));
    return {
      id: `e${i}`,
      source: e.a,
      target: e.b,
      label: e.label,
      animated: e.strength > 0.7,
      style: { stroke: "#4fa8ff", strokeWidth: 1 + e.strength * 2.6, opacity: dimmed ? 0.15 : 0.85 },
      labelStyle: { fill: "#9fb3cc", fontSize: 10 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#4fa8ff" },
    };
  }), [allow]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      minZoom={0.4}
      maxZoom={2.2}
      proOptions={{ hideAttribution: true }}
      colorMode="dark"
    >
      <Background gap={24} color="#1e2a44" />
      <MiniMap pannable zoomable nodeColor={(n) => (n.style?.borderColor as string) ?? "#4fa8ff"} maskColor="rgba(6,14,28,0.65)" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

function NodeChip({ label, hint, type }: { label: string; hint?: string; type: NType }) {
  const s = style[type];
  const Icon = s.icon;
  return (
    <div className="flex items-center gap-2 text-left">
      <span className="grid place-items-center h-7 w-7 rounded-lg" style={{ background: `${s.color}22`, color: s.color }}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="leading-tight">
        <div className="text-[12px] font-medium text-white">{label}</div>
        <div className="text-[9px] uppercase tracking-widest" style={{ color: s.color }}>{s.label}{hint ? ` · ${hint}` : ""}</div>
      </div>
    </div>
  );
}