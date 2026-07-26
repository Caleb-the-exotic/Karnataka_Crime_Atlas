import { useState } from "react";
import { districts } from "@/lib/ciap-data";
import { cn } from "@/lib/utils";

export function KarnatakaMap({ heatmap = true, height = 520 }: { heatmap?: boolean; height?: number }) {
  const [hover, setHover] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const active = sel ?? hover;
  const activeD = districts.find((d) => d.name === active);
  return (
    <div className="relative w-full rounded-2xl border border-border/60 overflow-hidden bg-[radial-gradient(ellipse_at_center,oklch(0.22_0.05_240)_0%,oklch(0.14_0.03_250)_70%)]" style={{ height }}>
      {/* grid */}
      <svg className="absolute inset-0 h-full w-full opacity-40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="oklch(0.72 0.18 235 / 0.15)" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.72 0.18 235 / 0.4)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* stylized Karnataka silhouette */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <path
          d="M 22 20 L 40 15 L 55 18 L 68 22 L 72 32 L 68 42 L 72 52 L 66 62 L 60 72 L 50 80 L 42 84 L 32 82 L 24 74 L 20 62 L 18 52 L 20 40 L 18 30 Z"
          fill="oklch(0.72 0.18 235 / 0.08)"
          stroke="oklch(0.72 0.18 235 / 0.55)"
          strokeWidth="0.4"
          strokeDasharray="0.5 0.5"
        />
      </svg>
      {/* heatmap blobs */}
      {heatmap && districts.map((d) => (
        <div
          key={d.name + "h"}
          className="absolute rounded-full pointer-events-none blur-2xl"
          style={{
            left: `${d.x}%`, top: `${d.y}%`,
            width: `${40 + d.risk / 2}px`, height: `${40 + d.risk / 2}px`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, oklch(${d.risk > 75 ? "0.65 0.24 25" : d.risk > 55 ? "0.75 0.19 60" : "0.72 0.18 235"} / 0.6), transparent 70%)`,
          }}
        />
      ))}
      {/* district markers */}
      {districts.map((d) => (
        <button
          key={d.name}
          onMouseEnter={() => setHover(d.name)}
          onMouseLeave={() => setHover(null)}
          onClick={() => setSel((s) => (s === d.name ? null : d.name))}
          className="absolute -translate-x-1/2 -translate-y-1/2 group"
          style={{ left: `${d.x}%`, top: `${d.y}%` }}
        >
          <span className={cn(
            "relative flex h-3 w-3 items-center justify-center rounded-full border-2",
            d.risk > 75 ? "bg-destructive border-destructive" : d.risk > 55 ? "bg-orange-400 border-orange-400" : "bg-primary border-primary"
          )}>
            <span className={cn(
              "absolute inset-0 rounded-full animate-pulse-ring",
              d.risk > 75 ? "bg-destructive/60" : "bg-primary/60"
            )} />
          </span>
          <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap opacity-70 group-hover:opacity-100">{d.name}</span>
        </button>
      ))}
      {/* scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-primary/10 to-transparent animate-scan" />
      </div>
      {/* HUD */}
      <div className="absolute top-3 left-3 rounded-lg border border-border/60 bg-background/70 backdrop-blur px-3 py-2 text-[10px]">
        <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-glow-pulse" /> KARNATAKA · LIVE FEED</div>
        <div className="text-muted-foreground mt-0.5">15 districts · 1,247 stations</div>
      </div>
      <div className="absolute top-3 right-3 flex gap-1">
        {["Heatmap", "Satellite", "Street"].map((v, i) => (
          <button key={v} className={cn(
            "rounded-md border px-2 py-1 text-[10px] uppercase tracking-wider transition",
            i === 0 ? "border-primary/60 bg-primary/20 text-primary" : "border-border bg-background/60 text-muted-foreground hover:text-primary"
          )}>{v}</button>
        ))}
      </div>
      {activeD && (
        <div className="absolute bottom-3 left-3 w-72 rounded-xl border border-primary/40 bg-popover/95 backdrop-blur-xl p-3 glow-primary">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{activeD.name}</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider",
              activeD.risk > 75 ? "border-destructive/50 text-destructive" : activeD.risk > 55 ? "border-orange-400/50 text-orange-400" : "border-primary/50 text-primary"
            )}>Risk {activeD.risk}</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
            <div><div className="text-muted-foreground">Crimes</div><div className="text-sm font-semibold">{activeD.crimes.toLocaleString()}</div></div>
            <div><div className="text-muted-foreground">Active</div><div className="text-sm font-semibold">{Math.round(activeD.crimes * 0.18)}</div></div>
            <div><div className="text-muted-foreground">Solved</div><div className="text-sm font-semibold">{Math.round(activeD.crimes * 0.62)}</div></div>
          </div>
        </div>
      )}
      {/* time slider */}
      <div className="absolute bottom-3 right-3 w-72 rounded-xl border border-border/60 bg-background/70 backdrop-blur p-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Timeline Playback</span><span className="text-primary">00:00 → NOW</span>
        </div>
        <input type="range" defaultValue={75} className="mt-2 w-full accent-primary" />
      </div>
    </div>
  );
}