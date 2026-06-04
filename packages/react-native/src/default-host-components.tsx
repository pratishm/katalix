import React from "react";
import type { KatalixNode } from "@katalix/core";
import type { HostComponentRegistry, HostComponentRenderer } from "./host-registry-context.js";

const createWebViewHostComponent = (): HostComponentRenderer | undefined => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebView } = require("react-native-webview") as {
      WebView: React.ComponentType<{
        source: { uri: string };
        style?: object;
        startInLoadingState?: boolean;
      }>;
    };
    const Renderer: HostComponentRenderer = ({ node }) => {
      const source = node.props.source as string | undefined;
      if (!source) {
        return null;
      }
      return (
        <WebView
          source={{ uri: source }}
          startInLoadingState
          style={{ flex: 1, minHeight: 200 }}
        />
      );
    };
    return Renderer;
  } catch {
    return undefined;
  }
};

/** Default host components (WebView when `react-native-webview` is installed). */
export const createDefaultHostRegistry = (): HostComponentRegistry => {
  const registry: Record<string, HostComponentRenderer> = {};
  const webView = createWebViewHostComponent();
  if (webView) {
    registry.WebView = webView;
  }
  return registry;
};

export const mergeHostRegistries = (
  base: HostComponentRegistry,
  override?: HostComponentRegistry,
): HostComponentRegistry => ({
  ...base,
  ...(override ?? {}),
});
