#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { basename, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createStarterProject } from "./index.js";

const usage = `Usage:
  katalix create <directory> [--name <name>] [--force]
  katalix create <directory> --router <react-router|tanstack-router> [--name <name>] [--force]
  katalix create <directory> --target <expo|react-native> [--name <name>] [--force]

Creates a Katalix Core starter project, Vite React app, or React Native app.`;

const readOptionValue = (args: string[], option: string) => {
  const index = args.indexOf(option);
  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${option}.`);
  }

  return value;
};

export const run = async (args: string[]) => {
  const [command, directory] = args;

  if (command !== "create" || !directory) {
    console.log(usage);
    return command === undefined ? 0 : 1;
  }

  const targetDirectory = resolve(directory);
  const name = readOptionValue(args, "--name") ?? basename(targetDirectory);
  const force = args.includes("--force");
  const router = readOptionValue(args, "--router");
  const target = readOptionValue(args, "--target");
  const result = await createStarterProject({
    name,
    targetDirectory,
    force,
    router,
    target,
  });

  console.log(`Created Katalix starter "${result.name}" at ${result.targetDirectory}`);
  for (const file of result.files) {
    console.log(`- ${file}`);
  }

  const relativeDirectory = relative(process.cwd(), result.targetDirectory) || ".";
  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${relativeDirectory}`);
  console.log("  npm install");
  if (result.template === "mobile-app") {
    console.log("  npm run bootstrap   # generates ios/ and android/ (official tooling)");
    console.log(`  npm run ${result.startScript}`);
    console.log("  # second terminal: npm run ios  or  npm run android");
  } else {
    console.log(`  npm run ${result.startScript}`);
  }

  return 0;
};

const isInvokedAsScript = (entry: string | undefined): boolean => {
  if (!entry) {
    return false;
  }

  // When invoked through a package bin, `process.argv[1]` is the symlink path
  // inside `node_modules/.bin` while `import.meta.url` is already resolved to
  // the real module path. Resolve the symlink before comparing so the CLI also
  // runs when launched via `npx katalix` / the installed bin.
  if (import.meta.url === pathToFileURL(entry).href) {
    return true;
  }

  try {
    return import.meta.url === pathToFileURL(realpathSync(entry)).href;
  } catch {
    return false;
  }
};

const isMain = isInvokedAsScript(process.argv[1]);

if (isMain) {
  try {
    process.exitCode = await run(process.argv.slice(2));
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
