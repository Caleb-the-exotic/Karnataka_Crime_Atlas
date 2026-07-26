import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { suspects } from "@/lib/ciap-data";
import { AlertTriangle, MapPin, Phone, Car, User, Sparkles } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/suspects")({
  beforeLoad: () => { throw redirect({ to: "/investigation" }); },
});

export function Suspects() {
  const s = suspects[0];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="THREAT MANAGEMENT" title="Suspect Profiles"
        description="Risk scoring, known associates, MO patterns, travel history and AI-generated behavior summaries."
        actions={<Chip tone="danger">6 HIGH RISK</Chip>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Watchlist">
          <ul className="space-y-2">
            {suspects.map((x) => (
              <li key={x.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-2.5 cursor-pointer hover:border-primary/60">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-destructive/40 to-primary/30 grid place-items-center text-xs font-bold">{x.name.split(" ").map((n) => n[0]).join("")}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{x.name} <span className="text-muted-foreground text-[10px]">· {x.alias}</span></div>
                  <div className="text-[10px] text-muted-foreground">{x.id} · {x.district}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-destructive tabular-nums">{x.risk}</div>
                  <div className="text-[9px] text-muted-foreground uppercase">{x.status}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={`${s.name} · ${s.id}`} className="lg:col-span-2">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-32 w-32 rounded-2xl bg-gradient-to-br from-destructive/40 via-primary/30 to-accent/30 grid place-items-center border border-primary/40 glow-primary">
                <User className="h-14 w-14 text-foreground/80" />
                <span className="absolute -bottom-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">RISK {s.risk}</span>
              </div>
              <Chip tone="danger">THREAT · CRITICAL</Chip>
              <Chip>Cases: {s.cases}</Chip>
            </div>
            <div className="flex-1 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                {[{ i: MapPin, l: "Last seen", v: "MG Road, Bengaluru · 4h ago" },
                  { i: Phone, l: "Known #", v: "+91 98••4212 · +91 96••7708" },
                  { i: Car, l: "Vehicles", v: "KA-05 MZ 4471 · KA-01 AB 0293" },
                  { i: AlertTriangle, l: "MO", v: "Armed robbery · Night ops" }].map((f) => (
                    <div key={f.l} className="rounded-lg border border-border/60 bg-secondary/30 p-2">
                      <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1"><f.i className="h-3 w-3" />{f.l}</div>
                      <div>{f.v}</div>
                    </div>
                  ))}
              </div>
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary"><Sparkles className="h-3 w-3" /> AI Summary</div>
                <p className="mt-1 text-foreground/90 leading-relaxed">Subject exhibits repeat armed-robbery MO in Bengaluru central zone with a 3.2 day incident cadence. Vehicle KA-05 MZ 4471 was flagged near 4 prior incidents. Predicted next-strike window: <span className="text-primary font-medium">next 72h · Cubbon-MG Road corridor</span>. Recommend surveillance escalation.</p>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Case history · 12 months</div>
                <div className="h-16"><ResponsiveContainer>
                  <LineChart data={Array.from({ length: 12 }, (_, i) => ({ x: i, y: Math.round(2 + Math.sin(i) * 2 + ((i * 13) % 7) / 2) }))}>
                    <Line type="monotone" dataKey="y" stroke="oklch(0.65 0.24 25)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer></div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}