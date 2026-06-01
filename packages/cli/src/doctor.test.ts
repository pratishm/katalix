import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runDoctor } from "./doctor.js";

const tempDirs: string[] = [];

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("runDoctor", () => {
  it("fails when react version does not match the RN 0.79 matrix", async () => {
    const dir = await mkdtemp(join(tmpdir(), "katalix-doctor-"));
    tempDirs.push(dir);

    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(dir, "node_modules", "react"), { recursive: true });
    await mkdir(join(dir, "node_modules", "react-native"), { recursive: true });

    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
        dependencies: {
          react: "19.0.0",
          "react-native": "0.79.7",
        },
      }),
      "utf8",
    );

    await writeFile(
      join(dir, "node_modules", "react", "package.json"),
      JSON.stringify({ version: "19.2.0" }),
      "utf8",
    );
    await writeFile(
      join(dir, "node_modules", "react-native", "package.json"),
      JSON.stringify({ version: "0.79.7", peerDependencies: { react: "^19.0.0" } }),
      "utf8",
    );

    expect(runDoctor({ cwd: dir })).toBe(1);
  });
});
