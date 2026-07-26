import { createFileRoute, Link } from "@tanstack/react-router";
import Threads from "@/components/ciap/Threads";
import { liveAlerts } from "@/lib/ciap-data";
import { cn } from "@/lib/utils";
import {
  Shield, Map as MapIcon, Brain, FolderSearch, FileText, Upload,
  ArrowRight, Radio, Activity, Zap,
} from "lucide-react";

export const Route = createFileRoute("/")(
  {
    head: () => ({
      meta: [
        { title: "CIAP · Command Dashboard — Karnataka State Police" },
        { name: "description", content: "Live command-center dashboard for the Karnataka State Police and State Crime Records Bureau." },
        { property: "og:title", content: "CIAP Command Dashboard" },
        { property: "og:description", content: "Live crime intelligence for KSP & SCRB." },
      ],
    }),
    component: Dashboard,
  }
);

const quickLinks = [
  { to: "/crime-map", label: "Crime Map", icon: MapIcon, desc: "Live district heat-map" },
  { to: "/intelligence", label: "Intelligence", icon: Brain, desc: "Analytics & predictions" },
  { to: "/investigation", label: "Investigation Hub", icon: FolderSearch, desc: "Case management" },
  { to: "/reports", label: "Reports", icon: FileText, desc: "Generate & export" },
  { to: "/data-import", label: "Data Import", icon: Upload, desc: "CSV / API ingest" },
];

function Dashboard() {
  return (
    <div className="space-y-10 -mx-6 -mt-6">
      {/* ── Hero / Threads section ─────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 4rem)" }}>
        {/* Threads canvas fills the full hero */}
        <div className="absolute inset-0">
          <Threads amplitude={1} distance={0} enableMouseInteraction color={[0.45, 0.71, 0.92]} />
        </div>

        {/* Overlay gradient so content is readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/80 pointer-events-none" />

        {/* Centred text content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight uppercase" style={{ fontFamily: '"Geist", sans-serif' }}>
            Crime Intelligence Atlas Platform
          </h1>

          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
            Unified live view across <span className="text-foreground font-medium">31 districts</span>,{" "}
            <span className="text-foreground font-medium">1,247 police stations</span> and{" "}
            <span className="text-foreground font-medium">84.5K incidents</span>.
            AI models updated 4 min ago.
          </p>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              to="/crime-map"
              className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition shadow-lg"
            >
              <MapIcon className="h-4 w-4" /> Open Crime Map <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/intelligence"
              className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 text-primary px-5 py-2.5 text-sm font-semibold hover:bg-primary/20 transition"
            >
              <Brain className="h-4 w-4" /> Intelligence Hub
            </Link>
          </div>
        </div>
      </section>

      <div className="px-6 space-y-10">
        {/* ── Quick navigation cards ──────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground">Command Modules</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickLinks.map(({ to, label, icon: Icon, desc }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl p-4 hover:border-primary/50 hover:bg-card/80 transition"
              >
                <div className="h-9 w-9 rounded-xl border border-primary/30 bg-primary/10 grid place-items-center group-hover:bg-primary/20 transition">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition ml-auto mt-auto" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Live Alerts ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-destructive animate-glow-pulse" />
              <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground">Live Alerts</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive border border-destructive/40 animate-glow-pulse font-semibold">LIVE</span>
            </div>
            <span className="text-xs text-muted-foreground">{liveAlerts.length} active</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveAlerts.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "rounded-2xl border bg-card/50 backdrop-blur-xl p-4 text-sm space-y-2 hover:bg-card/70 transition",
                  a.level === "critical" && "border-destructive/40 bg-destructive/5",
                  a.level === "high" && "border-orange-400/30 bg-orange-400/5",
                  a.level === "medium" && "border-yellow-400/30 bg-yellow-400/5",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-widest uppercase",
                      a.level === "critical" && "text-destructive",
                      a.level === "high" && "text-orange-400",
                      a.level === "medium" && "text-yellow-400",
                    )}
                  >
                    {a.level}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{a.ago} ago</span>
                </div>
                <div className="font-semibold leading-tight">{a.title}</div>
                <div className="text-muted-foreground text-xs">{a.where}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── System status bar ───────────────────────────────────── */}
        <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
            {[
              { label: "Total Incidents (State)", value: "84,512", icon: Shield },
              { label: "Active Districts", value: "31 / 31", icon: MapIcon },
              { label: "AI Model Confidence", value: "87%", icon: Brain },
              { label: "Data Feed", value: "12,480 evt/min", icon: Zap },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon className="h-4 w-4 text-primary mb-1" />
                <div className="text-xl font-bold tabular-nums text-glow">{value}</div>
                <div className="text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}