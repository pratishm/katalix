import React from "react";
import {
  buildThemeRegistry,
  resolveThemeMode,
  type ThemeMode,
  type TokenRegistry,
} from "@katalix/tokens";

export interface ThemeModeContextValue {
  readonly mode: ThemeMode;
  readonly registry: TokenRegistry;
  readonly setMode: (mode: ThemeMode) => void;
}

const ThemeModeContext = React.createContext<ThemeModeContextValue | null>(null);

export const ThemeModeProvider: React.FC<{
  readonly initialMode?: ThemeMode;
  readonly baseRegistry: TokenRegistry;
  readonly children: React.ReactNode;
}> = ({ initialMode = "light", baseRegistry, children }) => {
  const [mode, setMode] = React.useState<ThemeMode>(initialMode);
  const registry = React.useMemo(
    () => buildThemeRegistry(mode, baseRegistry),
    [mode, baseRegistry],
  );

  const value = React.useMemo(
    () => ({ mode, registry, setMode }),
    [mode, registry],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
};

export const useThemeMode = (): ThemeModeContextValue => {
  const ctx = React.useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error("useThemeMode must be used within ThemeModeProvider");
  }
  return ctx;
};

export { resolveThemeMode };
