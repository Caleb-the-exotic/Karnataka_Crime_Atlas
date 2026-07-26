import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Brain, TrendingUp, AlertTriangle, HeartPulse, Sparkles, PieChart, LayoutGrid, Sigma } from "lucide-react";
import { PageHeader, Panel, Chip } from "@/components/ciap/primitives";
import { HubTabs, TabPanel, Breadcrumbs } from "@/components/ciap/hub-tabs";
import { EChart } from "@/components/ciap/echart";
import { correlationOption } from "@/lib/ciap/chart-options";
import { AdvancedAnalytics } from "./advanced-analytics";
import { Predictive } from "./predictive";
import { Trends } from "./trends";
import { Anomaly } from "./anomaly";
import { AIInsights } from "./ai-insights";
import { SociologyPage } from "./sociology";
import { CrimeAnalytics } from "./crime-analytics";

export const Route = createFileRoute("/intelligence")({
  head: () => ({
    meta: [
      { title: "CIAP · Intelligence" },
      { name: "description", content: "Predictive intelligence, trends, anomalies, socio-economic analytics and AI insights in one workspace." },
      { property: "og:title", content: "CIAP · Intelligence" },
      { property: "og:description", content: "Unified intelligence workspace for KSP analysts." },
    ],
  }),
  component: IntelligenceHub,
});

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "predictions", label: "Predictions", icon: Brain },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "anomalies", label: "Anomalies", icon: AlertTriangle },
  { id: "socio", label: "Socio-economic", icon: HeartPulse },
  { id: "ai", label: "AI Insights", icon: Sparkles },
  { id: "features", label: "Feature Importance", icon: Sigma },
  { id: "correlation", label: "Correlation Analysis", icon: PieChart },
];

function IntelligenceHub() {
  const [tab, setTab] = useState("overview");
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Home" }, { label: "Intelligence" }]} />
      <HubTabs tabs={TABS} value={tab} onChange={setTab} />

      <TabPanel active={tab === "overview"}>
        <div className="space-y-6">
          <PageHeader
            eyebrow="INTELLIGENCE"
            title="Analytical Intelligence Workspace"
            description="Consolidated advanced analytics, predictive intelligence, trends, anomaly detection, sociological correlations and AI insights."
            actions={<Chip tone="primary">Model v4.2 · 87% confidence</Chip>}
          />
          <CrimeAnalytics />
          <AdvancedAnalytics />
        </div>
      </TabPanel>
      <TabPanel active={tab === "predictions"}><Predictive /></TabPanel>
      <TabPanel active={tab === "trends"}><Trends /></TabPanel>
      <TabPanel active={tab === "anomalies"}><Anomaly /></TabPanel>
      <TabPanel active={tab === "socio"}><SociologyPage /></TabPanel>
      <TabPanel active={tab === "ai"}><AIInsights /></TabPanel>
      <TabPanel active={tab === "features"}>
        <div className="space-y-6">
          <PageHeader eyebrow="MODEL EXPLAINABILITY" title="Feature Importance" description="SHAP-based ranking of factors driving crime predictions." />
          <Predictive />
        </div>
      </TabPanel>
      <TabPanel active={tab === "correlation"}>
        <div className="space-y-6">
          <PageHeader eyebrow="CORRELATION" title="Socio-Crime Correlation Analysis" description="Pearson correlations between socio-economic indicators and crime intensity." />
          <EChart title="Correlation Matrix" subtitle="Pearson r · socio-economic vs crime" option={correlationOption()} height={480} />
          <SociologyPage />
        </div>
      </TabPanel>
    </div>
  );
}