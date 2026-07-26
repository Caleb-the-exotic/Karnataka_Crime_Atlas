import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Map as MapIcon, FolderSearch, Brain, FileText, Sparkles, Flame, BarChart3,
  Upload, Settings, Search, Bell, Shield, Command, CircleDot, Radio,
  Cpu, CloudSun, Activity, Zap, ChevronRight, Sun, Moon, Languages, Keyboard,
  X, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { liveAlerts } from "@/lib/ciap-data";
import { useTheme } from "@/lib/ciap/theme";
import { useI18n } from "@/lib/ciap/i18n";
import { Toaster } from "@/components/ui/sonner";
import { districtGeo, incidents, crimeCategoryList, hotspots } from "@/lib/ciap/geo";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, kbd: "g d" },
  { to: "/crime-map", label: "Crime Map", icon: MapIcon, kbd: "g m" },
  { to: "/investigation", label: "Investigation Hub", icon: FolderSearch, kbd: "g i" },
  { to: "/intelligence", label: "Intelligence", icon: Brain, kbd: "g n" },
  { to: "/reports", label: "Reports", icon: FileText, kbd: "g r" },
  { to: "/data-import", label: "Data Import", icon: Upload, kbd: "g x" },
  { to: "/settings", label: "Settings", icon: Settings, kbd: "g ," },
] as const;

type NavRoute = (typeof nav)[number]["to"];

export function AppShell({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => new Date());
  const [cmdOpen, setCmdOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const navigate = useNavigate();
  const goto = useMemo(() => (to: string) => navigate({ to: to as NavRoute }), [navigate]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    let prefix: string | null = null;
    let prefixTimer: number | null = null;
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
        return;
      }
      if (typing) return;
      if (e.key === "?" || (e.shiftKey && e.key === "/")) { e.preventDefault(); setHelpOpen(true); return; }
      if (e.key.toLowerCase() === "a" && !e.metaKey && !e.ctrlKey) { setAiOpen(true); return; }
      if (prefix === "g") {
        const match = nav.find((n) => n.kbd === `g ${e.key.toLowerCase()}`);
        prefix = null;
        if (prefixTimer) { window.clearTimeout(prefixTimer); prefixTimer = null; }
        if (match) { e.preventDefault(); goto(match.to); }
        return;
      }
      if (e.key.toLowerCase() === "g") {
        prefix = "g";
        prefixTimer = window.setTimeout(() => { prefix = null; }, 900);
      }
    };
    window.addEventListener("keydown", key);
    return () => { clearInterval(t); window.removeEventListener("keydown", key); if (prefixTimer) window.clearTimeout(prefixTimer); };
  }, [goto]);

  return (
    <div className="relative min-h-screen w-full text-foreground">
      <TopBar now={now} onCmd={() => setCmdOpen(true)} onHelp={() => setHelpOpen(true)} onAi={() => setAiOpen(true)} />
      <div className="relative z-10 flex w-full pt-16">
        <Sidebar />
        <main id="main" className="flex-1 min-w-0 px-6 py-6">{children}</main>
        <RightPanel />
      </div>
      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} onNavigate={(to) => { setCmdOpen(false); goto(to); }} onAskAI={(q) => { setCmdOpen(false); setAiOpen(true); (window as any).__ciapAI?.ask?.(q); }} />}
      {helpOpen && <ShortcutsModal onClose={() => setHelpOpen(false)} />}
      <FloatingAI open={aiOpen} onOpenChange={setAiOpen} />
      <Toaster richColors position="top-right" theme="system" />
    </div>
  );
}

