#!/usr/bin/env node
import { run } from "@lattix/cli/cli";

try {
  process.exitCode = await run(process.argv.slice(2));
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
