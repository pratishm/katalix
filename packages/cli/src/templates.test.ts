import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { createStarterProject } from "./index.js";

const repoRoot = resolve(import.meta.dirname, "../../..");
const run = promisify(execFile);
const createdDirs: string[] = [];
const RUN_MOBILE_METRO_BUNDLE_E2E =
  process.env.RUN_MOBILE_METRO_BUNDLE_E2E === "1";

const isRetryableMetroBundleFailure = (message: string): boolean =>
  message.includes("Recrawled this watch") ||
  message.includes("Unable to resolve module ./NavigationContainer.js") ||
  message.includes("Unable to resolve module ./useLinkTo.js");

const runMetroBundleWithRetry = async (
  targetDirectory: string,
  bundleOut: string,
): Promise<void> => {
  let attempts = 0;
  let lastError: unknown;
  while (attempts < 3) {
    attempts += 1;
    try {
      await run(
        "npx",
        [
          "react-native",
          "bundle",
          "--platform",
          "ios",
          "--dev",
          "false",
          "--entry-file",
          "index.js",
          "--bundle-output",
          join(bundleOut, "main.jsbundle"),
          "--assets-dest",
          bundleOut,
          "--reset-cache",
        ],
        {
          cwd: targetDirectory,
          env: { ...process.env, CI: "true", RCT_NO_LAUNCH_PACKAGER: "true" },
        },
      );
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!isRetryableMetroBundleFailure(message) || attempts >= 3) {
        throw error;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
};

const makeTempDir = async () => {
  const dir = await mkdtemp(join(repoRoot, ".katalix-template-"));
  createdDirs.push(dir);
  return dir;
};

const readJson = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(path, "utf8")) as T;

const expectFile = async (path: string) => {
  await expect(stat(path)).resolves.toMatchObject({ isFile: expect.any(Function) });
};

const runGeneratedManifestTest = async (targetDirectory: string) => {
  const vitestBin = join(repoRoot, "node_modules/vitest/vitest.mjs");
  const { stderr } = await run(process.execPath, [
    vitestBin,
    "run",
    "src/katalix/manifest.test.ts",
  ], {
    cwd: targetDirectory,
  });

  expect(stderr).not.toContain("FAIL");
};

afterEach(async () => {
  await Promise.all(
    createdDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("template verification gate", () => {
  it("exposes a root template verification script and CI job steps", async () => {
    const rootPackage = await readJson<{ scripts: Record<string, string> }>(
      join(repoRoot, "package.json"),
    );
    const cliPackage = await readJson<{ scripts: Record<string, string> }>(
      join(repoRoot, "packages/cli/package.json"),
    );
    const ci = await readFile(join(repoRoot, ".github/workflows/ci.yml"), "utf8");

    expect(rootPackage.scripts["test:templates"]).toBe(
      "npm run test:templates --workspace @katalix/cli",
    );
    expect(cliPackage.scripts["test:templates"]).toBe("vitest run src/templates.test.ts");
    expect(ci).toContain("npm run test:templates");
    expect(ci).toContain("example:debug unexpectedly passed");
    expect(ci).toContain("npm run example:web");
    expect(ci).toContain("npm run example:native");
    expect(ci).toContain("npm run example:motion");
    expect(ci).toContain("npm run example:patterns");
  });

  it("documents web/mobile testing and release readiness", async () => {
    const docPaths = [
      "docs/web-testing.md",
      "docs/mobile-testing.md",
      "docs/web-release.md",
      "docs/mobile-release.md",
      "docs/privacy-checklist.md",
    ];

    for (const docPath of docPaths) {
      await expectFile(join(repoRoot, docPath));
    }

    await expect(readFile(join(repoRoot, "docs/web-testing.md"), "utf8")).resolves.toContain(
      "Playwright",
    );
    await expect(readFile(join(repoRoot, "docs/mobile-testing.md"), "utf8")).resolves.toContain(
      "Maestro",
    );
    await expect(readFile(join(repoRoot, "docs/web-release.md"), "utf8")).resolves.toContain(
      "rollback",
    );
    await expect(readFile(join(repoRoot, "docs/mobile-release.md"), "utf8")).resolves.toContain(
      "TestFlight",
    );
    await expect(readFile(join(repoRoot, "docs/privacy-checklist.md"), "utf8")).resolves.toContain(
      "PII",
    );
  });
});

describe("generated app integration templates", () => {
  it("generates verifiable web app projects with testing and release profiles", async () => {
    for (const router of ["react-router", "tanstack-router"] as const) {
      const targetDirectory = await makeTempDir();
      const result = await createStarterProject({
        name: `demo-web-${router}`,
        targetDirectory,
        router,
      });
      const packageJson = await readJson<{ scripts: Record<string, string> }>(
        join(targetDirectory, "package.json"),
      );

      expect(result.files).toContain("src/katalix/manifest.test.ts");
      expect(result.files).toContain("src/katalix/release.ts");
      expect(result.files).toContain("public/_headers");
      expect(result.files).toContain("privacy-checklist.md");
      expect(result.files).toContain("playwright.config.ts");
      expect(result.files).toContain("e2e/home.spec.ts");
      expect(result.files).toContain(".env.development");
      expect(result.files).toContain(".env.preview");
      expect(result.files).toContain(".env.production");
      expect(packageJson.scripts.typecheck).toBe("tsc -p tsconfig.json --noEmit");
      expect(packageJson.scripts["test:e2e"]).toContain("playwright");
      expect(packageJson.scripts["release:preview"]).toContain("vite build");
      expect(packageJson.scripts["release:production"]).toContain("vite build");
      await expect(readFile(join(targetDirectory, "src/katalix/release.ts"), "utf8")).resolves
        .toContain("preview");
      await expect(readFile(join(targetDirectory, "vite.config.ts"), "utf8")).resolves.toContain(
        "sourcemap",
      );
      await expect(readFile(join(targetDirectory, "privacy-checklist.md"), "utf8")).resolves
        .toContain("analytics");
      await runGeneratedManifestTest(targetDirectory);
    }
  });

  const metroBundleIt = RUN_MOBILE_METRO_BUNDLE_E2E ? it : it.skip;
  metroBundleIt("installs, typechecks, and Metro-bundles a react-native starter linked to the monorepo", async () => {
    const targetDirectory = await makeTempDir();
    await createStarterProject({
      name: "demo-mobile-local",
      targetDirectory,
      target: "react-native",
      linkLocal: true,
    });

    await run("npm", ["install"], { cwd: targetDirectory });
    await run("npm", ["run", "typecheck"], { cwd: targetDirectory });
    await run("npm", ["test"], { cwd: targetDirectory });

    const bundleOut = join(targetDirectory, ".katalix-bundle");
    await mkdir(bundleOut, { recursive: true });
    await runMetroBundleWithRetry(targetDirectory, bundleOut);
  }, 180_000);

  it("installs and builds a web starter linked to the monorepo", async () => {
    const targetDirectory = await makeTempDir();
    await createStarterProject({
      name: "demo-web-local",
      targetDirectory,
      router: "react-router",
      linkLocal: true,
    });

    await run("npm", ["install"], { cwd: targetDirectory });
    await run("npm", ["run", "typecheck"], { cwd: targetDirectory });
    await run("npm", ["run", "build"], { cwd: targetDirectory });
  }, 120_000);

  it("generates verifiable mobile projects with testing and release profiles", async () => {
    for (const target of ["expo", "react-native"] as const) {
      const targetDirectory = await makeTempDir();
      const result = await createStarterProject({
        name: `demo-mobile-${target}`,
        targetDirectory,
        target,
      });
      const packageJson = await readJson<{ scripts: Record<string, string> }>(
        join(targetDirectory, "package.json"),
      );

      expect(result.files).toContain("src/katalix/manifest.test.ts");
      expect(result.files).toContain("src/katalix/release.ts");
      expect(result.files).toContain("release-profiles.json");
      expect(result.files).toContain("privacy-checklist.md");
      expect(result.files).toContain("e2e/home.yml");
      expect(packageJson.scripts.typecheck).toBe("tsc -p tsconfig.json --noEmit");
      expect(packageJson.scripts["test:e2e"]).toBe("maestro test e2e/home.yml");
      expect(packageJson.scripts["release:preview"]).toBeDefined();
      expect(packageJson.scripts["release:production"]).toBeDefined();
      await expect(readFile(join(targetDirectory, "src/katalix/release.ts"), "utf8")).resolves
        .toContain("storeSubmission");
      await expect(readFile(join(targetDirectory, "privacy-checklist.md"), "utf8")).resolves
        .toContain("permissions");
      await runGeneratedManifestTest(targetDirectory);

      expect(packageJson.scripts.bootstrap).toBeDefined();
      expect(result.files).toContain(
        target === "expo" ? "scripts/bootstrap-native.mjs" : "scripts/bootstrap-native.cjs",
      );

      if (target === "expo") {
        expect(result.files).toContain("eas.json");
      }
    }
  });
});
