// src/generator.ts
import fs from "fs/promises";
import path from "path";
import { isRouteModule } from "./route-detection";
import { loadConfig } from "./load-config";
import type { RoutegenConfig } from "./types";

// ANSI color codes
const COLORS = {
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
};

interface FileEntry {
  routeKey: string;
  importPath: string;
}

export async function runGeneration(
  cliArgs: Partial<RoutegenConfig> = {},
): Promise<FileEntry[]> {
  try {
    const config = await loadConfig(cliArgs);
    const ROUTES_DIR = path.resolve(process.cwd(), config.routeDir);
    const OUTPUT_DIR = path.resolve(process.cwd(), config.outDir);
    const OUTPUT_PATH = path.join(OUTPUT_DIR, config.outputFileName);

    const files = await walk(ROUTES_DIR);
    const fileEntries: FileEntry[] = [];

    // Filter TypeScript/JavaScript files
    const tsFiles = files.filter((f) =>
      [".ts", ".tsx", ".js", ".jsx"].includes(path.extname(f)),
    );

    // Analyze each file to determine if it's a route module
    console.log(`${COLORS.cyan}🔎 Scanning route files...${COLORS.reset}`);
    for (const abs of tsFiles) {
      const isRoute = await isRouteModule(abs);
      if (isRoute) {
        const rel = path.relative(ROUTES_DIR, abs).replace(/\\/g, "/");
        const key = rel.replace(path.extname(rel), "");
        fileEntries.push({
          routeKey: key,
          importPath: `./routes/${rel}`,
        });
      }
    }

    const typeUnion = fileEntries.map((e) => `  | "${e.routeKey}"`).join("\n");
    const cases = fileEntries
      .map((e) => `    case "${e.routeKey}": return "${e.importPath}";`)
      .join("\n");

    const content =
      `// AUTO-GENERATED — DO NOT EDIT\n` +
      `export type RouteFilePath =\n${typeUnion};\n\n` +
      `export function routeFile(path: RouteFilePath) {\n` +
      `  switch(path) {\n${cases}\n    default: throw new Error(\`Invalid routeFile: \${path}\`);\n  }\n}\n`;

    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(OUTPUT_PATH, content, "utf8");

    const outputRelPath = `${config.outDir}/${config.outputFileName}`;
    console.log(`${COLORS.green}✅ Generated ${outputRelPath}${COLORS.reset}`);
    console.log(
      `${COLORS.yellow}📋 Found ${fileEntries.length} route module${fileEntries.length === 1 ? "" : "s"}:${COLORS.reset}`,
    );
    fileEntries.forEach((e) =>
      console.log(
        `  ${COLORS.green}• ${e.routeKey} → ${e.importPath}${COLORS.reset}`,
      ),
    );

    return fileEntries;
  } catch (error) {
    console.error(
      `${COLORS.red}❌ Error generating routes: ${error}${COLORS.reset}`,
    );
    return [];
  }
}

async function walk(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map((ent) => {
        const res = path.join(dir, ent.name);
        return ent.isDirectory() ? walk(res) : Promise.resolve(res);
      }),
    );
    return files.flat();
  } catch (error) {
    console.error(
      `${COLORS.red}❌ Error walking directory ${dir}: ${error}${COLORS.reset}`,
    );
    return [];
  }
}
