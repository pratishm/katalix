import type { TokenRegistry } from "@katalix/tokens";
import type { RNViewStyle } from "./rn-types.js";

const VARIANT_TOKENS: Readonly<Record<string, { readonly bg: string; readonly color: string }>> = {
  primary: { bg: "button.primary.background", color: "button.primary.color" },
  secondary: { bg: "button.secondary.background", color: "button.secondary.color" },
  ghost: { bg: "button.ghost.background", color: "button.ghost.color" },
};

export const resolveButtonVariantStyle = (
  variant: string | undefined,
  registry: TokenRegistry | undefined,
): RNViewStyle => {
  if (!variant) {
    return {};
  }
  const mapping = VARIANT_TOKENS[variant];
  if (!mapping) {
    return {};
  }
  const bg = registry?.[mapping.bg];
  const color = registry?.[mapping.color];
  return {
    ...(bg !== undefined ? { backgroundColor: String(bg) } : {}),
    ...(color !== undefined ? { color: String(color) } : {}),
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  };
};
