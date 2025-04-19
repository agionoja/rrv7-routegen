import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import fs from "fs/promises";
import path from "path";
import { runGeneration } from "./generator.ts";

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
  it("generates correct route-file.ts and returns entries", async () => {
    await setupFakeProjectStructure({
      "home.tsx": `export default () => <></>;`,
      "comments/index.tsx": `export default () => <></>;`,
      "skip/util.ts": `export function helper() {}`,
    });

    const originalCwd = process.cwd();
    process.chdir(TMP); // This time it will work — TMP exists

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

    process.chdir(originalCwd); // Restore original working directory
  });
});
