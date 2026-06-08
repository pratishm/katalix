import { resolveToken, type TokenRegistry } from "@katalix/tokens";
import type { RNTextStyle, RNViewStyle } from "./rn-types.js";

/** Default badge chrome from `badge.*` tokens (GAP-RN-012). */
export const resolveBadgeDefaultStyles = (
  registry: TokenRegistry | undefined,
): { readonly container: RNViewStyle; readonly text: RNTextStyle } => {
  const backgroundColor = String(resolveToken("badge.background", registry) ?? "#f1f5f9");
  const color = String(resolveToken("badge.color", registry) ?? "#334155");
  const padding = resolveToken("badge.padding", registry);
  const radius = resolveToken("badge.radius", registry);

  return {
    container: {
      backgroundColor,
      paddingHorizontal: typeof padding === "number" ? padding : 10,
      paddingVertical: typeof padding === "number" ? Math.max(4, Math.round(padding / 2)) : 4,
      borderRadius: typeof radius === "number" ? radius : 999,
      alignSelf: "flex-start",
    },
    text: {
      color,
      fontSize: 12,
      fontWeight: "600",
    },
  };
};
