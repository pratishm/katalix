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

const cliPackageJsonPath = resolve(packageDir, "../../cli/package.json");
const cliPackageJson = JSON.parse(await readFile(cliPackageJsonPath, "utf8")) as {
  readonly version: string;
};

describe("katalix umbrella package", () => {
  it("installs the mandatory Katalix framework packages", () => {
    expect(packageJson.dependencies).toMatchObject({
      "@katalix/cli": cliPackageJson.version,
      "@katalix/core": "1.0.0",
      "@katalix/diagnostics": "1.0.0",
      "@katalix/dsl": "1.0.0",
      "@katalix/motion": "1.0.0",
      "@katalix/patterns": "1.0.0",
      "@katalix/tokens": "1.0.0",
    });
  });

  it("keeps platform and app-runtime packages optional", () => {
    const optionalPackages = [
      "@katalix/app",
      "@katalix/auth",
      "@katalix/data",
      "@katalix/native",
      "@katalix/navigation",
      "@katalix/react",
      "@katalix/react-native",
      "@katalix/storage",
      "@katalix/web",
    ];

    for (const packageName of optionalPackages) {
      expect(packageJson.peerDependencies?.[packageName]).toBe("1.0.0");
      expect(packageJson.peerDependenciesMeta?.[packageName]?.optional).toBe(true);
    }
  });

  it("publishes the katalix CLI binary", () => {
    expect(packageJson.bin).toEqual({ katalix: "./dist/cli.js" });
  });
});
