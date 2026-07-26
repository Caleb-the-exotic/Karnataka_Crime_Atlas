import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ title, subtitle, icon, actions, children, className }: {
  title?: string; subtitle?: string; icon?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={cn("relative rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl p-4 overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {icon && <div className="text-primary">{icon}</div>}
            <div>
              {title && <h3 className="text-sm font-semibold tracking-wide">{title}</h3>}
              {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string; title: string; description?: string; actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
      <div>
        {eyebrow && <div className="text-[10px] tracking-[0.3em] uppercase text-primary">{eyebrow}</div>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-glow">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Chip({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "primary" | "danger" | "warn" | "success" }) {
  const tones: Record<string, string> = {
    default: "border-border bg-secondary/50 text-foreground",
    primary: "border-primary/40 bg-primary/10 text-primary",
    danger: "border-destructive/40 bg-destructive/10 text-destructive",
    warn: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
    success: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase", tones[tone])}>{children}</span>;
}

export function Sparkline({ data, tone = "primary" }: { data: number[]; tone?: "primary" | "accent" | "danger" | "success" }) {
  const w = 120, h = 34;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / Math.max(1, max - min)) * h;
    return `${x},${y}`;
  }).join(" ");
  const stroke = {
    primary: "oklch(0.72 0.18 235)",
    accent: "oklch(0.78 0.17 200)",
    danger: "oklch(0.65 0.24 25)",
    success: "oklch(0.68 0.2 155)",
  }[tone];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8">
      <defs>
        <linearGradient id={`sg-${tone}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg-${tone})`} />
    </svg>
  );
}

export function Filters({ items, value, onChange }: { items: string[]; value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((f, i) => {
        const active = value === f;
        return (
          <button
            key={i}
            onClick={() => onChange?.(f)}
            className={
              "rounded-lg border px-2.5 py-1 text-[11px] transition " +
              (active
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/60 hover:text-primary")
            }
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}