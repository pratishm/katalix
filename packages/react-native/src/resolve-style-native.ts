import type {
  NormalizedKatalixStyle,
  NormalizedStyleValue,
  KatalixStyle,
  KatalixStyleValue,
} from "@katalix/core";
import { isTokenReference } from "@katalix/core";
import { resolveToken, type TokenRegistry } from "@katalix/tokens";
import type { RNStyle } from "./rn-types.js";

/** React Native style property names mapped from semantic style property names. */
const RN_PROPERTY_MAP: Readonly<Record<string, string>> = {
  color: "color",
  background: "backgroundColor",
  backgroundColor: "backgroundColor",
  padding: "padding",
  paddingTop: "paddingTop",
  paddingBottom: "paddingBottom",
  paddingLeft: "paddingLeft",
  paddingRight: "paddingRight",
  margin: "margin",
  marginTop: "marginTop",
  marginBottom: "marginBottom",
  marginLeft: "marginLeft",
  marginRight: "marginRight",
  gap: "gap",
  borderRadius: "borderRadius",
  borderWidth: "borderWidth",
  borderColor: "borderColor",
  fontSize: "fontSize",
  fontWeight: "fontWeight",
  width: "width",
  height: "height",
  flex: "flex",
  flexDirection: "flexDirection",
  alignItems: "alignItems",
  justifyContent: "justifyContent",
  lineHeight: "lineHeight",
  textAlign: "textAlign",
};

/** Convert a resolved value to a React Native-compatible value. */
const toNativeValue = (value: KatalixStyleValue): string | number => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const num = Number(value);
    if (!Number.isNaN(num) && /^\d+(\.\d+)?$/.test(value)) {
      return num;
    }
  }
  return String(value);
};

/** Resolve a single normalized style entry to a native value. */
const resolveEntry = (
  entry: NormalizedStyleValue,
  registry: TokenRegistry | undefined,
): string | number | undefined => {
  if (entry.kind === "literal") {
    return toNativeValue(entry.value);
  }
  const resolved = resolveToken(entry.ref, registry);
  if (resolved === undefined) {
    return undefined;
  }
  return toNativeValue(resolved);
};

/** Resolve a raw style value using the registry. */
const resolveRawValue = (
  value: KatalixStyleValue,
  registry: TokenRegistry | undefined,
): string | number | undefined => {
  if (typeof value === "string" && isTokenReference(value)) {
    const resolved = resolveToken(value, registry);
    return resolved !== undefined ? toNativeValue(resolved) : undefined;
  }
  return toNativeValue(value);
};

export interface ResolveNativeStyleOptions {
  readonly registry?: TokenRegistry;
}

/**
 * Resolve semantic styles into a React Native StyleSheet-compatible object.
 *
 * Uses `normalizedStyle` when available, falling back to `rawStyle` for
 * properties not normalized at build time.
 */
export const resolveStyleToNative = (
  normalizedStyle: NormalizedKatalixStyle | undefined,
  options: ResolveNativeStyleOptions = {},
  rawStyle?: KatalixStyle,
): RNStyle => {
  if (!normalizedStyle && !rawStyle) {
    return {};
  }

  const style: Record<string, string | number> = {};
  const seen = new Set<string>();

  if (normalizedStyle) {
    for (const [prop, entry] of Object.entries(normalizedStyle)) {
      seen.add(prop);
      const rnKey = RN_PROPERTY_MAP[prop] ?? prop;
      const value = resolveEntry(entry, options.registry);
      if (value !== undefined) {
        style[rnKey] = value;
      }
    }
  }

  if (rawStyle) {
    for (const [prop, value] of Object.entries(rawStyle)) {
      if (seen.has(prop)) {
        continue;
      }
      const rnKey = RN_PROPERTY_MAP[prop] ?? prop;
      const resolved = resolveRawValue(value, options.registry);
      if (resolved !== undefined) {
        style[rnKey] = resolved;
      }
    }
  }

  return style as RNStyle;
};