function TopBar({ now, onCmd, onHelp, onAi }: { now: Date; onCmd: () => void; onHelp: () => void; onAi: () => void }) {
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useI18n();
  const time = now.toLocaleTimeString("en-IN", { hour12: false });
  const date = now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-border/60 backdrop-blur-2xl bg-background/70">
      <div className="flex h-full items-center gap-4 px-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/40 glow-primary">
            <Shield className="h-5 w-5 text-primary" />
            <span className="absolute inset-0 rounded-xl border border-primary/40 animate-pulse-ring" />
          </div>
          <div className="leading-tight">
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">{t("app.org")}</div>
            <div className="text-sm font-semibold tracking-wide text-glow">CIAP <span className="text-muted-foreground font-normal">{t("app.title")}</span></div>
          </div>
        </div>

        <div className="flex-1" />

        <button
          onClick={onCmd}
          className="hidden md:flex items-center gap-3 w-[380px] rounded-xl border border-border bg-input/60 px-3 py-2 text-sm text-muted-foreground hover:border-primary/60 transition"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">{t("top.search")}</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border">⌘K</kbd>
        </button>

        <button onClick={onAi} className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20 transition">
          <Sparkles className="h-4 w-4" />
          <span className="hidden lg:inline">{t("top.assistant")}</span>
        </button>

        <button onClick={toggle} aria-label="Toggle theme" title={theme === "dark" ? "Switch to light" : "Switch to dark"} className="rounded-xl border border-border p-2 hover:border-primary/60 transition">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button onClick={() => setLang(lang === "en" ? "kn" : "en")} aria-label="Toggle language" title="English / ಕನ್ನಡ" className="rounded-xl border border-border px-2 py-2 text-xs hover:border-primary/60 transition flex items-center gap-1">
          <Languages className="h-4 w-4" /><span className="font-mono">{lang.toUpperCase()}</span>
        </button>
        <button onClick={onHelp} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)" className="rounded-xl border border-border p-2 hover:border-primary/60 transition">
          <Keyboard className="h-4 w-4" />
        </button>

        <StatusPill />

        <div className="hidden md:flex flex-col items-end leading-tight text-xs">
          <span className="font-mono text-primary text-glow">{time} IST</span>
          <span className="text-muted-foreground">{date}</span>
        </div>

        <button className="relative rounded-xl border border-border p-2 hover:border-primary/60 transition">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] flex items-center justify-center text-destructive-foreground">7</span>
        </button>

        <div className="flex items-center gap-2 rounded-xl border border-border pl-2 pr-3 py-1.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center text-[11px] font-bold text-primary-foreground">DR</div>
          <div className="hidden xl:block text-xs leading-tight">
            <div className="font-medium">DIG R. Kumar</div>
            <div className="text-muted-foreground">SCRB · Cmd Ctr</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatusPill() {
  return (
    <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs">
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse-ring" />
        <span className="relative rounded-full bg-emerald-400 h-2 w-2" />
      </span>
      <span className="text-muted-foreground">Systems</span>
      <span className="font-medium text-emerald-400">OPERATIONAL</span>
    </div>
  );
}

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border/60 bg-sidebar/60 backdrop-blur-xl overflow-y-auto">
      <nav className="flex flex-col gap-0.5 p-3">
        <div className="px-2 py-2 text-[10px] tracking-[0.25em] text-muted-foreground uppercase">Command Modules</div>
        {nav.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground border border-transparent"
              )}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-primary rounded-full glow-primary" />}
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
            </Link>
          );
        })}

        <div className="mt-4 rounded-xl border border-border/60 bg-secondary/40 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Cpu className="h-3.5 w-3.5" /> AI Engine
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-input overflow-hidden">
            <div className="h-full w-[78%] bg-gradient-to-r from-primary via-accent to-primary animate-glow-pulse" />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>Neural Load</span><span className="text-primary">78%</span>
          </div>
        </div>
      </nav>
    </aside>
  );
}

