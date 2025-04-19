// src/load-config.ts
import { cosmiconfig } from "cosmiconfig";
import { z } from "zod";
import type { RoutegenConfig } from "./types";

// Define the schema with defaults
const configSchema = z.object({
  routeDir: z.string().default("app/routes"),
  outDir: z.string().default(".routegen"),
  outputFileName: z.string().default("route-file.ts"),
});

// Define the output type to reflect defaults (no undefined)
export type ResolvedRoutegenConfig = z.infer<typeof configSchema>;

export function defineConfig(config: RoutegenConfig): RoutegenConfig {
  return config;
}

export async function loadConfig(
  cliArgs: Partial<RoutegenConfig> = {},
): Promise<ResolvedRoutegenConfig> {
  const explorer = cosmiconfig("routegen", {
    searchPlaces: [".routegenrc.js", ".routegenrc.ts", "package.json"],
    packageProp: "rrv7Routegen",
  });

  const result = await explorer.search();
  const fileConfig = result?.config || {};

  // Merge file config with CLI args (CLI takes precedence)
  const mergedConfig = { ...fileConfig, ...cliArgs };

  // Validate and apply defaults
  return configSchema.parse(mergedConfig);
}
