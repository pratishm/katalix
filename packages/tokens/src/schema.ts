import type { LattixStyleValue } from "@lattix/core";

/** Supported style properties for Phase 4 (shared semantic schema). */
export const STYLE_PROPERTIES = [
  "color",
  "background",
  "backgroundColor",
  "padding",
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "gap",
  "borderRadius",
  "fontSize",
  "fontWeight",
  "width",
  "height",
  "flex",
  "flexDirection",
  "alignItems",
  "justifyContent",
] as const;

export type StyleProperty = (typeof STYLE_PROPERTIES)[number];

const propertySet = new Set<string>(STYLE_PROPERTIES);

export const isAllowedStyleProperty = (prop: string): prop is StyleProperty =>
  propertySet.has(prop);

export type StyleValueType = "string" | "number" | "boolean" | "any";

export const STYLE_PROPERTY_TYPES: Readonly<
  Record<StyleProperty, StyleValueType | readonly StyleValueType[]>
> = {
  color: "string",
  background: "string",
  backgroundColor: "string",
  padding: ["number", "string"],
  margin: ["number", "string"],
  marginTop: ["number", "string"],
  marginBottom: ["number", "string"],
  marginLeft: ["number", "string"],
  marginRight: ["number", "string"],
  gap: ["number", "string"],
  borderRadius: ["number", "string"],
  fontSize: ["number", "string"],
  fontWeight: ["string", "number"],
  width: ["number", "string"],
  height: ["number", "string"],
  flex: "number",
  flexDirection: "string",
  alignItems: "string",
  justifyContent: "string",
};

export const valueMatchesType = (
  value: LattixStyleValue,
  expected: StyleValueType | readonly StyleValueType[],
): boolean => {
  const types = Array.isArray(expected) ? expected : [expected];
  if (types.includes("any")) {
    return true;
  }
  const actual = typeof value;
  return types.includes(actual as StyleValueType);
};
