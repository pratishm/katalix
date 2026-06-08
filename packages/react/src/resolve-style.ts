import type {
  NormalizedKatalixStyle,
  NormalizedStyleValue,
  KatalixStyle,
  KatalixStyleValue,
} from "@katalix/core";
import { isTokenReference } from "@katalix/core";
import { resolveCssBoxShadow, resolveToken, type TokenRegistry } from "@katalix/tokens";

/** CSS property names mapped from semantic style property names. */
const CSS_PROPERTY_MAP: Readonly<Record<string, string>> = {
  color: "color",
  background: "backgroundColor",
  backgroundColor: "backgroundColor",
  padding: "padding",
  margin: "margin",
  marginTop: "marginTop",
  marginBottom: "marginBottom",
  marginLeft: "marginLeft",
  marginRight: "marginRight",
  gap: "gap",
  borderRadius: "borderRadius",
  fontSize: "fontSize",
  fontWeight: "fontWeight",
  fontFamily: "fontFamily",
  width: "width",
  height: "height",
  flex: "flex",
  flexDirection: "flexDirection",
  alignItems: "alignItems",
  alignSelf: "alignSelf",
  justifyContent: "justifyContent",
  paddingTop: "paddingTop",
  paddingBottom: "paddingBottom",
  borderWidth: "borderWidth",
  borderColor: "borderColor",
  opacity: "opacity",
  lineHeight: "lineHeight",
  textAlign: "textAlign",
};

/** Convert a resolved style value to a CSS-compatible value. */
const toCSSValue = (value: KatalixStyleValue): string | number => {
  if (typeof value === "number") {
    return value;
  }
  return String(value);
};

/** Resolve a single normalized style entry to a CSS value. */
const resolveEntry = (
  entry: NormalizedStyleValue,
  registry: TokenRegistry | undefined,
): string | number | undefined => {
  if (entry.kind === "literal") {
    return toCSSValue(entry.value);
  }
  const resolved = resolveToken(entry.ref, registry);
  if (resolved === undefined) {
    return undefined;
  }
  return toCSSValue(resolved);
};

/** Resolve a raw style value (from node.style) to a CSS value using the registry. */
const resolveRawValue = (
  value: KatalixStyleValue,
  registry: TokenRegistry | undefined,
): string | number | undefined => {
  if (typeof value === "string" && isTokenReference(value)) {
    const resolved = resolveToken(value, registry);
    return resolved !== undefined ? toCSSValue(resolved) : undefined;
  }
  return toCSSValue(value);
};

export interface ResolveStyleOptions {
  readonly registry?: TokenRegistry;
}

/**
 * Resolve semantic styles into a React CSSProperties-compatible object.
 *
 * Uses `normalizedStyle` when available, falling back to `rawStyle` for
 * properties that were not normalized (e.g. tokens unknown to the default
 * registry at build time but present in a custom renderer registry).
 */
export const resolveStyleToCSS = (
  normalizedStyle: NormalizedKatalixStyle | undefined,
  options: ResolveStyleOptions = {},
  rawStyle?: KatalixStyle,
): React.CSSProperties => {
  if (!normalizedStyle && !rawStyle) {
    return {};
  }

  const css: Record<string, string | number> = {};
  const seen = new Set<string>();

  if (normalizedStyle) {
    for (const [prop, entry] of Object.entries(normalizedStyle)) {
      seen.add(prop);
      if (prop === "shadow") {
        const shadowValue = entry.kind === "literal" ? entry.value : entry.ref;
        const boxShadow = resolveCssBoxShadow(shadowValue, options.registry);
        if (boxShadow) {
          css.boxShadow = boxShadow;
        }
        continue;
      }
      const cssKey = CSS_PROPERTY_MAP[prop] ?? prop;
      const value = resolveEntry(entry, options.registry);
      if (value !== undefined) {
        css[cssKey] = value;
      }
    }
  }

  if (rawStyle) {
    for (const [prop, value] of Object.entries(rawStyle)) {
      if (seen.has(prop)) {
        continue;
      }
      if (prop === "shadow") {
        const boxShadow = resolveCssBoxShadow(value, options.registry);
        if (boxShadow) {
          css.boxShadow = boxShadow;
        }
        continue;
      }
      const cssKey = CSS_PROPERTY_MAP[prop] ?? prop;
      const resolved = resolveRawValue(value, options.registry);
      if (resolved !== undefined) {
        css[cssKey] = resolved;
      }
    }
  }

  return css as React.CSSProperties;
};
