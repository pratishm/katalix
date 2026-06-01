import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createStarterProject,
  renderMobileAppStarterProject,
  renderStarterProject,
  renderWebAppStarterProject,
} from "./index.js";

const createdDirs: string[] = [];

const makeTempDir = async () => {
  const dir = await mkdtemp(join(tmpdir(), "katalix-cli-"));
  createdDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(
    createdDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("renderStarterProject", () => {
  it("renders a minimal Katalix Core starter project", () => {
    const files = renderStarterProject({ name: "demo-app" });

    expect(files["package.json"]).toContain("\"name\": \"demo-app\"");
    expect(files["src/home.screen.ts"]).toContain("Screen(\"Home\"");
    expect(files["src/index.ts"]).toContain("home.toTree()");
    expect(files["README.md"]).toContain("# demo-app");
  });
});

describe("renderWebAppStarterProject", () => {
  it("renders a Vite React starter for React Router", () => {
    const files = renderWebAppStarterProject({
      name: "demo-web",
      router: "react-router",
    });

    expect(files["package.json"]).toContain("\"@katalix/react\": \"1.0.0\"");
    expect(files["package.json"]).toContain("\"react-router-dom\"");
    expect(files["src/router.tsx"]).toContain("createBrowserRouter");
    expect(files["src/router.tsx"]).toContain("routeAdapterContract");
    expect(files["src/katalix/navigation.ts"]).toContain("adapter: \"react-router\"");
    expect(files["README.md"]).toContain("React Router");
    expect(files[".env.example"]).toContain("VITE_API_URL");
    expect(files["src/App.tsx"]).toContain("id=\"main-content\"");
  });

  it("renders a Vite React starter for TanStack Router", () => {
    const files = renderWebAppStarterProject({
      name: "demo-web",
      router: "tanstack-router",
    });

    expect(files["package.json"]).toContain("\"@tanstack/react-router\"");
    expect(files["src/router.tsx"]).toContain("createRootRoute");
    expect(files["src/router.tsx"]).toContain("routeAdapterContract");
    expect(files["src/katalix/navigation.ts"]).toContain("adapter: \"tanstack-router\"");
    expect(files["README.md"]).toContain("TanStack Router");
  });
});

describe("renderMobileAppStarterProject", () => {
  it("renders an Expo React Native starter", () => {
    const files = renderMobileAppStarterProject({
      name: "demo-mobile",
      target: "expo",
    });

    expect(files["package.json"]).toContain("\"expo\"");
    expect(files["package.json"]).toContain("\"@react-navigation/native\"");
    expect(files["package.json"]).toContain("\"react-native-screens\": \"~4.11.0\"");
    expect(files["app.json"]).toContain("\"name\": \"demo-mobile\"");
    expect(files["App.tsx"]).toContain("./src/App");
    expect(files["App.tsx"]).not.toContain("./src/App.js");
    expect(files["src/katalix/native.ts"]).toContain("target(\"expo\"");
    expect(files["src/App.tsx"]).toContain("NavigationContainer");
    expect(files["src/App.tsx"]).toContain("nativeScreens");
    expect(files["src/App.tsx"]).toContain("flattenScreens");
    expect(files["src/App.tsx"]).not.toContain(".js\";");
    expect(files["src/App.tsx"]).toContain("KatalixNativeRenderer");
    expect(files["README.md"]).toContain("Expo");
  });

  it("renders a plain React Native starter", () => {
    const files = renderMobileAppStarterProject({
      name: "demo-mobile",
      target: "react-native",
    });

    expect(files["package.json"]).toContain("\"react-native\"");
    expect(files["package.json"]).toContain("\"@react-navigation/native-stack\"");
    expect(files["package.json"]).toContain("\"react-native-screens\": \"~4.11.0\"");
    expect(files["index.js"]).toContain("AppRegistry.registerComponent");
    expect(files["src/katalix/native.ts"]).toContain("target(\"react-native\"");
    expect(files["src/App.tsx"]).toContain("NavigationContainer");
    expect(files["src/App.tsx"]).toContain("flattenScreens");
    expect(files["src/App.tsx"]).not.toContain(".js\";");
    expect(files["README.md"]).toContain("plain React Native");
  });
});

describe("createStarterProject", () => {
  it("writes starter files into an empty target directory", async () => {
    const targetDirectory = await makeTempDir();

    const result = await createStarterProject({
      name: "demo-app",
      targetDirectory,
    });

    expect(result.files).toEqual([
      "README.md",
      "package.json",
      "src/home.screen.ts",
      "src/index.ts",
      "tsconfig.json",
    ]);
    await expect(readFile(join(targetDirectory, "src/home.screen.ts"), "utf8")).resolves.toContain(
      "Welcome to Katalix",
    );
  });

  it("writes selected web app starter files", async () => {
    const targetDirectory = await makeTempDir();

    const result = await createStarterProject({
      name: "demo-web",
      targetDirectory,
      template: "web-app",
      router: "tanstack-router",
    });

    expect(result.files).toContain("src/router.tsx");
    await expect(readFile(join(targetDirectory, "src/router.tsx"), "utf8")).resolves.toContain(
      "createRootRoute",
    );
  });

  it("writes selected mobile app starter files", async () => {
    const targetDirectory = await makeTempDir();

    const result = await createStarterProject({
      name: "demo-mobile",
      targetDirectory,
      template: "mobile-app",
      target: "expo",
    });

    expect(result.files).toContain("app.json");
    await expect(readFile(join(targetDirectory, "src/App.tsx"), "utf8")).resolves.toContain(
      "KatalixNativeRenderer",
    );
  });

  it("refuses to overwrite existing files unless force is enabled", async () => {
    const targetDirectory = await makeTempDir();
    await writeFile(join(targetDirectory, "README.md"), "existing");

    await expect(
      createStarterProject({ name: "demo-app", targetDirectory }),
    ).rejects.toThrow("Refusing to scaffold into a non-empty directory");
  });
});
