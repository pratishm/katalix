import { REACT_NATIVE_STACK } from "./version-matrix.js";

export const REACT_NATIVE_GITIGNORE = `# Dependencies
node_modules/

# React Native
*.jsbundle
.metro-health-check*

# OSX
.DS_Store

# Xcode
ios/build/
ios/Pods/
ios/**/*.xcworkspace/xcuserdata/
ios/**/*.xcodeproj/xcuserdata/
ios/**/*.xcodeproj/project.xcworkspace/xcuserdata/
*.pbxuser
*.mode1v3
*.mode2v3
*.perspectivev3
*.xcuserstate
xcuserdata/
DerivedData/

# Android
android/build/
android/app/build/
android/.gradle/
android/local.properties
*.iml
.cxx/

# Katalix bootstrap temp
.katalix-native-bootstrap/

# Env
.env
.env.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;

export const renderReactNativeBootstrapScript = (): string => {
  const podfileFmtPatch = `
    # KATALIX_FMT_CONSTEVAL_PATCH — disable fmt consteval (Xcode 16.3+ / Clang 26)
    fmt_base = File.join(installer.sandbox.root.to_s, 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      File.chmod(0o644, fmt_base)
      body = File.read(fmt_base)
      unless body.include?('KATALIX_FMT_CONSTEVAL_PATCH')
        marker = "# KATALIX_FMT_CONSTEVAL_PATCH\\n#undef FMT_USE_CONSTEVAL\\n#define FMT_USE_CONSTEVAL 0\\n"
        if body.include?('FMT_USE_CONSTEVAL')
          body = body.sub(/#define FMT_USE_CONSTEVAL/, marker + "#define FMT_USE_CONSTEVAL")
        else
          body = marker + body
        end
        File.write(fmt_base, body)
      end
    end
`;

  return `#!/usr/bin/env node
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const metadataPath = path.join(root, "katalix.native.json");
const appJsonPath = path.join(root, "app.json");

if (!fs.existsSync(metadataPath)) {
  console.error("Missing katalix.native.json — re-scaffold with a recent Katalix CLI.");
  process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
const moduleName = metadata.moduleName ?? appJson.name;
const xcodeProjectName = metadata.xcodeProjectName;
const iosBundleId = metadata.iosBundleId;
const androidPackage = metadata.androidPackage;
const displayName = metadata.displayName ?? appJson.displayName ?? moduleName;

if (!xcodeProjectName || !iosBundleId || !androidPackage) {
  console.error("katalix.native.json must include xcodeProjectName, iosBundleId, and androidPackage.");
  process.exit(1);
}

const hasNativeProjects =
  fs.existsSync(path.join(root, "ios")) && fs.existsSync(path.join(root, "android"));

if (hasNativeProjects) {
  console.log("Native projects already exist (ios/, android/). Delete them to re-run bootstrap.");
  process.exit(0);
}

const tempRoot = path.join(root, ".katalix-native-bootstrap");
const projectDir = path.join(tempRoot, xcodeProjectName);

const patchPodfile = (podfilePath) => {
  if (!fs.existsSync(podfilePath)) {
    return;
  }
  let content = fs.readFileSync(podfilePath, "utf8");
  if (content.includes("KATALIX_FMT_CONSTEVAL_PATCH")) {
    return;
  }
  const podfilePatch = ${JSON.stringify(podfileFmtPatch)};
  if (content.includes("post_install do |installer|")) {
    content = content.replace(
      "post_install do |installer|",
      "post_install do |installer|" + podfilePatch,
    );
  } else {
    content += "\\n\\npost_install do |installer|" + podfilePatch + "\\nend\\n";
  }
  fs.writeFileSync(podfilePath, content);
};

const patchModuleName = (filePath, pattern, replacement) => {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const content = fs.readFileSync(filePath, "utf8");
  if (pattern.test(content)) {
    fs.writeFileSync(filePath, content.replace(pattern, replacement));
  }
};

const walk = (dir, callback) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
};

const alignNativeProjects = () => {
  const iosRoot = path.join(root, "ios");
  const androidRoot = path.join(root, "android");

  walk(iosRoot, (filePath) => {
    if (filePath.endsWith("AppDelegate.swift") || filePath.endsWith("AppDelegate.mm")) {
      patchModuleName(
        filePath,
        /withModuleName:\\s*"[^"]*"/,
        \`withModuleName: "\${moduleName}"\`,
      );
    }
    if (filePath.endsWith("Info.plist")) {
      let plist = fs.readFileSync(filePath, "utf8");
      plist = plist.replace(
        /<key>CFBundleDisplayName<\\/key>\\s*<string>[^<]*<\\/string>/,
        \`<key>CFBundleDisplayName</key><string>\${displayName}</string>\`,
      );
      fs.writeFileSync(filePath, plist);
    }
  });

  walk(androidRoot, (filePath) => {
    if (filePath.endsWith("MainActivity.kt") || filePath.endsWith("MainActivity.java")) {
      patchModuleName(
        filePath,
        /getMainComponentName\\(\\)(?:: String)?\\s*=\\s*"[^"]*"/,
        \`getMainComponentName(): String = "\${moduleName}"\`,
      );
      patchModuleName(
        filePath,
        /getMainComponentName\\(\\)\\s*\\{[^}]*return\\s*"[^"]*"/,
        \`getMainComponentName() { return "\${moduleName}"\`,
      );
    }
    if (filePath.endsWith("strings.xml")) {
      let xml = fs.readFileSync(filePath, "utf8");
      xml = xml.replace(
        /<string name="app_name">[^<]*<\\/string>/,
        \`<string name="app_name">\${displayName}</string>\`,
      );
      fs.writeFileSync(filePath, xml);
    }
    if (filePath.endsWith("build.gradle")) {
      let gradle = fs.readFileSync(filePath, "utf8");
      gradle = gradle.replace(
        /applicationId\\s+"[^"]+"/g,
        \`applicationId "\${androidPackage}"\`,
      );
      gradle = gradle.replace(/namespace\\s+"[^"]+"/g, \`namespace "\${androidPackage}"\`);
      fs.writeFileSync(filePath, gradle);
    }
  });

  patchPodfile(path.join(iosRoot, "Podfile"));
};

fs.rmSync(tempRoot, { recursive: true, force: true });
fs.mkdirSync(tempRoot, { recursive: true });

try {
  console.log(
    \`Generating ios/ and android/ with @react-native-community/cli (Xcode target "\${xcodeProjectName}", JS module "\${moduleName}")...\`,
  );
  execSync(
    [
      "npx",
      "@react-native-community/cli@18",
      "init",
      xcodeProjectName,
      "--directory",
      projectDir,
      "--version",
      "${REACT_NATIVE_STACK.reactNative}",
      "--skip-install",
      "--pm",
      "npm",
    ].join(" "),
    { stdio: "inherit", cwd: tempRoot, env: { ...process.env, CI: "true" } },
  );

  for (const folder of ["ios", "android"]) {
    const source = path.join(projectDir, folder);
    const destination = path.join(root, folder);
    if (!fs.existsSync(source)) {
      throw new Error(\`Expected \${folder}/ in generated project but it was missing.\`);
    }
    fs.cpSync(source, destination, { recursive: true });
  }

  alignNativeProjects();

  console.log("");
  console.log("Native projects ready.");
  console.log("  cd ios && pod install && cd ..");
  console.log("  Terminal 1: npm start");
  console.log("  Terminal 2: npm run ios   or   npm run android");
  console.log("");
  console.log("macOS: install Watchman (brew install watchman) to avoid Metro EMFILE errors.");
} catch (error) {
  console.error("Bootstrap failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
`;
};

export const renderExpoBootstrapScript = (): string => `#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const hasNativeProjects =
  fs.existsSync(path.join(root, "ios")) && fs.existsSync(path.join(root, "android"));

if (hasNativeProjects) {
  console.log("Native projects already exist (ios/, android/). Delete them to re-run bootstrap.");
  process.exit(0);
}

try {
  console.log("Generating ios/ and android/ with Expo prebuild (from app.json + katalix.native.json)...");
  execSync("npx expo prebuild", { stdio: "inherit", cwd: root, env: { ...process.env, CI: "true" } });
  console.log("");
  console.log("Native projects ready.");
  console.log("  cd ios && pod install && cd ..   # if CocoaPods is used");
  console.log("  npm start          — Expo dev server (press i / a in the menu)");
  console.log("  npm run ios        — build and run on iOS Simulator");
  console.log("  npm run android    — build and run on Android emulator");
} catch (error) {
  console.error("Bootstrap failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
`;

export const METRO_CONFIG_CJS = `const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import("@react-native/metro-config").MetroConfig}
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
`;

export const BABEL_CONFIG_CJS = `module.exports = {
  presets: ["module:@react-native/babel-preset"],
};
`;
