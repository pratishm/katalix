const path = require("node:path");
const fs = require("node:fs");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const projectRoot = __dirname;

/** When @katalix/* is linked via `file:`, Metro must watch the monorepo packages tree. */
const linkedKatalixWatchFolders = () => {
  const watch = new Set([projectRoot]);
  const linked = path.join(projectRoot, "node_modules", "@katalix", "react-native");
  try {
    const pkgDir = path.dirname(fs.realpathSync(path.join(linked, "package.json")));
    watch.add(path.resolve(pkgDir, ".."));
    watch.add(path.resolve(pkgDir, "../.."));
  } catch {
    // Published npm installs — default config is enough.
  }
  return [...watch];
};

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import("@react-native/metro-config").MetroConfig}
 */
const config = {
  watchFolders: linkedKatalixWatchFolders(),
  resolver: {
    unstable_enableSymlinks: true,
    unstable_enablePackageExports: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
