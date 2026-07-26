import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type HubTab = { id: string; label: string; icon?: React.ComponentType<{ className?: string }> };

export function HubTabs({ tabs, value, onChange }: { tabs: HubTab[]; value: string; onChange: (id: string) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Section tabs"
      className="sticky top-16 z-20 -mx-6 px-6 py-2 backdrop-blur-xl bg-background/70 border-b border-border/60"
    >
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = t.id === value;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition",
                active
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TabPanel({ active, children }: { active: boolean; children: ReactNode }) {
  if (!active) return null;
  return <div className="animate-in fade-in duration-200">{children}</div>;
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="opacity-50">/</span>}
          <span className={i === items.length - 1 ? "text-foreground" : ""}>{it.label}</span>
        </span>
      ))}
    </nav>
  );
}