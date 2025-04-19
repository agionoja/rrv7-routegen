// src/watch.ts
import chokidar from "chokidar";
import { spawn } from "child_process";
import path from "path";
import { loadConfig, type ResolvedRoutegenConfig } from "./load-config";

// ANSI color codes
const COLORS = {
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};

const RELEVANT = new Set(["add", "addDir", "change", "unlink", "unlinkDir"]);

export async function runWatchMode(
  cliArgs: Partial<ResolvedRoutegenConfig> = {},
) {
  const config = await loadConfig(cliArgs);
  const ROUTES_DIR = path.resolve(process.cwd(), config.routeDir);

  console.log(
    `${COLORS.cyan}🚀 Watching ${config.routeDir} for route changes...${COLORS.reset}`,
  );
  const watcher = chokidar.watch(ROUTES_DIR, {
    ignoreInitial: true,
    persistent: true,
  });
  let timer: NodeJS.Timeout;

  watcher.on("all", (event, filePath) => {
    if (!RELEVANT.has(event)) return;
    const rel = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
    console.log(
      `${COLORS.green}📬 ${event.toUpperCase()}: ${rel}${COLORS.reset}`,
    );

    clearTimeout(timer);
    timer = setTimeout(() => {
      const cmd = detectPMCommand(config);
      const child = spawn(cmd.bin, cmd.args, { stdio: "inherit" });
      child.on("close", (code) => {
        if (code !== 0)
          console.error(
            `${COLORS.red}❌ Generation failed with code ${code}${COLORS.reset}`,
          );
      });
    }, 200);
  });
}

function detectPMCommand(config: ResolvedRoutegenConfig): {
  bin: string;
  args: string[];
} {
  // Construct CLI arguments from config
  const cliArgs = [
    "generate",
    `--route-dir=${config.routeDir}`,
    `--out-dir=${config.outDir}`,
    `--output-file-name=${config.outputFileName}`,
  ];

  // Detect bun, yarn, pnpm, or npm
  if (spawnExists("bun"))
    return { bin: "bun", args: ["x", "rrv7-routegen", ...cliArgs] };
  if (fsExistsSync("yarn.lock"))
    return { bin: "yarn", args: ["run", "generate:routes"] }; // yarn doesn't support direct CLI args well
  if (fsExistsSync("pnpm-lock.yaml"))
    return { bin: "pnpm", args: ["exec", "rrv7-routegen", ...cliArgs] };
  return { bin: "npx", args: ["rrv7-routegen", ...cliArgs] };
}

function spawnExists(cmd: string): boolean {
  try {
    require("child_process").execSync(`${cmd} --version`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function fsExistsSync(p: string) {
  try {
    require("fs").accessSync(p);
    return true;
  } catch {
    return false;
  }
}
