import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type StarterTemplate = "core" | "web-app" | "mobile-app";
export type WebRouterAdapter = "react-router" | "tanstack-router";
export type NativeAppTarget = "expo" | "react-native";

export interface RenderStarterProjectOptions {
  name: string;
}

export interface RenderWebAppStarterProjectOptions extends RenderStarterProjectOptions {
  router: WebRouterAdapter;
}

export interface RenderMobileAppStarterProjectOptions extends RenderStarterProjectOptions {
  target: NativeAppTarget;
}

export interface CreateStarterProjectOptions extends RenderStarterProjectOptions {
  targetDirectory: string;
  force?: boolean;
  template?: StarterTemplate;
  router?: string;
  target?: string;
}

export interface CreateStarterProjectResult {
  name: string;
  targetDirectory: string;
  files: string[];
  template: StarterTemplate;
  startScript: string;
}

const TEMPLATE_START_SCRIPT: Record<StarterTemplate, string> = {
  core: "inspect",
  "web-app": "dev",
  "mobile-app": "start",
};

export type StarterProjectFiles = Record<string, string>;

const STARTER_FILE_ORDER = [
  "README.md",
  "package.json",
  "src/home.screen.ts",
  "src/index.ts",
  "tsconfig.json",
] as const;

const WEB_APP_FILE_ORDER = [
  "README.md",
  "package.json",
  "index.html",
  ".env.example",
  ".env.development",
  ".env.preview",
  ".env.production",
  "public/_headers",
  "playwright.config.ts",
  "e2e/home.spec.ts",
  "src/main.tsx",
  "src/App.tsx",
  "src/router.tsx",
  "src/screens/home.screen.ts",
  "src/katalix/app.ts",
  "src/katalix/data.ts",
  "src/katalix/diagnostics.ts",
  "src/katalix/navigation.ts",
  "src/katalix/release.ts",
  "src/katalix/storage.ts",
  "src/katalix/web.ts",
  "src/katalix/manifest.test.ts",
  "privacy-checklist.md",
  "tsconfig.json",
  "vite.config.ts",
  "vitest.config.ts",
] as const;

const SHARED_MOBILE_FILE_ORDER = [
  "README.md",
  "package.json",
  "app.json",
  "App.tsx",
  ".env.example",
  "src/App.tsx",
  "src/screens/home.screen.ts",
  "src/katalix/app.ts",
  "src/katalix/auth.ts",
  "src/katalix/data.ts",
  "src/katalix/diagnostics.ts",
  "src/katalix/native.ts",
  "src/katalix/navigation.ts",
  "src/katalix/release.ts",
  "src/katalix/storage.ts",
  "src/katalix/manifest.test.ts",
  "release-profiles.json",
  "privacy-checklist.md",
  "store-metadata/README.md",
  "e2e/home.yml",
  "tsconfig.json",
] as const;

const EXPO_EXTRA_FILE_ORDER = ["eas.json"] as const;
const PLAIN_REACT_NATIVE_EXTRA_FILE_ORDER = ["index.js"] as const;

const WEB_ROUTERS = new Set(["react-router", "tanstack-router"]);
const NATIVE_TARGETS = new Set(["expo", "react-native"]);

const validateProjectName = (name: string) => {
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) {
    throw new Error(
      `Invalid project name "${name}". Use lowercase letters, numbers, dots, hyphens, or underscores.`,
    );
  }
};

