import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "kn";
const STORAGE_KEY = "ciap.lang";

/** Translation dictionary. Keys are dot-namespaced by surface. */
const dict: Record<string, { en: string; kn: string }> = {
  "app.title": { en: "Crime Intelligence & Analytical Platform", kn: "ಅಪರಾಧ ಗುಪ್ತಚರ ಮತ್ತು ವಿಶ್ಲೇಷಣಾ ವೇದಿಕೆ" },
  "app.org": { en: "Karnataka State Police · SCRB", kn: "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ · ಎಸ್‌ಸಿಆರ್‌ಬಿ" },
  "nav.dashboard": { en: "Dashboard", kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" },
  "nav.crimeAnalytics": { en: "Crime Analytics", kn: "ಅಪರಾಧ ವಿಶ್ಲೇಷಣೆ" },
  "nav.advancedAnalytics": { en: "Advanced Analytics", kn: "ಸುಧಾರಿತ ವಿಶ್ಲೇಷಣೆ" },
  "nav.crimeMap": { en: "Crime Map", kn: "ಅಪರಾಧ ನಕ್ಷೆ" },
  "nav.hotspots": { en: "Hotspot Detection", kn: "ಹಾಟ್‌ಸ್ಪಾಟ್ ಪತ್ತೆ" },
  "nav.network": { en: "Network Analysis", kn: "ಜಾಲ ವಿಶ್ಲೇಷಣೆ" },
  "nav.sociology": { en: "Sociological Analytics", kn: "ಸಮಾಜಶಾಸ್ತ್ರೀಯ ವಿಶ್ಲೇಷಣೆ" },
  "nav.suspects": { en: "Suspect Profiles", kn: "ಶಂಕಿತರ ವಿವರ" },
  "nav.victims": { en: "Victim Profiles", kn: "ಸಂತ್ರಸ್ತರ ವಿವರ" },
  "nav.cases": { en: "Case Explorer", kn: "ಪ್ರಕರಣ ಪರಿಶೀಲನೆ" },
  "nav.predictive": { en: "Predictive Intelligence", kn: "ಭವಿಷ್ಯಸೂಚಕ ಗುಪ್ತಚರ" },
  "nav.anomaly": { en: "Anomaly Detection", kn: "ಅಸಂಗತತೆ ಪತ್ತೆ" },
  "nav.trends": { en: "Trend Analysis", kn: "ಪ್ರವೃತ್ತಿ ವಿಶ್ಲೇಷಣೆ" },
  "nav.aiInsights": { en: "AI Insights", kn: "ಎಐ ಒಳನೋಟಗಳು" },
  "nav.reports": { en: "Reports", kn: "ವರದಿಗಳು" },
  "nav.dataImport": { en: "Data Import", kn: "ದತ್ತಾಂಶ ಆಮದು" },
  "nav.settings": { en: "Settings", kn: "ಸಂಯೋಜನೆಗಳು" },
  "nav.modules": { en: "Command Modules", kn: "ಕಮಾಂಡ್ ಮಾಡ್ಯೂಲ್‌ಗಳು" },
  "top.search": { en: "Search cases, suspects, FIR, vehicles…", kn: "ಪ್ರಕರಣ, ಶಂಕಿತರು, ಎಫ್‌ಐಆರ್ ಹುಡುಕಿ…" },
  "top.assistant": { en: "AI Assistant", kn: "ಎಐ ಸಹಾಯಕ" },
  "top.systems": { en: "Systems", kn: "ವ್ಯವಸ್ಥೆಗಳು" },
  "top.operational": { en: "OPERATIONAL", kn: "ಕಾರ್ಯಾಚರಣೆಯಲ್ಲಿ" },
  "panel.liveAlerts": { en: "Live Alerts", kn: "ನೇರ ಎಚ್ಚರಿಕೆಗಳು" },
  "panel.environment": { en: "Environment", kn: "ಪರಿಸರ" },
  "panel.systemHealth": { en: "System Health", kn: "ವ್ಯವಸ್ಥೆ ಆರೋಗ್ಯ" },
  "action.export": { en: "Export", kn: "ರಫ್ತು" },
  "action.fullscreen": { en: "Fullscreen", kn: "ಪೂರ್ಣ ಪರದೆ" },
  "action.close": { en: "Close", kn: "ಮುಚ್ಚಿ" },
  "shortcut.help": { en: "Keyboard Shortcuts", kn: "ಕೀಬೋರ್ಡ್ ಶಾರ್ಟ್‌ಕಟ್‌ಗಳು" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const Ctx = createContext<I18nCtx>({ lang: "en", setLang: () => {}, t: (k, f) => f ?? k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "kn" || stored === "en") setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l === "kn" ? "kn" : "en";
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => dict[key]?.[lang] ?? fallback ?? dict[key]?.en ?? key,
    [lang],
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
