import fs from "fs/promises";
import path from "path";

const ROUTES_DIR = "app/routes";
const OUTPUT_DIR = ".routegen";
const OUTPUT_PATH = path.join(OUTPUT_DIR, "route-file.ts");

interface FileEntry {
  routeKey: string;
  importPath: string;
}

export async function runGeneration() {
  const files = await walk(ROUTES_DIR);
  const fileEntries: FileEntry[] = files
    .filter((f) => [".ts", ".tsx"].includes(path.extname(f)))
    .map((abs) => {
      const rel = path.relative(ROUTES_DIR, abs).replace(/\\/g, "/");
      const key = rel.replace(path.extname(rel), "");
      return {
        routeKey: key,
        importPath: `./routes/${rel}`,
      };
    });

  const typeUnion = fileEntries.map((e) => `  | "${e.routeKey}"`).join("\n");
  const cases = fileEntries
    .map((e) => `    case \"${e.routeKey}\": return \"${e.importPath}\";`)
    .join("\n");

  const content =
    `// AUTO-GENERATED — DO NOT EDIT\n` +
    `export type RouteFilePath =\n${typeUnion};\n\n` +
    `export function routeFile(path: RouteFilePath) {\n` +
    `  switch(path) {\n${cases}\n    default: throw new Error(\`Invalid routeFile: ${path}\`);\n  }\n}\n`;

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_PATH, content, "utf8");

  console.log(`✅ Generated ${OUTPUT_PATH}`);
  fileEntries.forEach((e) => console.log(`📦 ${e.routeKey} → ${e.importPath}`));
}

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((ent) => {
      const res = path.join(dir, ent.name);
      return ent.isDirectory() ? walk(res) : Promise.resolve(res);
    }),
  );
  return files.flat();
}
