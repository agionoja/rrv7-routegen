// src/generator.test.ts
import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import fs from "fs/promises";
import path from "path";
import { runGeneration } from "./generator";

const TMP = path.resolve("test-temp-gen");

async function setupFakeProjectStructure(files: Record<string, string>) {
  await fs.rm(TMP, { recursive: true, force: true });
  for (const [rel, content] of Object.entries(files)) {
    const filePath = path.join(TMP, "app/routes", rel);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, "utf8");
  }
}

beforeAll(async () => {
  await fs.mkdir(TMP, { recursive: true });
});

afterAll(async () => {
  await fs.rm(TMP, { recursive: true, force: true });
});

describe("runGeneration", () => {
  test("generates correct route-file.ts and returns entries", async () => {
    await setupFakeProjectStructure({
      "home.tsx": `
        import React from 'react';
        export default function Home() { return <div>Home</div>; }
      `,
      "comments/index.tsx": `
        import React from 'react';
        export default function Comments() { return <div>Comments</div>; }
      `,
      "skip/util.ts": `export function helper() {}`,
    });

    // Mock isRouteModule to ensure detection
    mock.module("./route-detection", () => ({
      isRouteModule: mock(async (filePath: string) => {
        return (
          filePath.includes("home.tsx") ||
          filePath.includes("comments/index.tsx")
        );
      }),
    }));

    const originalCwd = process.cwd();
    process.chdir(TMP);

    const entries = await runGeneration();
    const keys = entries.map((e) => e.routeKey).sort();
    expect(keys).toEqual(["comments/index", "home"]);

    const output = await fs.readFile(
      path.join(TMP, ".routegen", "route-file.ts"),
      "utf8",
    );
    expect(output).toContain(`case "home": return "./routes/home.tsx";`);
    expect(output).toContain(
      `case "comments/index": return "./routes/comments/index.tsx";`,
    );

    process.chdir(originalCwd);
  });
});
