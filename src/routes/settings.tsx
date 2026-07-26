import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/ciap/primitives";
import { useTheme } from "@/lib/ciap/theme";
import { useI18n } from "@/lib/ciap/i18n";
import { Sun, Moon, Languages } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "CIAP · Settings" }, { name: "description", content: "Platform preferences — theme, language and notifications." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useI18n();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="PREFERENCES" title="Platform Settings" description="Theme, language, notifications and role-based access." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Appearance">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setTheme("dark")} className={"rounded-lg border p-3 text-sm flex items-center gap-2 " + (theme === "dark" ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-secondary/30")}>
              <Moon className="h-4 w-4" /> Dark
            </button>
            <button onClick={() => setTheme("light")} className={"rounded-lg border p-3 text-sm flex items-center gap-2 " + (theme === "light" ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-secondary/30")}>
              <Sun className="h-4 w-4" /> Light
            </button>
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
      </div>
    </div>
  );
}