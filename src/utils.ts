// src/utils.ts
import fs from "fs";
import path from "path";

// ANSI color codes
const COLORS = {
  green: "\x1b[32m",
  reset: "\x1b[0m",
};

export function injectScripts() {
  const pkgPath = path.resolve(process.cwd(), "package.json");
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch (error) {
    console.error(`❌ Error reading package.json: ${error}`);
    return;
  }

  pkg.scripts = pkg.scripts || {};
  let scriptsChanged = false;

  // Define desired scripts
  const desiredScripts = {
    "generate:routes": "routegen",
    "watch:routes": "routegen watch",
  };

  // Check and add scripts only if they don't exist
  for (const [scriptName, scriptCommand] of Object.entries(desiredScripts)) {
    if (!pkg.scripts[scriptName]) {
      pkg.scripts[scriptName] = scriptCommand;
      scriptsChanged = true;
    }
  }

  // Write back to package.json only if changes were made
  if (scriptsChanged) {
    try {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log(
        `${COLORS.green}✅ Added missing routegen scripts to package.json${COLORS.reset}`,
      );
    } catch (error) {
      console.error(`❌ Error writing to package.json: ${error}`);
    }
  }
}
