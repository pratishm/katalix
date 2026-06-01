/**
 * Single source of truth for Katalix release and React Native stack versions.
 * Used by CLI templates, bootstrap scripts, and doctor checks.
 *
 * RN 0.79.7 + React 19.0.0 exact — Fabric renderer mismatch otherwise.
 */
export const KATALIX_VERSION = "1.0.2";

/** Bare React Native + Expo mobile line (Expo SDK 53 targets RN 0.79). */
export const REACT_NATIVE_STACK = {
  react: "19.0.0",
  reactNative: "0.79.7",
  reactNativeScreens: "~4.11.0",
  reactNativeSafeAreaContext: "^5.4.0",
  communityCli: "^18.0.0",
  metroConfig: "0.79.7",
  babelPreset: "0.79.7",
  typesReact: "~19.0.0",
  babelCore: "^7.25.2",
  babelRuntime: "^7.25.0",
  reactNavigationNative: "^7.1.0",
  reactNavigationNativeStack: "^7.3.0",
} as const;

export const EXPO_STACK = {
  expo: "~53.0.0",
  easCli: "^16.4.0",
} as const;

export const WEB_STACK = {
  react: "^19.1.0",
  reactDom: "^19.1.0",
  typesReact: "^19.1.0",
  typesReactDom: "^19.1.0",
  vite: "^6.3.5",
  vitest: "^3.0.5",
  typescript: "^5.7.3",
} as const;

export const CORE_STACK = {
  typescript: "^5.7.3",
  tsx: "^4.19.3",
  vitest: "^3.0.5",
} as const;

/** npm package name → version for generated @katalix/* dependencies. */
export const katalixDependencyVersions = (): Record<string, string> => ({
  "@katalix/app": KATALIX_VERSION,
  "@katalix/auth": KATALIX_VERSION,
  "@katalix/core": KATALIX_VERSION,
  "@katalix/data": KATALIX_VERSION,
  "@katalix/diagnostics": KATALIX_VERSION,
  "@katalix/dsl": KATALIX_VERSION,
  "@katalix/motion": KATALIX_VERSION,
  "@katalix/native": KATALIX_VERSION,
  "@katalix/navigation": KATALIX_VERSION,
  "@katalix/patterns": KATALIX_VERSION,
  "@katalix/react": KATALIX_VERSION,
  "@katalix/react-native": KATALIX_VERSION,
  "@katalix/storage": KATALIX_VERSION,
  "@katalix/tokens": KATALIX_VERSION,
  "@katalix/web": KATALIX_VERSION,
});

export const toNativeBundleId = (name: string): string =>
  `com.katalix.${name.replace(/[^a-z0-9]/gi, "").toLowerCase() || "app"}`;

/** Xcode target / folder name (no hyphens). */
export const toXcodeProjectName = (name: string): string =>
  name
    .split(/[-_.]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("") || "App";

export interface NativeCodegenMetadata {
  readonly moduleName: string;
  readonly displayName: string;
  readonly xcodeProjectName: string;
  readonly iosBundleId: string;
  readonly androidPackage: string;
}

export const buildNativeCodegenMetadata = (
  name: string,
  displayName: string,
): NativeCodegenMetadata => ({
  moduleName: name,
  displayName,
  xcodeProjectName: toXcodeProjectName(name),
  iosBundleId: toNativeBundleId(name),
  androidPackage: toNativeBundleId(name),
});
