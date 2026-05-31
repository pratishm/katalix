import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type PackageJson = {
  readonly bin?: Record<string, string>;
  readonly dependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly peerDependenciesMeta?: Record<string, { optional?: boolean }>;
};

const packageDir = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = resolve(packageDir, "../package.json");
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as PackageJson;

const MANDATORY_PACKAGES = [
  "@katalix/cli",
  "@katalix/core",
  "@katalix/diagnostics",
  "@katalix/dsl",
  "@katalix/motion",
  "@katalix/patterns",
  "@katalix/tokens",
] as const;

const OPTIONAL_PACKAGES = [
  "@katalix/app",
  "@katalix/auth",
  "@katalix/data",
  "@katalix/native",
  "@katalix/navigation",
  "@katalix/react",
  "@katalix/react-native",
  "@katalix/storage",
  "@katalix/web",
] as const;

// Resolve a workspace package's published version from its own package.json so
// the umbrella's pins are verified against reality rather than hardcoded
// literals that must be hand-edited on every release bump.
const readWorkspaceVersion = async (packageName: string): Promise<string> => {
  const workspaceDir = packageName.replace("@katalix/", "");
  const workspacePackageJsonPath = resolve(packageDir, `../../${workspaceDir}/package.json`);
  const workspacePackageJson = JSON.parse(
    await readFile(workspacePackageJsonPath, "utf8"),
  ) as { readonly version: string };
  return workspacePackageJson.version;
};

const expectedVersions = Object.fromEntries(
  await Promise.all(
    [...MANDATORY_PACKAGES, ...OPTIONAL_PACKAGES].map(
      async (packageName) => [packageName, await readWorkspaceVersion(packageName)] as const,
    ),
  ),
) as Record<string, string>;

describe("katalix umbrella package", () => {
  it("pins every mandatory Katalix framework package to its workspace version", () => {
    for (const packageName of MANDATORY_PACKAGES) {
      expect(packageJson.dependencies?.[packageName]).toBe(expectedVersions[packageName]);
    }
  });

  it("keeps platform and app-runtime packages optional and pinned to their workspace version", () => {
    for (const packageName of OPTIONAL_PACKAGES) {
      expect(packageJson.peerDependencies?.[packageName]).toBe(expectedVersions[packageName]);
      expect(packageJson.peerDependenciesMeta?.[packageName]?.optional).toBe(true);
    }
  });

  it("publishes the katalix CLI binary", () => {
    expect(packageJson.bin).toEqual({ katalix: "./dist/cli.js" });
  });
});
