import type React from "react";

/** CSS safe-area insets for web layout parity (not fixed pixel hacks). */
export const resolveWebSafeAreaStyle = (
  edges?: string,
): React.CSSProperties => {
  const insetTop = "max(16px, env(safe-area-inset-top, 0px))";
  const insetBottom = "max(16px, env(safe-area-inset-bottom, 0px))";
  const insetLeft = "max(16px, env(safe-area-inset-left, 0px))";
  const insetRight = "max(16px, env(safe-area-inset-right, 0px))";

  if (edges === "top") {
    return { paddingTop: insetTop };
  }
  if (edges === "bottom") {
    return { paddingBottom: insetBottom };
  }
  if (edges === "left") {
    return { paddingLeft: insetLeft };
  }
  if (edges === "right") {
    return { paddingRight: insetRight };
  }
  if (edges === "all") {
    return {
      paddingTop: insetTop,
      paddingBottom: insetBottom,
      paddingLeft: insetLeft,
      paddingRight: insetRight,
    };
  }
  return {
    paddingTop: insetTop,
    paddingBottom: insetBottom,
    paddingLeft: insetLeft,
    paddingRight: insetRight,
  };
};