const titleCaseName = (name: string) =>
  name
    .split(/[-_.]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const toPackageJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

const normalizeWebRouter = (selected: string | undefined = "react-router"): WebRouterAdapter => {
  if (!WEB_ROUTERS.has(selected)) {
    throw new Error(
      `Unsupported web router "${selected}". Use "react-router" or "tanstack-router".`,
    );
  }

  return selected as WebRouterAdapter;
};

const normalizeNativeTarget = (selected: string | undefined = "expo"): NativeAppTarget => {
  if (!NATIVE_TARGETS.has(selected)) {
    throw new Error(
      `Unsupported mobile target "${selected}". Use "expo" or "react-native".`,
    );
  }

  return selected as NativeAppTarget;
};

const resolveStarterTemplate = ({
  template,
  router,
  target,
}: Pick<CreateStarterProjectOptions, "router" | "target" | "template">): StarterTemplate => {
  if (router && target) {
    throw new Error("Choose either --router for a web app or --target for a mobile app, not both.");
  }

  if (template) {
    return template;
  }

  if (router) {
    return "web-app";
  }

  if (target) {
    return "mobile-app";
  }

  return "core";
};

export const renderStarterProject = ({
  name,
}: RenderStarterProjectOptions): StarterProjectFiles => {
  validateProjectName(name);

  return {
    "README.md": `# ${name}

Generated with Katalix CLI.

## Getting started

\`\`\`bash
npm install
npm run inspect
\`\`\`

## Scripts

- \`npm run inspect\` prints the normalized Katalix tree for the sample screen.
`,
    "package.json": toPackageJson({
      name,
      private: true,
      type: "module",
      scripts: {
        inspect: "node --enable-source-maps --import tsx src/index.ts",
      },
      dependencies: {
        "@katalix/dsl": "1.0.0",
      },
      devDependencies: {
        tsx: "^4.19.3",
        typescript: "^5.7.3",
      },
    }),
    "src/home.screen.ts": `import { Screen } from "@katalix/dsl";

export const home = Screen("Home", (screen) =>
  screen.padding(16).stack({ gap: 12 }, (stack) =>
    stack
      .text("Welcome to Katalix")
      .size(28)
      .weight("bold")
      .text("Edit src/home.screen.ts to start building your UI.")
      .color("text.muted"),
  ),
);
`,
    "src/index.ts": `import { home } from "./home.screen.js";

const tree = home.toTree();

console.log(JSON.stringify(tree, null, 2));
`,
    "tsconfig.json": toPackageJson({
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
      },
      include: ["src/**/*"],
    }),
  };
};

const renderReactRouterHost = () => ({
  main: `import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.js";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
`,
  router: `import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { App } from "./App.js";
import { routeAdapterContract } from "./katalix/navigation.js";

const screenElements: Record<string, React.ReactNode> = {
  HomeScreen: <App />,
};

const routes = routeAdapterContract.map((route) => ({
  id: route.id,
  path: route.path,
  element: screenElements[route.elementRef ?? "HomeScreen"] ?? <App />,
}));

export const router = createBrowserRouter(routes);
`,
});

const renderTanStackRouterHost = () => ({
  main: `import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router.js";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
`,
  router: `import React from "react";
import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { App } from "./App.js";
import { routeAdapterContract } from "./katalix/navigation.js";

const screenComponents: Record<string, React.ComponentType> = {
  HomeScreen: App,
};

const rootRoute = createRootRoute({
  component: App,
});

const indexRouteContract = routeAdapterContract[0];

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: indexRouteContract?.path ?? "/",
  component: screenComponents[indexRouteContract?.componentRef ?? "HomeScreen"] ?? App,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });
`,
});

