import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { EChart } from "@/components/ciap/echart";
import { correlationOption, radarOption, parallelOption, socioIndicators } from "@/lib/ciap/chart-options";
import { districtGeo } from "@/lib/ciap/geo";

export const Route = createFileRoute("/sociology")({
  beforeLoad: () => { throw redirect({ to: "/intelligence" }); },
});

export function SociologyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SOCIOLOGY"
        title="Sociological Analytics"
        description="Correlate crime intensity with demographic, economic and infrastructure indicators across Karnataka."
        actions={<Chip tone="primary">{socioIndicators.length} indicators · {districtGeo.length} districts</Chip>}
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <EChart title="Correlation Matrix" subtitle="Pearson r · socio-economic vs crime" option={correlationOption()} height={420} />
        <EChart title="District Radar" subtitle="Multi-indicator comparison" option={radarOption()} height={420} />
        <EChart title="Parallel Coordinates" subtitle="Districts across all indicators" option={parallelOption()} height={420} className="xl:col-span-2" />
      </div>
      <Panel title="Interpretation">
        <p className="text-sm text-muted-foreground">
          Districts with higher unemployment and lower literacy consistently exhibit elevated theft and assault
          incidence, while urban density correlates with cyber-fraud. These signals feed the predictive-intelligence
          module and inform patrol allocation.
        </p>
      </Panel>
    </div>
  );
}