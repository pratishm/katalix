import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { createStarterProject } from "./index.js";

const repoRoot = resolve(import.meta.dirname, "../../..");
const run = promisify(execFile);
const createdDirs: string[] = [];
const monorepoAppEntry = join(repoRoot, "packages/app/dist/index.js");

const ensureMonorepoBuilt = (): void => {
  if (!existsSync(monorepoAppEntry)) {
    throw new Error(
      "Template integration tests require built @katalix packages. " +
        "Run `npm run build` at the monorepo root first.",
    );
  }
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
    expect(ci).not.toContain("mobile-metro-e2e");
    expect(ci).not.toContain("RUN_MOBILE_METRO_BUNDLE_E2E");
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
    ensureMonorepoBuilt();
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

  it("installs and typechecks a react-native starter linked to the monorepo", async () => {
    ensureMonorepoBuilt();
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
  }, 120_000);

  it("installs and builds a web starter linked to the monorepo", async () => {
    ensureMonorepoBuilt();
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
    ensureMonorepoBuilt();
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
