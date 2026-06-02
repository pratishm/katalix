import type { KatalixStyleValue } from "@katalix/core";
import { defaultTokenRegistry, type TokenRegistry } from "./registry.js";

export type ThemeMode = "light" | "dark";

const DARK_ALIASES: Readonly<Record<string, string>> = {
  "surface.canvas": "theme.dark.surface.canvas",
  "surface.elevated": "theme.dark.surface.elevated",
  "text.primary": "theme.dark.text.primary",
  "text.muted": "theme.dark.text.muted",
  "border.subtle": "theme.dark.border.subtle",
};

/** Build a registry for the given theme mode (GAP-STYLE-003). */
export const buildThemeRegistry = (
  mode: ThemeMode,
  base: TokenRegistry = defaultTokenRegistry,
): TokenRegistry => {
  if (mode === "light") {
    return base;
  }

  const themed: Record<string, KatalixStyleValue> = { ...base };
  for (const [semantic, darkKey] of Object.entries(DARK_ALIASES)) {
    if (darkKey in base) {
      themed[semantic] = base[darkKey]!;
    }
  }
  return themed;
};

/** Resolve theme mode from app manifest provider config. */
export const resolveThemeMode = (
  providerConfig: Readonly<Record<string, unknown>> | undefined,
): ThemeMode => {
  const mode = providerConfig?.mode;
  if (mode === "dark" || mode === "light") {
    return mode;
  }
  return "light";
};
