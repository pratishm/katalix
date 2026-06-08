import type React from "react";
import type { KatalixNode } from "@katalix/core";
import { getAnimatedDriver } from "./animated-driver.js";
import type { RNScrollViewProps, RNTextProps, RNViewProps, RNViewStyle } from "./rn-types.js";

let cachedAnimatedView: React.ComponentType<RNViewProps> | undefined;
let cachedAnimatedText: React.ComponentType<RNTextProps> | undefined;
let cachedAnimatedScrollView: React.ComponentType<RNScrollViewProps> | undefined;

let injectedAnimatedHosts:
  | {
      readonly View?: React.ComponentType<RNViewProps>;
      readonly Text?: React.ComponentType<RNTextProps>;
      readonly ScrollView?: React.ComponentType<RNScrollViewProps>;
    }
  | undefined;

/** Inject Animated host primitives for tests or custom RN runtimes. */
export const setAnimatedHostComponents = (
  components: typeof injectedAnimatedHosts,
): void => {
  injectedAnimatedHosts = components;
  cachedAnimatedView = undefined;
  cachedAnimatedText = undefined;
  cachedAnimatedScrollView = undefined;
};

/** True when node should render via Animated host components (GAP-RN-009/010). */
export const nodeUsesAnimatedHost = (node: KatalixNode): boolean =>
  Boolean(node.animation) && Boolean(getAnimatedDriver());

export const getAnimatedViewComponent = (): React.ComponentType<RNViewProps> | undefined => {
  if (!getAnimatedDriver()) {
    return undefined;
  }
  if (injectedAnimatedHosts?.View) {
    return injectedAnimatedHosts.View;
  }
  if (cachedAnimatedView) {
    return cachedAnimatedView;
  }
  try {
    const RN = require("react-native") as {
      Animated: { View: React.ComponentType<RNViewProps> };
    };
    cachedAnimatedView = RN.Animated.View;
    return cachedAnimatedView;
  } catch {
    return undefined;
  }
};

export const getAnimatedTextComponent = (): React.ComponentType<RNTextProps> | undefined => {
  if (!getAnimatedDriver()) {
    return undefined;
  }
  if (injectedAnimatedHosts?.Text) {
    return injectedAnimatedHosts.Text;
  }
  if (cachedAnimatedText) {
    return cachedAnimatedText;
  }
  try {
    const RN = require("react-native") as {
      Animated: { Text: React.ComponentType<RNTextProps> };
    };
    cachedAnimatedText = RN.Animated.Text;
    return cachedAnimatedText;
  } catch {
    return undefined;
  }
};

export const getAnimatedScrollViewComponent = ():
  | React.ComponentType<RNScrollViewProps>
  | undefined => {
  if (!getAnimatedDriver()) {
    return undefined;
  }
  if (injectedAnimatedHosts?.ScrollView) {
    return injectedAnimatedHosts.ScrollView;
  }
  if (cachedAnimatedScrollView) {
    return cachedAnimatedScrollView;
  }
  try {
    const RN = require("react-native") as {
      Animated: { ScrollView: React.ComponentType<RNScrollViewProps> };
    };
    cachedAnimatedScrollView = RN.Animated.ScrollView;
    return cachedAnimatedScrollView;
  } catch {
    return undefined;
  }
};

export const resolveViewHost = (
  node: KatalixNode,
  fallback: React.ComponentType<RNViewProps>,
): React.ComponentType<RNViewProps> =>
  nodeUsesAnimatedHost(node) ? (getAnimatedViewComponent() ?? fallback) : fallback;

export const resolveTextHost = (
  node: KatalixNode,
  fallback: React.ComponentType<RNTextProps>,
): React.ComponentType<RNTextProps> =>
  nodeUsesAnimatedHost(node) ? (getAnimatedTextComponent() ?? fallback) : fallback;

export const resolveScrollHost = (
  node: KatalixNode,
  fallback: React.ComponentType<RNScrollViewProps>,
): React.ComponentType<RNScrollViewProps> =>
  nodeUsesAnimatedHost(node)
    ? (getAnimatedScrollViewComponent() ?? fallback)
    : fallback;

/** Layout-only props for Pressable shell when motion runs on inner Animated.View. */
export const pressableShellStyle = (style: RNViewStyle): RNViewStyle | undefined => {
  const shell: Record<string, unknown> = {};
  if (style.alignSelf !== undefined) {
    shell.alignSelf = style.alignSelf;
  }
  if (style.margin !== undefined) {
    shell.margin = style.margin;
  }
  if (style.marginTop !== undefined) {
    shell.marginTop = style.marginTop;
  }
  if (style.marginBottom !== undefined) {
    shell.marginBottom = style.marginBottom;
  }
  if (style.marginLeft !== undefined) {
    shell.marginLeft = style.marginLeft;
  }
  if (style.marginRight !== undefined) {
    shell.marginRight = style.marginRight;
  }
  return Object.keys(shell).length > 0 ? (shell as RNViewStyle) : undefined;
};