export const renderWebAppStarterProject = ({
  name,
  router,
}: RenderWebAppStarterProjectOptions): StarterProjectFiles => {
  validateProjectName(name);
  const selectedRouter = normalizeWebRouter(router);
  const title = titleCaseName(name);
  const routerTitle = selectedRouter === "react-router" ? "React Router" : "TanStack Router";
  const routerDependency =
    selectedRouter === "react-router"
      ? { "react-router-dom": "^7.6.0" }
      : { "@tanstack/react-router": "^1.120.0" };
  const routerHost =
    selectedRouter === "react-router" ? renderReactRouterHost() : renderTanStackRouterHost();

  return {
    "README.md": `# ${name}

Generated with Katalix CLI as a Vite React app using ${routerTitle}.

## Scripts

- \`npm run dev\` starts the Vite dev server.
- \`npm run build\` type-checks and builds the web app.
- \`npm test\` verifies the generated Katalix manifests.

## Katalix files

- \`src/screens/home.screen.ts\` defines the sample semantic UI tree.
- \`src/katalix/navigation.ts\` declares the shared route manifest and ${routerTitle} adapter contract.
- \`src/katalix/app.ts\`, \`data.ts\`, \`storage.ts\`, and \`web.ts\` declare app runtime manifests consumed by host adapters.
`,
    "package.json": toPackageJson({
      name,
      private: true,
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc -p tsconfig.json && vite build",
        preview: "vite preview",
        test: "vitest run --config vitest.config.ts",
        typecheck: "tsc -p tsconfig.json --noEmit",
        "test:e2e": "playwright test",
        "release:preview": "vite build --mode preview",
        "release:production": "vite build --mode production",
      },
      dependencies: {
        "@katalix/app": "1.0.0",
        "@katalix/data": "1.0.0",
        "@katalix/dsl": "1.0.0",
        "@katalix/navigation": "1.0.0",
        "@katalix/react": "1.0.0",
        "@katalix/storage": "1.0.0",
        "@katalix/web": "1.0.0",
        react: "^19.1.0",
        "react-dom": "^19.1.0",
        ...routerDependency,
      },
      devDependencies: {
        "@types/react": "^19.1.0",
        "@types/react-dom": "^19.1.0",
        "@vitejs/plugin-react": "^4.5.0",
        "@playwright/test": "^1.52.0",
        typescript: "^5.7.3",
        vite: "^6.3.5",
        vitest: "^3.0.5",
      },
    }),
    "index.html": `<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
`,
    ".env.example": `VITE_API_URL=https://api.example.com
`,
    ".env.development": `VITE_API_URL=http://localhost:3000
VITE_KATALIX_RELEASE_CHANNEL=development
VITE_KATALIX_SOURCE_MAPS=true
`,
    ".env.preview": `VITE_API_URL=https://preview-api.example.com
VITE_KATALIX_RELEASE_CHANNEL=preview
VITE_KATALIX_SOURCE_MAPS=true
`,
    ".env.production": `VITE_API_URL=https://api.example.com
VITE_KATALIX_RELEASE_CHANNEL=production
VITE_KATALIX_SOURCE_MAPS=false
`,
    "public/_headers": `/*
  Cache-Control: public, max-age=0, must-revalidate
  Content-Security-Policy: default-src 'self'; connect-src 'self' https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`,
    "playwright.config.ts": `import { defineConfig } from "@playwright/test";

export default defineConfig({
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
  },
});
`,
    "e2e/home.spec.ts": `import { expect, test } from "@playwright/test";

test("renders the generated Katalix home screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Welcome to ${title}")).toBeVisible();
  await expect(page.getByTestId("katalix-diagnostics")).toContainText(
    "All generated Katalix manifests are valid.",
  );
});
`,
    "src/main.tsx": routerHost.main,
    "src/App.tsx": `import React from "react";
import { KatalixRenderer } from "@katalix/react";
import { home } from "./screens/home.screen.js";
import { appManifest } from "./katalix/app.js";
import { dataManifest } from "./katalix/data.js";
import { diagnosticsSummary } from "./katalix/diagnostics.js";
import { routeManifest } from "./katalix/navigation.js";
import { storageManifest } from "./katalix/storage.js";
import { webManifest } from "./katalix/web.js";

const tree = home.toTree();

export const App = () => (
  <main id="main-content">
    <KatalixRenderer tree={tree} onAction={(action) => console.log("action:", action)} />
    <pre data-testid="katalix-diagnostics">
      {diagnosticsSummary([appManifest, routeManifest, dataManifest, storageManifest, webManifest])}
    </pre>
  </main>
);
`,
    "src/router.tsx": routerHost.router,
    "src/screens/home.screen.ts": `import { Screen } from "@katalix/dsl";

export const home = Screen("${title} Home", (screen) =>
  screen.padding(24).stack({ gap: 12 }, (stack) =>
    stack
      .text("Welcome to ${title}")
      .size(28)
      .weight("bold")
      .text("This screen is rendered through the Katalix React renderer.")
      .color("text.muted")
      .button("Inspect app manifests", (button) => button.onPress("inspect-manifests")),
  ),
);
`,
    "src/katalix/app.ts": `import { App } from "@katalix/app";

export const appManifest = App("${title}")
  .platforms(["web"])
  .environment((env) => env.variable("VITE_API_URL", { required: true }))
  .providers((providers) =>
    providers
      .provider("router", { adapter: "${selectedRouter}" })
      .provider("renderer", { adapter: "react" }),
  )
  .toManifest();
`,
    "src/katalix/data.ts": `import { Data } from "@katalix/data";

export const dataManifest = Data("${title} API")
  .baseUrl("env:VITE_API_URL")
  .resource("todos", (resource) =>
    resource.query("list", "GET", "/todos", (query) =>
      query.cacheKey("todos").state("loading").state("success").errorMap("default-error"),
    ),
  )
  .toManifest();
`,
    "src/katalix/diagnostics.ts": `type ManifestWithValidation = {
  readonly validation: {
    readonly valid: boolean;
    readonly diagnostics: readonly unknown[];
  };
};

export const diagnosticsSummary = (manifests: readonly ManifestWithValidation[]) => {
  const invalid = manifests.filter((manifest) => !manifest.validation.valid);

  if (invalid.length === 0) {
    return "All generated Katalix manifests are valid.";
  }

  return JSON.stringify(
    invalid.flatMap((manifest) => manifest.validation.diagnostics),
    null,
    2,
  );
};
`,
    "src/katalix/navigation.ts": `import {
  Navigation,
  ${selectedRouter === "react-router" ? "createReactRouterRoutes" : "createTanStackRouteTree"},
} from "@katalix/navigation";

export const routeManifest = Navigation("${title} Routes")
  .routes((routes) => routes.screen("home", "HomeScreen", (route) => route.path("/")))
  .toManifest({ adapter: "${selectedRouter}", platform: "web" });

export const routeAdapterContract = ${
      selectedRouter === "react-router"
        ? "createReactRouterRoutes(routeManifest)"
        : "createTanStackRouteTree(routeManifest)"
    };
`,
    "src/katalix/release.ts": `export const webReleaseProfiles = {
  development: {
    environment: ".env.development",
    sourceMaps: true,
    cacheHeaders: "public/_headers",
    previewDeployments: false,
    rollback: "Re-deploy the previous static artifact from hosting history.",
  },
  preview: {
    environment: ".env.preview",
    sourceMaps: true,
    cacheHeaders: "public/_headers",
    previewDeployments: true,
    rollback: "Promote the prior preview artifact or restore the previous CDN version.",
  },
  production: {
    environment: ".env.production",
    sourceMaps: false,
    cacheHeaders: "public/_headers",
    previewDeployments: false,
    rollback: "Pin the CDN to the last known-good artifact and invalidate changed paths.",
  },
} as const;

export type WebReleaseChannel = keyof typeof webReleaseProfiles;
`,
    "src/katalix/storage.ts": `import { Storage } from "@katalix/storage";

export const storageManifest = Storage("${title} Storage")
  .keyValue("settings", { adapter: "localStorage" })
  .documentStore("offline-cache", { adapter: "indexeddb" }, (store) =>
    store.migration(1, "initial-cache"),
  )
  .toManifest({ platform: "web" });
`,
    "src/katalix/web.ts": `import { Web } from "@katalix/web";

export const webManifest = Web("${title} Web")
  .metadata((metadata) =>
    metadata
      .title("${title}")
      .description("Generated Katalix Vite React starter")
      .canonical("https://example.com/"),
  )
  .viewport({ width: "device-width", initialScale: 1 })
  .skipLink("main-content")
  .routeBoundary("home", { loading: "HomeLoading", error: "HomeError" })
  .rendering({ mode: "spa", framework: "vite" })
  .storage("settings", { adapter: "localStorage" })
  .toManifest();
`,
    "src/katalix/manifest.test.ts": `import { describe, expect, it } from "vitest";
import { appManifest } from "./app.js";
import { dataManifest } from "./data.js";
import { routeManifest } from "./navigation.js";
import { webReleaseProfiles } from "./release.js";
import { storageManifest } from "./storage.js";
import { webManifest } from "./web.js";

describe("generated web Katalix manifests", () => {
  it("are valid and adapter-selected", () => {
    expect(appManifest.validation.valid).toBe(true);
    expect(routeManifest.validation.valid).toBe(true);
    expect(dataManifest.validation.valid).toBe(true);
    expect(storageManifest.validation.valid).toBe(true);
    expect(webManifest.validation.valid).toBe(true);
    expect(webReleaseProfiles.preview.previewDeployments).toBe(true);
  });
});
`,
    "privacy-checklist.md": `# Privacy Checklist

- [ ] Cookies document purpose, SameSite policy, and expiration.
- [ ] Analytics events avoid PII unless explicit consent is declared.
- [ ] analytics provider settings are separated for preview and production.
- [ ] Browser storage avoids sensitive data in localStorage.
- [ ] Error reporting scrubs tokens, emails, and user-generated content.
- [ ] Data retention and deletion paths are documented before production release.
`,
    "tsconfig.json": toPackageJson({
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        jsx: "react-jsx",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
      },
      include: ["src/**/*", "vite.config.ts"],
    }),
    "vite.config.ts": `import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    build: {
      sourcemap: env.VITE_KATALIX_SOURCE_MAPS === "true",
    },
  };
});
`,
    "vitest.config.ts": `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
`,
  };
};

