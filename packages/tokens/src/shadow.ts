import type { KatalixStyleValue } from "@katalix/core";
import type { TokenRegistry } from "./registry.js";
import { resolveToken } from "./resolve.js";

export interface NativeShadowStyle {
  readonly shadowColor: string;
  readonly shadowOffset: { readonly width: number; readonly height: number };
  readonly shadowOpacity: number;
  readonly shadowRadius: number;
  readonly elevation: number;
}

/** Semantic elevation tokens → React Native shadow props (GAP-RN-003). */
export const NATIVE_SHADOW_PRESETS: Readonly<Record<string, NativeShadowStyle>> = {
  "elevation.sm": {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  "elevation.md": {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
};

const NUMERIC_SHADOW_PRESETS: readonly (keyof typeof NATIVE_SHADOW_PRESETS)[] = [
  "elevation.sm",
  "elevation.md",
];

const parseRgbaOpacity = (color: string): { readonly color: string; readonly opacity: number } => {
  const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (!match) {
    return { color, opacity: 0.12 };
  }
  const [, r, g, b, a] = match;
  const opacity = a !== undefined ? Number(a) : 1;
  return {
    color: `rgb(${r}, ${g}, ${b})`,
    opacity,
  };
};

/** Best-effort CSS `box-shadow` → RN shadow props. */
export const parseCssBoxShadow = (value: string): NativeShadowStyle | undefined => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "none") {
    return undefined;
  }

  const rgbaMatch = trimmed.match(
    /(-?\d+(?:\.\d+)?)(?:px)?\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})/i,
  );
  if (!rgbaMatch) {
    return undefined;
  }

  const offsetY = Number(rgbaMatch[2]);
  const radius = Number(rgbaMatch[3]);
  const { color, opacity } = parseRgbaOpacity(rgbaMatch[4]!);

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: Math.max(2, Math.round(offsetY + radius / 2)),
  };
};

const presetKeyFromValue = (
  value: string,
  registry?: TokenRegistry,
): string | undefined => {
  if (value in NATIVE_SHADOW_PRESETS) {
    return value;
  }
  if (!registry) {
    return undefined;
  }
  for (const key of Object.keys(NATIVE_SHADOW_PRESETS)) {
    const tokenValue = registry[key];
    if (tokenValue !== undefined && String(tokenValue) === value) {
      return key;
    }
  }
  return undefined;
};

/** Resolve StyleChain `shadow` input to native shadow props. */
export const resolveNativeShadowStyle = (
  value: KatalixStyleValue,
  registry?: TokenRegistry,
): NativeShadowStyle | undefined => {
  if (typeof value === "number") {
    const index = Math.max(0, Math.round(value) - 1);
    const key = NUMERIC_SHADOW_PRESETS[index];
    return key ? NATIVE_SHADOW_PRESETS[key] : undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const tokenKey = presetKeyFromValue(value, registry);
  if (tokenKey) {
    return NATIVE_SHADOW_PRESETS[tokenKey];
  }

  const resolved = resolveToken(value, registry);
  if (resolved !== undefined) {
    const fromToken = presetKeyFromValue(String(resolved), registry);
    if (fromToken) {
      return NATIVE_SHADOW_PRESETS[fromToken];
    }
    return parseCssBoxShadow(String(resolved));
  }

  return parseCssBoxShadow(value);
};

/** CSS `box-shadow` for web renderers. */
export const resolveCssBoxShadow = (
  value: KatalixStyleValue,
  registry?: TokenRegistry,
): string | undefined => {
  if (typeof value === "number") {
    const index = Math.max(0, Math.round(value) - 1);
    const key = NUMERIC_SHADOW_PRESETS[index];
    const preset = key ? registry?.[key] : undefined;
    return preset !== undefined ? String(preset) : undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const resolved = resolveToken(value, registry);
  if (resolved !== undefined) {
    return String(resolved);
  }
  if (value in NATIVE_SHADOW_PRESETS && registry?.[value]) {
    return String(registry[value]);
  }
  return value;
};
