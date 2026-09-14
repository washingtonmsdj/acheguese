import { useCallback, useLayoutEffect, useState } from "react";

type Theme = "dark" | "light";

function getThemeStorageKey(): string | null {
  if (typeof document === "undefined") return null;
  return document.documentElement.dataset.themeStorageKey ?? null;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const storageKey = getThemeStorageKey();
  if (!storageKey) return "light";

  try {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    return stored === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");

    const storageKey = getThemeStorageKey();
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Storage can be unavailable in restricted browsing contexts.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
