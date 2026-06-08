import type { RNTextStyle, RNViewStyle } from "./rn-types.js";

const TEXT_STYLE_KEYS = [
  "color",
  "fontSize",
  "fontWeight",
  "fontFamily",
  "letterSpacing",
  "lineHeight",
  "textAlign",
  "textDecorationLine",
] as const;

/** Split pressable layout styles from text typography (GAP-RN-011). */
export const partitionButtonStyles = (
  style: RNViewStyle,
): { readonly pressable: RNViewStyle; readonly text: RNTextStyle } => {
  const pressable: Record<string, unknown> = {};
  const text: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(style)) {
    if ((TEXT_STYLE_KEYS as readonly string[]).includes(key)) {
      text[key] = value;
    } else {
      pressable[key] = value;
    }
  }

  return {
    pressable: pressable as RNViewStyle,
    text: text as RNTextStyle,
  };
};
