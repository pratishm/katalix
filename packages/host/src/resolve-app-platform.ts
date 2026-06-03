import type { KatalixNativeManifest } from "@katalix/native";
import type { KatalixWebManifest } from "@katalix/web";

export type KatalixAppPlatform = "native" | "web";

export type KatalixAppPlatformInput = KatalixAppPlatform | "auto";

export interface ResolveAppPlatformInput {
  readonly platform?: KatalixAppPlatformInput;
  readonly nativeManifest?: KatalixNativeManifest;
  readonly webManifest?: KatalixWebManifest;
}

/** Choose native vs web renderer for @katalix/host (auto: web when only webManifest is set). */
export const resolveAppPlatform = (input: ResolveAppPlatformInput): KatalixAppPlatform => {
  if (input.platform && input.platform !== "auto") {
    return input.platform;
  }
  if (input.nativeManifest) {
    return "native";
  }
  if (input.webManifest) {
    return "web";
  }
  return "native";
};
