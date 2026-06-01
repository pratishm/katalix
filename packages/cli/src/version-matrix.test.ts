import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { KATALIX_VERSION, REACT_NATIVE_STACK } from "./version-matrix.js";

describe("version matrix", () => {
  it("matches the published @katalix/cli package version", async () => {
    const packageJsonPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../package.json",
    );
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
      version: string;
    };
    expect(KATALIX_VERSION).toBe(packageJson.version);
  });

  it("pins react and react-native on the validated Fabric line", () => {
    expect(REACT_NATIVE_STACK.react).toBe("19.0.0");
    expect(REACT_NATIVE_STACK.reactNative).toBe("0.79.7");
    expect(REACT_NATIVE_STACK.metroConfig).toBe(REACT_NATIVE_STACK.reactNative);
    expect(REACT_NATIVE_STACK.babelPreset).toBe(REACT_NATIVE_STACK.reactNative);
  });
});
