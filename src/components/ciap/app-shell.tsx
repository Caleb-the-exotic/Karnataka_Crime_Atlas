import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Map as MapIcon, FolderSearch, Brain, FileText, Sparkles, Flame, BarChart3,
  Upload, Settings, Bell, Command, CircleDot,
  Activity, Zap, ChevronRight, Keyboard,
  X, Send, Menu, LogIn, ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/ciap/i18n";
import { Toaster } from "@/components/ui/sonner";
import { districtGeo, incidents, crimeCategoryList, hotspots } from "@/lib/ciap/geo";
import { askMultiAI } from "@/lib/ciap/ai-service";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, kbd: "g d" },
  { to: "/crime-map", label: "Crime Map", icon: MapIcon, kbd: "g m" },
  { to: "/investigation", label: "Investigation Hub", icon: FolderSearch, kbd: "g i" },
  { to: "/intelligence", label: "Analytics", icon: BarChart3, kbd: "g n" },
  { to: "/reports", label: "Reports", icon: FileText, kbd: "g r" },
  { to: "/data-import", label: "Data Import", icon: Upload, kbd: "g x" },
  { to: "/settings", label: "Settings", icon: Settings, kbd: "g ," },
] as const;

type NavRoute = (typeof nav)[number]["to"];

/* ------------------------------------------------------------------ Auth */

interface User {
  name: string;
  email: string;
  avatar: string;
  initials: string;
}

/** Decode a Google Identity JWT credential to extract profile info. */
function decodeGoogleJwt(credential: string): { name: string; email: string; picture: string } {
  try {
    const payload = JSON.parse(atob(credential.split(".")[1]));
    return {
      name: payload.name || payload.email || "Google User",
      email: payload.email || "",
      picture: payload.picture || "",
    };
  } catch {
    return { name: "Google User", email: "", picture: "" };
  }
}

function makeInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  /** Called after Google GIS returns a credential JWT. */
  const loginWithGoogle = (credential: string) => {
    const { name, email, picture } = decodeGoogleJwt(credential);
    setUser({ name, email, avatar: picture, initials: makeInitials(name) });
  };

  /** Called for the hardcoded Admin account. */
  const loginAsAdmin = () => {
    setUser({ name: "Admin", email: "admin@ciap.ksp.gov.in", avatar: "", initials: "AD" });
  };

  const logout = () => setUser(null);
  return { user, loginWithGoogle, loginAsAdmin, logout };
}

/* ---------------------------------------------------------------- Shell */

export function AppShell({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => new Date());
  const [cmdOpen, setCmdOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const auth = useAuth();
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
      <TopBar
        now={now}
        onCmd={() => setCmdOpen(true)}
        onHelp={() => setHelpOpen(true)}
        onAi={() => setAiOpen(true)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        user={auth.user}
        onLoginClick={() => setLoginOpen(true)}
        onLogout={auth.logout}
      />
      <div className="relative z-10 flex w-full pt-16">
        <Sidebar now={now} open={sidebarOpen} />
        <main id="main" className="flex-1 min-w-0 px-6 py-6">{children}</main>
      </div>
      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} onNavigate={(to) => { setCmdOpen(false); goto(to); }} onAskAI={(q) => { setCmdOpen(false); setAiOpen(true); (window as any).__ciapAI?.ask?.(q); }} />}
      {helpOpen && <ShortcutsModal onClose={() => setHelpOpen(false)} />}
      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onLoginGoogle={(credential) => { auth.loginWithGoogle(credential); setLoginOpen(false); }}
          onLoginAdmin={() => { auth.loginAsAdmin(); setLoginOpen(false); }}
        />
      )}
      <FloatingAI open={aiOpen} onOpenChange={setAiOpen} />
      <Toaster richColors position="top-right" theme="system" />
    </div>
  );
}

/* --------------------------------------------------------------- TopBar */

