import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";

export const Route = createFileRoute("/victims")({
  beforeLoad: () => { throw redirect({ to: "/investigation" }); },
});

export function Victims() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="VICTIM SUPPORT" title="Victim Profiles"
        description="Demographic distribution, vulnerability index and support-service tracking."
        actions={<Chip tone="primary">18,420 records</Chip>} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[["Total victims", "18,420"], ["Assisted", "12,110"], ["Pending support", "3,204"], ["Vulnerable minors", "842"]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-border/60 bg-card/50 p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
            <div className="mt-1 text-2xl font-semibold text-glow tabular-nums">{v}</div>
          </div>
        ))}
      </div>
      <Panel title="Recent Victim Records">
        <table className="w-full text-xs">
          <thead className="text-left text-muted-foreground"><tr>{["ID", "Age", "Gender", "District", "Case Type", "Support"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-t border-border/60">
                <td className="px-3 py-2 font-mono">VIC-{(1420 + i).toString().padStart(5, "0")}</td>
                <td className="px-3 py-2">{18 + (i * 7) % 40}</td>
                <td className="px-3 py-2">{i % 2 ? "F" : "M"}</td>
                <td className="px-3 py-2">Bengaluru Urban</td>
                <td className="px-3 py-2">Assault</td>
                <td className="px-3 py-2"><span className="text-emerald-400">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}