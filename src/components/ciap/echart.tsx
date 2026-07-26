import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Download, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import type { EChartsOption } from "echarts";
import { cn } from "@/lib/utils";
import { ClientOnly } from "./client-only";
import { useTheme } from "@/lib/ciap/theme";
import { Skeleton } from "@/components/ui/skeleton";

const ReactECharts = lazy(() => import("echarts-for-react"));

export interface EChartProps {
  option: EChartsOption;
  height?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  /** Emitted when a data item is clicked — powers cross filtering. */
  onSelect?: (name: string, payload: any) => void;
  actions?: React.ReactNode;
}

/**
 * Themed Apache ECharts panel with export-to-PNG, fullscreen, refresh,
 * animations and automatic light/dark palette switching.
 */
export function EChart({ option, height = 340, title, subtitle, className, onSelect, actions }: EChartProps) {
  const { theme } = useTheme();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const [full, setFull] = useState(false);
  const [nonce, setNonce] = useState(0);

  const themed = applyTheme(option, theme);

  const download = useCallback(() => {
    const inst = chartRef.current?.getEchartsInstance?.();
    if (!inst) return;
    const url = inst.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: theme === "light" ? "#ffffff" : "#0f1a2b" });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title ?? "ciap-chart").toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  }, [title, theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    if (full) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  useEffect(() => {
    const inst = chartRef.current?.getEchartsInstance?.();
    const id = window.setTimeout(() => inst?.resize(), 260);
    return () => window.clearTimeout(id);
  }, [full]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl p-4 overflow-hidden",
        full && "fixed inset-4 z-[900] bg-popover/98 shadow-2xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          {title && <h3 className="text-sm font-semibold tracking-wide">{title}</h3>}
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          {actions}
          <IconBtn label="Refresh chart" onClick={() => setNonce((n) => n + 1)} icon={RefreshCw} />
          <IconBtn label="Export chart as PNG" onClick={download} icon={Download} />
          <IconBtn label={full ? "Exit fullscreen" : "Fullscreen"} onClick={() => setFull((f) => !f)} icon={full ? Minimize2 : Maximize2} />
        </div>
      </header>
      <ClientOnly fallback={<Skeleton className="w-full rounded-xl" style={{ height }} />}>
        <Suspense fallback={<Skeleton className="w-full rounded-xl" style={{ height }} />}>
          <ReactECharts
            key={`${theme}-${nonce}`}
            ref={chartRef}
            option={themed}
            notMerge
            lazyUpdate
            style={{ height: full ? "calc(100vh - 12rem)" : height, width: "100%" }}
            opts={{ renderer: "canvas" }}
            onEvents={onSelect ? { click: (p: any) => onSelect(p.name ?? p.data?.name ?? "", p) } : undefined}
          />
        </Suspense>
      </ClientOnly>
    </div>
  );
}

function IconBtn({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: typeof Download }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-lg border border-border/70 p-1.5 text-muted-foreground hover:border-primary/60 hover:text-primary transition"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export const CIAP_PALETTE = [
  "#4fa8ff", "#57e0c8", "#7ee787", "#ffd166", "#ff9f43",
  "#ff5f5f", "#c084fc", "#f472b6", "#38bdf8", "#a3e635",
];

/** Injects the CIAP palette / grid / tooltip chrome into any option object. */
function applyTheme(option: EChartsOption, theme: "dark" | "light"): EChartsOption {
  const fg = theme === "light" ? "#31405a" : "#c9d8ec";
  const muted = theme === "light" ? "#6b7c96" : "#8aa0be";
  const line = theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(120,170,240,0.14)";
  const axis = {
    axisLine: { lineStyle: { color: line } },
    axisTick: { show: false },
    axisLabel: { color: muted, fontSize: 10 },
    splitLine: { lineStyle: { color: line, type: "dashed" as const } },
  };
  const withAxis = (a: any) => (Array.isArray(a) ? a.map((x) => ({ ...axis, ...x })) : a ? { ...axis, ...a } : a);

  return {
    color: CIAP_PALETTE,
    backgroundColor: "transparent",
    animation: true,
    animationDuration: 700,
    animationEasing: "cubicOut",
    textStyle: { color: fg, fontFamily: "inherit" },
    tooltip: {
      backgroundColor: theme === "light" ? "rgba(255,255,255,0.96)" : "rgba(16,26,44,0.95)",
      borderColor: "rgba(79,168,255,0.45)",
      borderWidth: 1,
      textStyle: { color: fg, fontSize: 11 },
      extraCssText: "backdrop-filter: blur(10px); border-radius: 10px;",
      ...(option.tooltip as object),
    },
    legend: {
      textStyle: { color: muted, fontSize: 10 },
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 10,
      ...(option.legend as object),
    },
    grid: { left: 48, right: 24, top: 32, bottom: 36, containLabel: true, ...(option.grid as object) },
    ...option,
    xAxis: withAxis((option as any).xAxis),
    yAxis: withAxis((option as any).yAxis),
  } as EChartsOption;
}