function RightPanel() {
  return (
    <aside className="sticky top-16 hidden xl:block h-[calc(100vh-4rem)] w-80 shrink-0 border-l border-border/60 bg-sidebar/40 backdrop-blur-xl overflow-y-auto p-4 space-y-4">
      <PanelSection icon={<Radio className="h-4 w-4 text-destructive" />} title="Live Alerts" badge="LIVE">
        <div className="space-y-2">
          {liveAlerts.map((a) => (
            <div key={a.id} className="rounded-lg border border-border/60 bg-card/60 p-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[10px] font-semibold tracking-wider uppercase",
                  a.level === "critical" && "text-destructive",
                  a.level === "high" && "text-orange-400",
                  a.level === "medium" && "text-yellow-400",
                )}>{a.level}</span>
                <span className="text-muted-foreground">{a.ago} ago</span>
              </div>
              <div className="mt-1 font-medium">{a.title}</div>
              <div className="text-muted-foreground">{a.where}</div>
            </div>
          ))}
        </div>
      </PanelSection>

      <PanelSection icon={<Sparkles className="h-4 w-4 text-primary" />} title="AI Recommendations">
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex gap-2"><Zap className="h-3.5 w-3.5 text-primary mt-0.5" /> Increase patrol density in Whitefield sector (18:00–02:00)</li>
          <li className="flex gap-2"><Zap className="h-3.5 w-3.5 text-primary mt-0.5" /> Flag repeat offender cluster near MG Road</li>
          <li className="flex gap-2"><Zap className="h-3.5 w-3.5 text-primary mt-0.5" /> Deploy cyber unit to Mangaluru — fraud spike +38%</li>
        </ul>
      </PanelSection>

      <PanelSection icon={<CloudSun className="h-4 w-4 text-accent" />} title="Environment">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <MetricTile label="Weather" value="28°C" sub="Bengaluru · Clear" />
          <MetricTile label="Traffic" value="Moderate" sub="+12% vs avg" />
          <MetricTile label="Uptime" value="99.98%" sub="Systems nominal" />
          <MetricTile label="Data feed" value="LIVE" sub="12,480 evt/min" />
        </div>
      </PanelSection>

      <PanelSection icon={<Activity className="h-4 w-4 text-emerald-400" />} title="System Health">
        {[
          { l: "API Gateway", v: 98 },
          { l: "ML Cluster", v: 82 },
          { l: "Data Ingest", v: 91 },
          { l: "Geo Services", v: 76 },
        ].map((m) => (
          <div key={m.l} className="mb-2">
            <div className="flex justify-between text-[11px]"><span>{m.l}</span><span className="text-primary">{m.v}%</span></div>
            <div className="h-1 rounded-full bg-input overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-primary" style={{ width: `${m.v}%` }} />
            </div>
          </div>
        ))}
      </PanelSection>
    </aside>
  );
}

