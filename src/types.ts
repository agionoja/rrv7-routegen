// src/types.ts
export interface RoutegenConfig {
  routeDir?: string; // Directory to scan for routes (default: "app/routes")
  outDir?: string; // Output directory (default: ".routegen")
  outputFileName?: string; // Output file name (default: "route-file.ts")
  // Future: routeKeyFormat?: (filePath: string) => string;
}
