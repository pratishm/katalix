#!/usr/bin/env node
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createStarterProject } from "./index.js";

const usage = `Usage:
  lattix create <directory> [--name <name>] [--force]
  lattix create <directory> --router <react-router|tanstack-router> [--name <name>] [--force]
  lattix create <directory> --target <expo|react-native> [--name <name>] [--force]

Creates a Lattix Core starter project, Vite React app, or React Native app.`;

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

  console.log(`Created Lattix starter "${result.name}" at ${result.targetDirectory}`);
  for (const file of result.files) {
    console.log(`- ${file}`);
  }

  return 0;
};

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) {
  try {
    process.exitCode = await run(process.argv.slice(2));
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