function PanelSection({ icon, title, badge, children }: { icon: ReactNode; title: string; badge?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-lg p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          {icon}<span>{title}</span>
        </div>
        {badge && <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive border border-destructive/40 animate-glow-pulse">{badge}</span>}
      </div>
      {children}
    </section>
  );
}

function MetricTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-glow">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}

/* ------------------------------------------------------ Command Palette */

interface CmdItem {
  id: string;
  label: string;
  hint?: string;
  section: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

function CommandPalette({ onClose, onNavigate, onAskAI }: { onClose: () => void; onNavigate: (to: string) => void; onAskAI: (q: string) => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  const items: CmdItem[] = useMemo(() => {
    const navItems: CmdItem[] = nav.map((n) => ({
      id: `nav:${n.to}`, label: n.label, hint: n.kbd, section: "Navigate", icon: n.icon, run: () => onNavigate(n.to),
    }));
    const districts: CmdItem[] = districtGeo.slice(0, 30).map((d) => ({
      id: `dist:${d.name}`, label: `District · ${d.name}`, hint: `${d.crimes.toLocaleString()} incidents · risk ${d.risk}`, section: "Districts", icon: MapIcon, run: () => onNavigate("/crime-map"),
    }));
    const hs: CmdItem[] = hotspots.map((h) => ({
      id: `hs:${h.id}`, label: `Hotspot · ${h.name}`, hint: `${h.dominantCrime} · ${h.incidents30d} incidents`, section: "Hotspots", icon: Flame, run: () => onNavigate("/hotspots"),
    }));
    const cats: CmdItem[] = crimeCategoryList.map((c) => ({
      id: `cat:${c}`, label: `Category · ${c}`, section: "Crime Categories", icon: BarChart3, run: () => onNavigate("/crime-analytics"),
    }));
    return [...navItems, ...districts, ...hs, ...cats];
  }, [onNavigate]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items.slice(0, 24);
    const needle = q.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(needle) || (i.hint ?? "").toLowerCase().includes(needle)).slice(0, 40);
  }, [items, q]);

  useEffect(() => setIdx(0), [q]);

  const grouped = useMemo(() => {
    const g = new Map<string, CmdItem[]>();
    filtered.forEach((i) => { if (!g.has(i.section)) g.set(i.section, []); g.get(i.section)!.push(i); });
    return g;
  }, [filtered]);

  const flat = filtered;

  return (
    <div className="fixed inset-0 z-50 grid place-items-start pt-24 bg-background/70 backdrop-blur-sm" onClick={onClose} role="dialog" aria-label="Command palette">
      <div className="mx-auto w-[640px] max-w-[92vw] rounded-2xl border border-primary/40 bg-popover/95 shadow-2xl glow-primary overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border p-3">
          <Command className="h-4 w-4 text-primary" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") { onClose(); return; }
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, flat.length - 1)); return; }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); return; }
              if (e.key === "Enter") {
                e.preventDefault();
                const it = flat[idx];
                if (it) it.run();
                else if (q.trim()) onAskAI(q.trim());
              }
            }}
            placeholder="Search modules, districts, hotspots, categories — or ask the AI…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2 text-sm">
          {flat.length === 0 && (
            <button onClick={() => q.trim() && onAskAI(q.trim())} className="w-full flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-secondary/60">
              <Sparkles className="h-4 w-4 text-primary" /> Ask CIAP AI: <span className="font-medium truncate">"{q}"</span>
            </button>
          )}
          {[...grouped.entries()].map(([section, list]) => (
            <div key={section} className="mb-1">
              <div className="px-3 pt-2 pb-1 text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{section}</div>
              {list.map((it) => {
                const active = flat.indexOf(it) === idx;
                const Icon = it.icon;
                return (
                  <button
                    key={it.id}
                    onMouseEnter={() => setIdx(flat.indexOf(it))}
                    onClick={it.run}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left",
                      active ? "bg-primary/15 text-primary" : "hover:bg-secondary/60",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.hint && <span className="text-[10px] text-muted-foreground truncate max-w-[45%]">{it.hint}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
          <span>↑↓ navigate · Enter select · Esc close</span>
          <span>{flat.length} results</span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Shortcuts help */

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm" onClick={onClose} role="dialog" aria-label="Keyboard shortcuts">
      <div className="w-[560px] max-w-[92vw] rounded-2xl border border-primary/40 bg-popover/95 shadow-2xl glow-primary" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-3">
          <div className="flex items-center gap-2"><Keyboard className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">Keyboard Shortcuts</span></div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-6 p-4 text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Global</div>
            <Row k="⌘ / Ctrl + K">Open command palette</Row>
            <Row k="A">Open AI assistant</Row>
            <Row k="?">Show this help</Row>
            <Row k="Esc">Close overlay</Row>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Navigate ("g" then…)</div>
            {nav.slice(0, 10).map((n) => (
              <Row key={n.to} k={n.kbd}>{n.label}</Row>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span>{children}</span>
      <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border font-mono">{k}</kbd>
    </div>
  );
}

/* -------------------------------------------------- Floating AI Assistant */

interface AIMessage { role: "user" | "assistant"; content: string; ts: number }

function FloatingAI({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: "assistant", content: "Namaskara. I'm CIAP AI — ask me about districts, hotspots, categories, trends or predictions.", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const ask = useMemo(() => async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", content: q, ts: Date.now() }]);
    setBusy(true);
    try {
      const answer = await answerFromDashboard(q);
      setMessages((m) => [...m, { role: "assistant", content: answer, ts: Date.now() }]);
    } finally {
      setBusy(false);
      setInput("");
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }));
    }
  }, []);

  useEffect(() => {
    (window as any).__ciapAI = { ask: (q: string) => { onOpenChange(true); void ask(q); } };
    return () => { delete (window as any).__ciapAI; };
  }, [ask, onOpenChange]);

  return (
    <>
      <button
        onClick={() => onOpenChange(!open)}
        aria-label="Open AI assistant"
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full border border-primary/50 bg-gradient-to-br from-primary to-accent px-4 py-3 text-sm font-medium text-primary-foreground shadow-xl glow-primary animate-float"
      >
        <Sparkles className="h-4 w-4" />
        <span>Ask CIAP</span>
        <CircleDot className="h-3 w-3 animate-glow-pulse" />
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[420px] max-w-[94vw] rounded-2xl border border-primary/40 bg-popover/95 shadow-2xl glow-primary flex flex-col overflow-hidden" role="dialog" aria-label="AI assistant">
          <div className="flex items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold">CIAP AI Assistant</span>
              <span className="text-[10px] text-muted-foreground">context-aware</span>
            </div>
            <button onClick={() => onOpenChange(false)} aria-label="Close" className="rounded-md p-1 hover:bg-secondary"><X className="h-4 w-4" /></button>
          </div>
          <div ref={scrollRef} className="h-80 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.map((m) => (
              <div key={m.ts + m.role} className={cn("rounded-xl px-3 py-2 max-w-[85%] whitespace-pre-wrap", m.role === "user" ? "ml-auto bg-primary/20 text-foreground border border-primary/40" : "bg-secondary/60 border border-border")}>
                {m.content}
              </div>
            ))}
            {busy && <div className="text-xs text-muted-foreground">Thinking…</div>}
          </div>
          <div className="border-t border-border p-2 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              placeholder="Ask about a district, hotspot or category…"
              className="flex-1 rounded-lg bg-input/60 border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button onClick={() => ask(input)} disabled={busy || !input.trim()} aria-label="Send" className="rounded-lg bg-primary text-primary-foreground p-2 disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* Context-aware responder driven by the real geo/incident dataset. */
async function answerFromDashboard(q: string): Promise<string> {
  const lower = q.toLowerCase();
  const district = districtGeo.find((d) => lower.includes(d.name.toLowerCase()));
  const cat = crimeCategoryList.find((c) => lower.includes(c.toLowerCase()));
  const parts: string[] = [];

  if (district) {
    const local = incidents.filter((i) => i.district === district.name);
    const share = ((local.length / incidents.length) * 100).toFixed(1);
    parts.push(`District ${district.name}: ${district.crimes.toLocaleString()} annual incidents, risk index ${district.risk}, population ${(district.population / 1e6).toFixed(2)}M.`);
    parts.push(`Recent 90d sample: ${local.length} incidents (${share}% of state).`);
  }
  if (cat) {
    const list = incidents.filter((i) => i.category === cat);
    const byDist = new Map<string, number>();
    list.forEach((i) => byDist.set(i.district, (byDist.get(i.district) ?? 0) + 1));
    const top = [...byDist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    parts.push(`${cat}: ${list.length} incidents in the last 90d. Hotspots: ${top.map(([d, n]) => `${d} (${n})`).join(", ")}.`);
  }
  if (/hotspot|predict|risk/.test(lower)) {
    const top = hotspots.slice().sort((a, b) => b.intensity - a.intensity).slice(0, 3);
    parts.push(`Top hotspots by intensity: ${top.map((h) => `${h.name} (${h.dominantCrime}, ${(h.intensity * 100).toFixed(0)}%)`).join("; ")}.`);
  }
  if (/trend|last|week|month/.test(lower)) {
    const days = 30;
    const recent = incidents.filter((i) => i.daysAgo < days).length;
    const prev = incidents.filter((i) => i.daysAgo >= days && i.daysAgo < days * 2).length;
    const delta = prev ? (((recent - prev) / prev) * 100).toFixed(1) : "n/a";
    parts.push(`30-day trend: ${recent} incidents vs ${prev} prior 30d (Δ ${delta}%).`);
  }
  if (parts.length === 0) {
    const total = incidents.length;
    const byCat = new Map<string, number>();
    incidents.forEach((i) => byCat.set(i.category, (byCat.get(i.category) ?? 0) + 1));
    const top = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    parts.push(`State overview: ${total} incidents in the last 90 days across ${districtGeo.length} districts.`);
    parts.push(`Top categories: ${top.map(([c, n]) => `${c} (${n})`).join(", ")}.`);
    parts.push(`Try: "hotspots in Bengaluru", "cyber trend", "Mysuru risk".`);
  }
  await new Promise((r) => setTimeout(r, 200));
  return parts.join("\n\n");
}