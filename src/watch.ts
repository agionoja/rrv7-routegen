import chokidar from "chokidar";
import { spawn } from "child_process";
import path from "path";

const RELEVANT = new Set(["add", "addDir", "unlink", "unlinkDir"]);
export function runWatchMode() {
  console.log("👀 Watching app/routes for file add/delete...");
  const watcher = chokidar.watch("app/routes", {
    ignoreInitial: true,
    persistent: true,
  });
  let timer: NodeJS.Timeout;

  watcher.on("all", (event, filePath) => {
    if (!RELEVANT.has(event)) return;
    const rel = path.relative(process.cwd(), filePath);
    console.log(`📦 ${event.toUpperCase()}: ${rel}`);

    clearTimeout(timer);
    timer = setTimeout(() => {
      const cmd = detectPMCommand();
      const child = spawn(cmd.bin, cmd.args, { stdio: "inherit" });
      child.on("close", (code) => {
        if (code !== 0) console.error(`❌ generate exited ${code}`);
      });
    }, 200);
  });
}

function detectPMCommand(): { bin: string; args: string[] } {
  // detect bun, yarn, npm
  if (spawnExists("bun"))
    return { bin: "bun", args: ["run", "generate:routes"] };
  if (fsExistsSync("yarn.lock"))
    return { bin: "yarn", args: ["generate:routes"] };
  return { bin: "npm", args: ["run", "generate:routes"] };
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
