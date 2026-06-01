import type React from "react";
import { setRNComponents } from "./render-node-native.js";

let registered = false;

/**
 * Register all built-in React Native primitives (GAP-RN-001).
 * Safe to call multiple times; uses the host's `react-native` module.
 */
export const registerDefaultRNComponents = (): void => {
  if (registered) {
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RN = require("react-native") as typeof import("react-native");
    setRNComponents({
      View: RN.View as never,
      Text: RN.Text as never,
      Image: RN.Image as never,
      TextInput: RN.TextInput as never,
      Pressable: RN.Pressable as never,
      ScrollView: RN.ScrollView as never,
      SafeAreaView: RN.SafeAreaView as never,
      FlatList: RN.FlatList as never,
      Modal: RN.Modal as never,
      KeyboardAvoidingView: RN.KeyboardAvoidingView as never,
      Switch: RN.Switch as never,
    });
    registered = true;
  } catch {
    // react-native not installed — host must call setRNComponents manually
  }
};

export type RNComponentSet = NonNullable<Parameters<typeof setRNComponents>[0]>;
