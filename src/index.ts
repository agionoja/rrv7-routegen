// src/index.ts
import { program } from "commander";
import { runGeneration } from "./generator";
import { runWatchMode } from "./watch";
import { injectScripts } from "./utils";

export { defineConfig } from "./load-config.ts";

export function cli() {
  program
    .option("--route-dir <path>", "Directory to scan for routes", "app/routes")
    .option("--out-dir <path>", "Output directory", ".routegen")
    .option("--output-file-name <name>", "Output file name", "route-file.ts");

  program
    .command("generate")
    .description("Generate route file")
    .action(() => {
      injectScripts();
      const options = program.opts();
      runGeneration(options);
    });

  program
    .command("watch")
    .description("Watch for route changes")
    .action(() => {
      injectScripts();
      const options = program.opts();
      runWatchMode(options);
    });

  program.parse(process.argv);

  // If no command is provided, default to generate
  if (!process.argv.slice(2).length) {
    injectScripts();
    runGeneration(program.opts());
  }
}

if (require.main === module) cli();
