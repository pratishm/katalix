import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Single source of truth for Katalix release and React Native stack versions.
 * Used by CLI templates, bootstrap scripts, and doctor checks.
 *
 * RN 0.79.7 + React 19.0.0 exact — Fabric renderer mismatch otherwise.
 */
export const KATALIX_VERSION = "2.0.0";

const KATALIX_PACKAGE_NAMES = [
  "@katalix/app",
  "@katalix/auth",
  "@katalix/core",
  "@katalix/data",
  "@katalix/diagnostics",
  "@katalix/dsl",
  "@katalix/host",
  "@katalix/i18n",
  "@katalix/motion",
  "@katalix/native",
  "@katalix/navigation",
  "@katalix/patterns",
  "@katalix/react",
  "@katalix/react-native",
  "@katalix/runtime-auth",
  "@katalix/runtime-data",
  "@katalix/runtime-i18n",
  "@katalix/runtime-native-layout",
  "@katalix/runtime-navigation",
  "@katalix/runtime-observability",
  "@katalix/runtime-push",
  "@katalix/runtime-pwa",
  "@katalix/runtime-storage",
  "@katalix/storage",
  "@katalix/tokens",
  "@katalix/web",
] as const;

/** Locate `packages/` when the CLI runs from the Katalix monorepo (dev or linked). */
export const findMonorepoPackagesDir = (): string | null => {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 8; depth += 1) {
    const packagesDir = join(dir, "packages");
    if (existsSync(join(packagesDir, "core", "package.json"))) {
      return packagesDir;
    }
    dir = dirname(dir);
  }
  return null;
};

export interface KatalixDependencyVersionOptions {
  /** Use `file:` specifiers into the monorepo `packages/` directory. */
  readonly linkLocal?: boolean;
  /** Override packages root (defaults to detected monorepo). */
  readonly packagesDir?: string;
}

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

/** npm package name → version or `file:` path for generated @katalix/* dependencies. */
export const katalixDependencyVersions = (
  options: KatalixDependencyVersionOptions = {},
): Record<string, string> => {
  if (!options.linkLocal) {
    return Object.fromEntries(
      KATALIX_PACKAGE_NAMES.map((name) => [name, KATALIX_VERSION]),
    );
  }

  const packagesDir = options.packagesDir ?? findMonorepoPackagesDir();
  if (!packagesDir) {
    throw new Error(
      "Could not find the Katalix monorepo packages/ directory. " +
        "Run `katalix create` with --local from a Katalix checkout, or publish @katalix/* to npm first.",
    );
  }

  return Object.fromEntries(
    KATALIX_PACKAGE_NAMES.map((name) => {
      const folder = name.replace("@katalix/", "");
      return [name, `file:${resolve(packagesDir, folder)}`];
    }),
  );
};

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
