import type { KatalixStyleValue } from "@katalix/core";
import { defaultTokenRegistry, type TokenRegistry } from "./registry.js";

/** Map common Tailwind utility classes to Katalix semantic tokens (GAP-STYLE-010). */
export const TAILWIND_TO_TOKEN: Readonly<Record<string, string>> = {
  "bg-white": "surface.canvas",
  "bg-slate-50": "surface.canvas",
  "bg-slate-100": "surface.elevated",
  "text-slate-900": "text.primary",
  "text-slate-600": "text.muted",
  "text-gray-900": "text.primary",
  "border-slate-200": "border.subtle",
  "shadow-sm": "elevation.sm",
  "shadow-md": "elevation.md",
};

export interface TailwindBridgeOptions {
  readonly registry?: TokenRegistry;
  readonly extraMappings?: Readonly<Record<string, string>>;
}

/** Resolve a Tailwind class string to a concrete style value from the token registry. */
export const resolveTailwindClass = (
  className: string,
  options: TailwindBridgeOptions = {},
): KatalixStyleValue | undefined => {
  const registry = options.registry ?? defaultTokenRegistry;
  const tokenKey = options.extraMappings?.[className] ?? TAILWIND_TO_TOKEN[className];
  if (!tokenKey) {
    return undefined;
  }
  return registry[tokenKey];
};

/** Expand a space-separated Tailwind class list into inline style properties. */
export const tailwindClassesToStyle = (
  classes: string,
  options: TailwindBridgeOptions = {},
): Record<string, KatalixStyleValue> => {
  const style: Record<string, KatalixStyleValue> = {};
  for (const className of classes.split(/\s+/).filter(Boolean)) {
    const tokenKey = options.extraMappings?.[className] ?? TAILWIND_TO_TOKEN[className];
    if (!tokenKey) {
      continue;
    }
    if (className.startsWith("bg-")) {
      style.backgroundColor = tokenKey;
    } else if (className.startsWith("text-")) {
      style.color = tokenKey;
    } else if (className.startsWith("border-")) {
      style.borderColor = tokenKey;
    } else if (className.startsWith("shadow-")) {
      style.shadow = tokenKey;
    }
  }
  return style;
};
