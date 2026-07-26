import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only after hydration. Required for Leaflet, ECharts and
 * React Flow which all touch `window`/`document` during initialisation.
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
