import { runGeneration } from "./generator";
import { runWatchMode } from "./watch";
import { injectScripts } from "./utils";

export function cli() {
  const [, , cmd] = process.argv;
  injectScripts();
  if (cmd === "watch") runWatchMode();
  else runGeneration();
}