interface TopBarProps {
  now: Date;
  onCmd: () => void;
  onHelp: () => void;
  onAi: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

function TopBar({ now, onCmd, onHelp, onAi, sidebarOpen, onToggleSidebar, user, onLoginClick, onLogout }: TopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-border/60 backdrop-blur-2xl bg-background/70">
      <div className="relative flex h-full items-center justify-between px-4">

        {/* Hamburger */}
        <button
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="rounded-xl border border-border/60 p-2 hover:border-primary/60 hover:bg-primary/10 transition z-10"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Absolutely Centred Title — Fixed position across all pages & auth states */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-3 select-none pointer-events-none z-10">
          <ChevronLeft className="h-6 w-6 text-primary shrink-0" />
          <span className="italic font-bold tracking-wider text-xl text-foreground whitespace-nowrap" style={{ fontFamily: '"Geist", sans-serif' }}>Karnataka CIAP</span>
          <ChevronRightIcon className="h-6 w-6 text-primary shrink-0" />
        </div>

        {/* User area */}
        <div className="z-10">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 pl-2 pr-3 py-1.5 hover:border-primary/50 transition"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-7 w-7 rounded-lg object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center text-[11px] font-bold text-primary-foreground">
                    {user.initials}
                  </div>
                )}
                <div className="hidden md:block text-xs leading-tight text-left">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground text-[10px]">SCRB · Cmd Ctr</div>
                </div>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-xl p-2 z-50">
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border/40 mb-1">{user.email}</div>
                  <button
                    onClick={() => { setProfileOpen(false); onLogout(); }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-secondary/60 text-destructive transition"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20 transition"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

/* We need ChevronLeft locally */
function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

/* -------------------------------------------------------------- Sidebar */

function Sidebar({ now, open }: { now: Date; open: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const time = now.toLocaleTimeString("en-IN", { hour12: false });
  const date = now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return (
    <aside
      className={cn(
        "sticky top-16 h-[calc(100vh-4rem)] shrink-0 border-r border-border/60 bg-sidebar/60 backdrop-blur-xl flex flex-col transition-all duration-300 overflow-hidden",
        open ? "w-64" : "w-0 border-r-0"
      )}
    >
      <nav className="flex-1 flex flex-col gap-0.5 p-3 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition whitespace-nowrap",
                active
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground border border-transparent"
              )}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-primary rounded-full glow-primary" />}
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRightIcon className="h-3.5 w-3.5 opacity-60 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/60 bg-sidebar-accent/10">
        {/* Clock + Notifications on one row */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-mono text-primary text-glow text-sm font-semibold whitespace-nowrap">{time} IST</span>
            <span className="text-muted-foreground text-[11px] whitespace-nowrap">{date}</span>
          </div>
          <button className="relative shrink-0 rounded-xl border border-border/60 bg-card/60 p-2 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/70 hover:border-primary/50 transition">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] flex items-center justify-center text-destructive-foreground font-bold">7</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------- Login Modal */

function LoginModal({ onClose, onLoginGoogle, onLoginAdmin }: {
  onClose: () => void;
  onLoginGoogle: (credential: string) => void;
  onLoginAdmin: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Login"
    >
      <div
        className="w-[420px] max-w-[92vw] rounded-2xl border border-primary/40 bg-popover/95 shadow-2xl glow-primary overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Sign in to CIAP</span>
            <span className="text-xs text-muted-foreground mt-0.5">Karnataka Crime Intelligence & Analytics Platform</span>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <LoginModalBody onLoginGoogle={onLoginGoogle} onLoginAdmin={onLoginAdmin} />
      </div>
    </div>
  );
}

function LoginModalBody({ onLoginGoogle, onLoginAdmin }: {
  onLoginGoogle: (credential: string) => void;
  onLoginAdmin: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError("Please enter username and password."); return; }
    if (username === "Admin" && password === "Admin@123") {
      onLoginAdmin();
    } else {
      setError("Invalid credentials. Use Admin / Admin@123.");
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    const CLIENT_ID = "597310670290-n2jllrtic6a3gp2b77bqcol6s7ov1gjv.apps.googleusercontent.com";

    const initAndPrompt = () => {
      (window as any).google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response: { credential: string }) => {
          setGoogleLoading(false);
          if (response.credential) {
            onLoginGoogle(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      (window as any).google.accounts.id.prompt((notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => {
        // If One Tap was suppressed, fall back to renderButton flow
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const btn = document.getElementById("__ciap_google_btn_target");
          if (btn) {
            (window as any).google.accounts.id.renderButton(btn, {
              theme: "outline",
              size: "large",
              width: btn.offsetWidth,
            });
          }
        }
        setGoogleLoading(false);
      });
    };

    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      initAndPrompt();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initAndPrompt;
      script.onerror = () => setGoogleLoading(false);
      document.head.appendChild(script);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Username / Password form */}
      <form onSubmit={handleCredentialLogin} className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            placeholder="e.g. Admin"
            className="w-full rounded-xl border border-border bg-input/60 px-3 py-2 text-sm outline-none focus:border-primary transition"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="••••••••"
            className="w-full rounded-xl border border-border bg-input/60 px-3 py-2 text-sm outline-none focus:border-primary transition"
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition"
        >
          Sign In
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-[10px] text-muted-foreground">OR</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      {/* Google sign-in — renders Google's real button after script loads */}
      <div id="__ciap_google_btn_target" className="w-full min-h-[44px]" />
      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/50 px-4 py-3 text-sm font-medium transition disabled:opacity-60"
      >
        {googleLoading ? (
          <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        ) : (
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        Continue with Google
      </button>

      <p className="text-[10px] text-center text-muted-foreground">
        By signing in you agree to the KSP CIAP usage policy.
      </p>
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
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q, ts: Date.now() }]);
    setBusy(true);
    try {
      const answer = await askMultiAI(q);
      setMessages((m) => [...m, { role: "assistant", content: answer, ts: Date.now() }]);
    } catch {
      const fallback = await answerFromDashboard(q);
      setMessages((m) => [...m, { role: "assistant", content: fallback, ts: Date.now() }]);
    } finally {
      setBusy(false);
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
        className="fixed bottom-6 right-6 z-30 h-12 w-12 flex items-center justify-center rounded-full border border-primary/50 bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-xl glow-primary animate-float"
      >
        <Sparkles className="h-5 w-5" />
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