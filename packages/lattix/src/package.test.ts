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

const packageJsonPath = resolve(dirname(fileURLToPath(import.meta.url)), "../package.json");
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as PackageJson;

describe("lattix umbrella package", () => {
  it("installs the mandatory Lattix framework packages", () => {
    expect(packageJson.dependencies).toMatchObject({
      "@lattix/cli": "1.0.0",
      "@lattix/core": "1.0.0",
      "@lattix/diagnostics": "1.0.0",
      "@lattix/dsl": "1.0.0",
      "@lattix/motion": "1.0.0",
      "@lattix/patterns": "1.0.0",
      "@lattix/tokens": "1.0.0",
    });
  });

  it("keeps platform and app-runtime packages optional", () => {
    const optionalPackages = [
      "@lattix/app",
      "@lattix/auth",
      "@lattix/data",
      "@lattix/native",
      "@lattix/navigation",
      "@lattix/react",
      "@lattix/react-native",
      "@lattix/storage",
      "@lattix/web",
    ];

    for (const packageName of optionalPackages) {
      expect(packageJson.peerDependencies?.[packageName]).toBe("1.0.0");
      expect(packageJson.peerDependenciesMeta?.[packageName]?.optional).toBe(true);
    }
  });

  it("publishes the lattix CLI binary", () => {
    expect(packageJson.bin).toEqual({ lattix: "./dist/cli.js" });
  });
});
