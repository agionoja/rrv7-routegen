// src/load-config.test.ts
import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { loadConfig } from "./load-config";
import fs from "fs/promises";
import path from "path";

const TMP = path.resolve("test-temp-config");

beforeEach(async () => {
  await fs.mkdir(TMP, { recursive: true });
  process.chdir(TMP);
});

afterEach(async () => {
  await fs.rm(TMP, { recursive: true, force: true });
  process.chdir(__dirname);
});

describe("loadConfig", () => {
  test("loads defaults when no config exists", async () => {
    const config = await loadConfig();
    expect(config).toEqual({
      routeDir: "app/routes",
      outDir: ".routegen",
      outputFileName: "route-file.ts",
    });
  });

  test("loads config from .routegenrc.js", async () => {
    await fs.writeFile(
      path.join(TMP, ".routegenrc.js"),
      'module.exports = { routeDir: "custom/routes" };',
    );
    const config = await loadConfig();
    expect(config.routeDir).toBe("custom/routes");
  });

  test("overrides with CLI args", async () => {
    await fs.writeFile(
      path.join(TMP, ".routegenrc.js"),
      'module.exports = { routeDir: "custom/routes" };',
    );
    const config = await loadConfig({ routeDir: "cli/routes" });
    expect(config.routeDir).toBe("cli/routes");
  });
});
