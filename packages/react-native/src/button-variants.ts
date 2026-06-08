import type { TokenRegistry } from "@katalix/tokens";
import type { RNTextStyle, RNViewStyle } from "./rn-types.js";

const VARIANT_TOKENS: Readonly<Record<string, { readonly bg: string; readonly color: string }>> = {
  primary: { bg: "button.primary.background", color: "button.primary.color" },
  secondary: { bg: "button.secondary.background", color: "button.secondary.color" },
  ghost: { bg: "button.ghost.background", color: "button.ghost.color" },
};

export interface ButtonVariantStyles {
  readonly pressable: RNViewStyle;
  readonly text: RNTextStyle;
}

export const resolveButtonVariantStyles = (
  variant: string | undefined,
  registry: TokenRegistry | undefined,
): ButtonVariantStyles => {
  if (!variant) {
    return { pressable: {}, text: {} };
  }
  const mapping = VARIANT_TOKENS[variant];
  if (!mapping) {
    return { pressable: {}, text: {} };
  }
  const bg = registry?.[mapping.bg];
  const color = registry?.[mapping.color];
  return {
    pressable: {
      ...(bg !== undefined ? { backgroundColor: String(bg) } : {}),
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      ...(color !== undefined ? { color: String(color) } : {}),
    },
  };
};

/** @deprecated Use resolveButtonVariantStyles — kept for internal migration. */
export const resolveButtonVariantStyle = (
  variant: string | undefined,
  registry: TokenRegistry | undefined,
): RNViewStyle => resolveButtonVariantStyles(variant, registry).pressable;
