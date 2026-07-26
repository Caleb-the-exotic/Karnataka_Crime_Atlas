import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/ciap/primitives";
import { useTheme } from "@/lib/ciap/theme";
import { useI18n } from "@/lib/ciap/i18n";
import { Sun, Moon, Languages, Keyboard } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "CIAP · Settings" }, { name: "description", content: "Platform preferences — theme, language and notifications." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme, toggle } = useTheme();
  const { lang, setLang } = useI18n();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="PREFERENCES" title="Platform Settings" description="Theme, language, notifications and role-based access." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Appearance">
          <div className="space-y-3">
            <button onClick={toggle} className="w-full flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 text-primary p-2.5 text-sm hover:bg-primary/20 transition">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              Switch to {theme === "dark" ? "Light" : "Dark"} Mode
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setTheme("dark")} className={"rounded-lg border p-3 text-sm flex items-center gap-2 " + (theme === "dark" ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-secondary/30")}>
                <Moon className="h-4 w-4" /> Dark
              </button>
              <button onClick={() => setTheme("light")} className={"rounded-lg border p-3 text-sm flex items-center gap-2 " + (theme === "light" ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-secondary/30")}>
                <Sun className="h-4 w-4" /> Light
              </button>
            </div>
          </div>
        </Panel>
        <Panel title="Language">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setLang("en")} className={"rounded-lg border p-3 text-sm flex items-center gap-2 " + (lang === "en" ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-secondary/30")}>
              <Languages className="h-4 w-4" /> English
            </button>
            <button onClick={() => setLang("kn")} className={"rounded-lg border p-3 text-sm flex items-center gap-2 " + (lang === "kn" ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-secondary/30")}>
              <Languages className="h-4 w-4" /> ಕನ್ನಡ
            </button>
          </div>
        </Panel>
        <Panel title="Notifications">
          <div className="space-y-2 text-sm">
            {["Critical alerts (push)", "Daily briefing (email)", "Anomaly digests"].map((l, i) => (
              <label key={l} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 p-3">
                <span>{l}</span>
                <input type="checkbox" defaultChecked={i < 2} className="accent-primary" />
              </label>
            ))}
          </div>
        </Panel>
        <Panel title="Role & Access">
          <div className="text-sm text-muted-foreground">Signed in as <span className="text-foreground font-medium">DIG R. Kumar</span> · Role <span className="text-primary">Command Centre</span> · SCRB Bengaluru.</div>
        </Panel>
        <Panel title="Shortcuts">
          <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))} className="w-full rounded-lg border border-border bg-secondary/30 p-3 text-sm flex items-center justify-center gap-2 hover:border-primary/60 transition">
            <Keyboard className="h-4 w-4" /> View Keyboard Shortcuts
          </button>
        </Panel>
      </div>
    </div>
  );
}