export const renderMobileAppStarterProject = ({
  name,
  target,
}: RenderMobileAppStarterProjectOptions): StarterProjectFiles => {
  validateProjectName(name);
  const selectedTarget = normalizeNativeTarget(target);
  const title = titleCaseName(name);
  const targetTitle = selectedTarget === "expo" ? "Expo" : "plain React Native";
  const appIdentifier = `com.katalix.${name.replace(/[^a-z0-9]/g, "") || "app"}`;

  return {
    "README.md": `# ${name}

Generated with Katalix CLI as a ${targetTitle} starter.

## Scripts

- \`npm run start\` starts the native dev server.
- \`npm test\` verifies the generated Katalix manifests.

## Katalix files

- \`src/screens/home.screen.ts\` defines the sample semantic UI tree.
- \`src/katalix/navigation.ts\`, \`data.ts\`, \`auth.ts\`, and \`storage.ts\` define app runtime contracts.
- \`src/katalix/native.ts\` declares the ${targetTitle} native target, permissions, layout, and accessibility contracts.
`,
    "package.json": toPackageJson({
      name,
      private: true,
      type: "module",
      scripts:
        selectedTarget === "expo"
          ? {
              start: "expo start",
              android: "expo start --android",
              ios: "expo start --ios",
              test: "vitest run",
              typecheck: "tsc -p tsconfig.json --noEmit",
              "test:e2e": "maestro test e2e/home.yml",
              "release:preview": "eas build --profile preview",
              "release:production": "eas build --profile production",
            }
          : {
              start: "react-native start",
              android: "react-native run-android",
              ios: "react-native run-ios",
              test: "vitest run",
              typecheck: "tsc -p tsconfig.json --noEmit",
              "test:e2e": "maestro test e2e/home.yml",
              "release:preview": "echo \"Build a signed preview binary using release-profiles.json\"",
              "release:production": "echo \"Build store binaries using release-profiles.json\"",
            },
      dependencies: {
        "@react-navigation/native": "^7.1.0",
        "@react-navigation/native-stack": "^7.3.0",
        "@katalix/app": "1.0.0",
        "@katalix/auth": "1.0.0",
        "@katalix/data": "1.0.0",
        "@katalix/dsl": "1.0.0",
        "@katalix/native": "1.0.0",
        "@katalix/navigation": "1.0.0",
        "@katalix/react-native": "1.0.0",
        "@katalix/storage": "1.0.0",
        ...(selectedTarget === "expo" ? { expo: "^53.0.0" } : {}),
        react: "^19.1.0",
        "react-native": "^0.79.0",
        "react-native-safe-area-context": "^5.4.0",
        // Tilde-pinned: react-native-screens >= 4.14 raises its peer to
        // react-native >= 0.82, which conflicts with the RN 0.79 baseline
        // above. Restrict to 4.11.x (peer react-native: *) so a clean install
        // resolves without ERESOLVE.
        "react-native-screens": "~4.11.0",
      },
      devDependencies: {
        "@types/react": "^19.1.0",
        // Since React Native 0.75 the start/run-android/run-ios commands live
        // in @react-native-community/cli, which RN no longer bundles. The CLI
        // major tracks the RN minor (RN 0.79 -> CLI 18), so pin 18.x. Expo
        // uses `expo start` instead and does not need it.
        ...(selectedTarget === "react-native"
          ? { "@react-native-community/cli": "^18.0.0" }
          : {}),
        ...(selectedTarget === "expo" ? { "eas-cli": "^16.4.0" } : {}),
        typescript: "^5.7.3",
        vitest: "^3.0.5",
      },
    }),
    "app.json": toPackageJson(
      selectedTarget === "expo"
        ? {
            expo: {
              name,
              slug: name,
              scheme: name,
              ios: { bundleIdentifier: appIdentifier },
              android: { package: appIdentifier },
            },
          }
        : {
            name,
            displayName: title,
          },
    ),
    "App.tsx": `export { default } from "./src/App";
`,
    ".env.example": `KATALIX_API_URL=https://api.example.com
`,
    "release-profiles.json": toPackageJson({
      development: {
        channel: "development",
        distribution: "internal",
        sourceMaps: true,
        storeSubmission: false,
      },
      preview: {
        channel: "preview",
        distribution: "internal",
        sourceMaps: true,
        storeSubmission: false,
      },
      production: {
        channel: "production",
        distribution: "store",
        sourceMaps: true,
        storeSubmission: true,
      },
    }),
    ...(selectedTarget === "expo"
      ? {
          "eas.json": toPackageJson({
            cli: {
              version: ">= 16.0.0",
            },
            build: {
              development: {
                developmentClient: true,
                distribution: "internal",
                channel: "development",
              },
              preview: {
                distribution: "internal",
                channel: "preview",
              },
              production: {
                autoIncrement: true,
                channel: "production",
              },
            },
            submit: {
              production: {},
            },
          }),
        }
      : {}),
    "src/App.tsx": `import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { KatalixNativeRenderer, setRNComponents } from "@katalix/react-native";
import { home } from "./screens/home.screen";
import { appManifest } from "./katalix/app";
import { authManifest } from "./katalix/auth";
import { dataManifest } from "./katalix/data";
import { diagnosticsSummary } from "./katalix/diagnostics";
import { nativeManifest } from "./katalix/native";
import { nativeScreens, routeManifest } from "./katalix/navigation";
import { storageManifest } from "./katalix/storage";

setRNComponents({ View, Text, Image, TextInput, Pressable, ScrollView });

const Stack = createNativeStackNavigator();
const tree = home.toTree();

const HomeScreen = () => (
  <KatalixNativeRenderer
    tree={tree}
    onAction={(action) => console.log("action:", action)}
  />
);

const screenComponents: Record<string, React.ComponentType> = {
  HomeScreen,
  LoginScreen: HomeScreen,
};

const flattenScreens = (screens: typeof nativeScreens): typeof nativeScreens =>
  screens.flatMap((screen) => [
    screen,
    ...(screen.children ? flattenScreens(screen.children) : []),
  ]);

const registeredScreens = flattenScreens(nativeScreens).filter((screen) => screen.componentRef);

const manifestDiagnostics = diagnosticsSummary([
    appManifest,
    routeManifest,
    dataManifest,
    storageManifest,
    authManifest,
    nativeManifest,
  ]);

export default function App() {
  return (
    <NavigationContainer
      onReady={() => {
        console.log(manifestDiagnostics);
      }}
    >
      <Stack.Navigator>
        {registeredScreens.map((screen) => (
          <Stack.Screen
            key={screen.name}
            name={screen.name}
            component={screenComponents[screen.componentRef ?? "HomeScreen"] ?? HomeScreen}
            options={{ presentation: screen.presentation }}
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
`,
    "src/screens/home.screen.ts": `import { Screen } from "@katalix/dsl";

export const home = Screen("${title} Home", (screen) =>
  screen.padding(24).stack({ gap: 12 }, (stack) =>
    stack
      .text("Welcome to ${title}")
      .size(28)
      .weight("bold")
      .text("This screen is rendered through the Katalix React Native renderer.")
      .color("text.muted")
      .button("Inspect native manifests", (button) => button.onPress("inspect-manifests")),
  ),
);
`,
    "src/katalix/app.ts": `import { App } from "@katalix/app";

export const appManifest = App("${title}")
  .platforms(["native"])
  .environment((env) => env.variable("KATALIX_API_URL", { required: true }))
  .providers((providers) =>
    providers
      .provider("navigation", { adapter: "react-navigation" })
      .provider("renderer", { adapter: "react-native" }),
  )
  .toManifest();
`,
    "src/katalix/auth.ts": `import { Auth } from "@katalix/auth";

export const authManifest = Auth("${title} Auth")
  .storage("secure-session", { secure: true })
  .navigation((navigation) => navigation.guard("authenticated").loginRoute("login"))
  .data((data) => data.authHeader("todos", "Authorization"))
  .session("primary", "jwt", (session) =>
    session.bootstrap("silent").refresh("/auth/refresh", { strategy: "rotation" }),
  )
  .toManifest({ platform: "native" });
`,
    "src/katalix/data.ts": `import { Data } from "@katalix/data";

export const dataManifest = Data("${title} API")
  .baseUrl("env:KATALIX_API_URL")
  .auth("primary")
  .resource("todos", (resource) =>
    resource.query("list", "GET", "/todos", (query) =>
      query
        .authRequired()
        .cacheKey("todos")
        .state("loading")
        .state("success")
        .errorMap("default-error"),
    ),
  )
  .toManifest();
`,
    "src/katalix/diagnostics.ts": `type ManifestWithValidation = {
  readonly validation: {
    readonly valid: boolean;
    readonly diagnostics: readonly unknown[];
  };
};

export const diagnosticsSummary = (manifests: readonly ManifestWithValidation[]) => {
  const invalid = manifests.filter((manifest) => !manifest.validation.valid);

  if (invalid.length === 0) {
    return "All generated Katalix manifests are valid.";
  }

  return JSON.stringify(
    invalid.flatMap((manifest) => manifest.validation.diagnostics),
    null,
    2,
  );
};
`,
    "src/katalix/native.ts": `import { Native } from "@katalix/native";

export const nativeManifest = Native("${title} Native")
  .target("${selectedTarget}", {
    iosBundleId: "${appIdentifier}",
    androidPackage: "${appIdentifier}",
  })
  .layout((layout) =>
    layout
      .safeArea("required")
      .keyboard("avoid")
      .statusBar("auto")
      .orientation("portrait")
      .dynamicType({ minScale: 0.85, maxScale: 1.3 })
      .refreshControl("home-refresh"),
  )
  .accessibility((accessibility) =>
    accessibility.label("home-screen").hint("Generated Katalix home screen").role("summary"),
  )
  .capability("network", { permission: "network-state"${
    selectedTarget === "expo" ? ', expoModule: "expo-network"' : ""
  } })
  .toManifest();
`,
    "src/katalix/navigation.ts": `import { Navigation, createReactNavigationScreens } from "@katalix/navigation";

export const routeManifest = Navigation("${title} Routes")
  .routes((routes) =>
    routes.stack("root", (root) =>
      root.screen("home", "HomeScreen").screen("login", "LoginScreen"),
    ),
  )
  .toManifest({ adapter: "react-navigation", platform: "native" });

export const nativeScreens = createReactNavigationScreens(routeManifest);
`,
    "src/katalix/release.ts": `import releaseProfiles from "../../release-profiles.json";

export const mobileReleaseProfiles = releaseProfiles;

export const storeSubmission = {
  ios: {
    target: "TestFlight",
    bundleIdentifier: "${appIdentifier}",
    metadataPath: "store-metadata",
  },
  android: {
    target: "Play Console",
    packageName: "${appIdentifier}",
    metadataPath: "store-metadata",
  },
} as const;
`,
    "src/katalix/storage.ts": `import { Storage } from "@katalix/storage";

export const storageManifest = Storage("${title} Storage")
  .keyValue("settings", { adapter: "async-storage" })
  .secureKeyValue("secure-session", { adapter: "${
    selectedTarget === "expo" ? "secure-store" : "keychain"
  }" })
  .offlineQueue("pending-mutations", { adapter: "async-storage" }, (store) =>
    store.conflictStrategy("last-write-wins"),
  )
  .toManifest({ platform: "native" });
`,
    "src/katalix/manifest.test.ts": `import { describe, expect, it } from "vitest";
import { appManifest } from "./app";
import { authManifest } from "./auth";
import { dataManifest } from "./data";
import { nativeManifest } from "./native";
import { routeManifest } from "./navigation";
import { mobileReleaseProfiles, storeSubmission } from "./release";
import { storageManifest } from "./storage";

describe("generated mobile Katalix manifests", () => {
  it("are valid and native-targeted", () => {
    expect(appManifest.validation.valid).toBe(true);
    expect(routeManifest.validation.valid).toBe(true);
    expect(dataManifest.validation.valid).toBe(true);
    expect(storageManifest.validation.valid).toBe(true);
    expect(authManifest.validation.valid).toBe(true);
    expect(nativeManifest.validation.valid).toBe(true);
    expect(mobileReleaseProfiles.production.storeSubmission).toBe(true);
    expect(storeSubmission.ios.target).toBe("TestFlight");
  });
});
`,
    "privacy-checklist.md": `# Privacy Checklist

- [ ] Permissions explain why camera, location, notifications, files, contacts, and biometrics are requested.
- [ ] permissions are requested only after clear user intent.
- [ ] Analytics events avoid PII unless explicit consent is declared.
- [ ] Secure storage is used for tokens and session identifiers.
- [ ] Crash reports scrub credentials, emails, and user-generated content.
- [ ] Store metadata includes privacy policy and data safety answers.
`,
    "store-metadata/README.md": `# Store Metadata

Keep screenshots, descriptions, keywords, privacy-policy URLs, support URLs, and review notes here before TestFlight or Play Console submission.
`,
    "e2e/home.yml": `appId: ${appIdentifier}
---
- launchApp
- assertVisible: "Welcome to ${title}"
`,
    "tsconfig.json": toPackageJson({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "react-jsx",
        strict: true,
        resolveJsonModule: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
      },
      include: ["src/**/*"],
    }),
    ...(selectedTarget === "react-native"
      ? {
          "index.js": `import { AppRegistry } from "react-native";
import App from "./src/App";
import { name as appName } from "./app.json";

AppRegistry.registerComponent(appName, () => App);
`,
        }
      : {}),
  };
};

