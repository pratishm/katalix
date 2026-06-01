import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REACT_NATIVE_STACK } from "./version-matrix.js";

export interface DoctorOptions {
  readonly cwd?: string;
}

const readJson = <T>(path: string): T | null => {
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, "utf8")) as T;
};

const commandExists = (command: string): boolean => {
  try {
    execSync(`command -v ${command}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

export const runDoctor = (options: DoctorOptions = {}): number => {
  const cwd = options.cwd ?? process.cwd();
  const errors: string[] = [];
  const warnings: string[] = [];

  const packageJson = readJson<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  }>(join(cwd, "package.json"));

  if (!packageJson) {
    console.error("No package.json in current directory.");
    return 1;
  }

  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const isReactNativeApp =
    deps["react-native"] !== undefined || deps["@react-native-community/cli"] !== undefined;
  const isExpoApp = deps.expo !== undefined;

  if (isReactNativeApp || isExpoApp) {
    const hasIos = existsSync(join(cwd, "ios"));
    const hasAndroid = existsSync(join(cwd, "android"));
    if (!hasIos || !hasAndroid) {
      warnings.push(
        "Missing ios/ or android/. Run `npm run bootstrap` to generate native projects with official tooling.",
      );
    }

    if (process.platform === "darwin" && !commandExists("watchman")) {
      warnings.push(
        "Watchman is not installed. Metro may hit EMFILE on macOS — run `brew install watchman`.",
      );
    }

    if (hasIos && !commandExists("pod")) {
      warnings.push("CocoaPods (`pod`) not found. Run `cd ios && pod install` before `npm run ios`.");
    }

    const metadataPath = join(cwd, "katalix.native.json");
    const appJson = readJson<{ name?: string }>(join(cwd, "app.json"));
    const metadata = readJson<{
      moduleName?: string;
      xcodeProjectName?: string;
    }>(metadataPath);

    if (metadata?.moduleName && appJson?.name && metadata.moduleName !== appJson.name) {
      errors.push(
        `Module name mismatch: app.json name is "${appJson.name}" but katalix.native.json moduleName is "${metadata.moduleName}".`,
      );
    }

    if (isReactNativeApp && hasIos && metadata?.xcodeProjectName) {
      const iosDir = join(cwd, "ios", metadata.xcodeProjectName);
      if (!existsSync(iosDir)) {
        warnings.push(
          `Expected Xcode project folder ios/${metadata.xcodeProjectName}/ — bootstrap may be out of date.`,
        );
      }
    }
  }

  const reactPath = join(cwd, "node_modules", "react", "package.json");
  const reactNativePath = join(cwd, "node_modules", "react-native", "package.json");
  const reactPkg = readJson<{ version: string }>(reactPath);
  const reactNativePkg = readJson<{ version: string; peerDependencies?: Record<string, string> }>(
    reactNativePath,
  );

  if (reactPkg && reactNativePkg) {
    const expectedReact = REACT_NATIVE_STACK.react;
    if (reactPkg.version !== expectedReact) {
      errors.push(
        `react@${reactPkg.version} is installed but react-native@${reactNativePkg.version} requires react ${expectedReact} (exact match with Fabric renderer).`,
      );
    }

    const rnPeer = reactNativePkg.peerDependencies?.react;
    if (rnPeer && !reactPkg.version.startsWith("19.0.")) {
      warnings.push(`react-native peers ${rnPeer}; keep react on the 19.0.x line for RN 0.79.`);
    }
  } else if (isReactNativeApp) {
    warnings.push("Run `npm install` before `katalix doctor` to verify react / react-native versions.");
  }

  const declaredReact = deps.react;
  if (
    isReactNativeApp &&
    declaredReact &&
    (declaredReact.startsWith("^") || declaredReact.startsWith("~")) &&
    declaredReact.includes("19")
  ) {
    warnings.push(
      `package.json declares react as "${declaredReact}". Pin react to "${REACT_NATIVE_STACK.react}" (exact) for RN 0.79.`,
    );
  }

  if (errors.length > 0) {
    console.error("katalix doctor — issues found:\n");
    for (const error of errors) {
      console.error(`  ✗ ${error}`);
    }
  }

  if (warnings.length > 0) {
    console.warn(errors.length > 0 ? "\nWarnings:\n" : "katalix doctor — warnings:\n");
    for (const warning of warnings) {
      console.warn(`  ⚠ ${warning}`);
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("katalix doctor — all checks passed.");
    return 0;
  }

  return errors.length > 0 ? 1 : 0;
};
