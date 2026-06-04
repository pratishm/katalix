import type { DeepLinkRuntime } from "./deep-link.js";

export interface NativeLinkingLike {
  getInitialURL(): Promise<string | null>;
  addEventListener(
    event: "url",
    handler: (event: { url: string }) => void,
  ): { remove(): void };
}

/** Attach React Native Linking to a deep-link runtime (GAP-NATIVE-010). */
export const attachDeepLinkListener = (
  runtime: DeepLinkRuntime,
  linking: NativeLinkingLike,
): (() => void) => {
  void linking.getInitialURL().then((url) => {
    if (url) {
      runtime.emit(url);
    }
  });
  const subscription = linking.addEventListener("url", ({ url }) => {
    runtime.emit(url);
  });
  return () => subscription.remove();
};

/** Load `Linking` from react-native when available. */
export const tryGetReactNativeLinking = (): NativeLinkingLike | undefined => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RN = require("react-native") as { Linking?: NativeLinkingLike };
    return RN.Linking;
  } catch {
    return undefined;
  }
};