const readDirectoryIfExists = async (targetDirectory: string) => {
  try {
    return await readdir(targetDirectory);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }
};

const renderSelectedStarterProject = (options: CreateStarterProjectOptions) => {
  const template = resolveStarterTemplate(options);

  if (template === "web-app") {
    return {
      template,
      files: renderWebAppStarterProject({
        name: options.name,
        router: normalizeWebRouter(options.router),
      }),
      order: WEB_APP_FILE_ORDER,
    };
  }

  if (template === "mobile-app") {
    const target = normalizeNativeTarget(options.target);
    return {
      template,
      files: renderMobileAppStarterProject({
        name: options.name,
        target,
      }),
      order:
        target === "react-native"
          ? [...SHARED_MOBILE_FILE_ORDER, ...PLAIN_REACT_NATIVE_EXTRA_FILE_ORDER]
          : [...SHARED_MOBILE_FILE_ORDER, ...EXPO_EXTRA_FILE_ORDER],
    };
  }

  return {
    template,
    files: renderStarterProject({ name: options.name }),
    order: STARTER_FILE_ORDER,
  };
};

export const createStarterProject = async (
  options: CreateStarterProjectOptions,
): Promise<CreateStarterProjectResult> => {
  const { name, targetDirectory, force = false } = options;
  const existingEntries = await readDirectoryIfExists(targetDirectory);
  if (!force && existingEntries !== null && existingEntries.length > 0) {
    throw new Error(
      "Refusing to scaffold into a non-empty directory. Re-run with force enabled to overwrite starter files.",
    );
  }

  const { files, order, template } = renderSelectedStarterProject(options);

  for (const filePath of order) {
    const content = files[filePath];
    if (content === undefined) {
      throw new Error(`Template did not render expected file "${filePath}".`);
    }

    const absolutePath = join(targetDirectory, filePath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, "utf8");
  }

  return {
    name,
    targetDirectory,
    files: [...order],
    template,
    startScript: TEMPLATE_START_SCRIPT[template],
  };
};
