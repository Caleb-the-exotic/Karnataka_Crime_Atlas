import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";
const STORAGE_KEY = "ciap.theme";

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: "dark", setTheme: () => {}, toggle: () => {} });

/**
 * Theme provider. The design system defaults to the CIAP dark intelligence
 * palette on :root and exposes a `.light` override class, so switching is a
 * single class toggle on <html> — no token duplication.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? null;
    const initial: Theme = stored ?? "dark";
    setThemeState(initial);
    apply(initial);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    apply(t);
  }, []);

  const toggle = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  return <Ctx.Provider value={{ theme, setTheme, toggle }}>{children}</Ctx.Provider>;
}

function apply(t: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.classList.toggle("light", t === "light");
  root.style.colorScheme = t;
  window.setTimeout(() => root.classList.remove("theme-transition"), 420);
}

export const useTheme = () => useContext(Ctx);
