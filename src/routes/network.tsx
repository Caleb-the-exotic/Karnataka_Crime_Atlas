import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader, Panel, Chip, Filters } from "@/components/ciap/primitives";
import { ClientOnly } from "@/components/ciap/client-only";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, lazy, useMemo, useState, type ComponentType } from "react";

export const Route = createFileRoute("/network")({
  beforeLoad: () => { throw redirect({ to: "/investigation" }); },
});

const NetworkFlow = lazy(() => import("@/components/ciap/network-flow").then((m) => ({ default: m.NetworkFlow }))) as ComponentType<{ filter?: string }>;

export function NetworkPage() {
  const [filter, setFilter] = useState("All");
  const stats = useMemo(() => ({ nodes: 11, edges: 12 }), []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="LINK ANALYSIS"
        title="Criminal Network Graph"
        description="Interactive React Flow force-directed graph — drag, zoom, minimap and filter nodes across suspects, vehicles, phones, addresses, gangs and financial trails."
        actions={<Chip tone="primary">{stats.nodes} nodes · {stats.edges} edges</Chip>}
      />
      <Panel title="Filters">
        <Filters items={["All", "Suspects", "Victims", "Vehicles", "Phones", "Addresses", "Gangs", "Financial"]} value={filter} onChange={setFilter} />
      </Panel>
      <Panel title="Network Graph">
        <div className="h-[620px] w-full rounded-xl border border-border/60 overflow-hidden bg-[radial-gradient(ellipse_at_center,oklch(0.22_0.05_240)_0%,oklch(0.14_0.03_250)_70%)]">
          <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <NetworkFlow filter={filter} />
            </Suspense>
          </ClientOnly>
        </div>
      </Panel>
    </div>
  );
}