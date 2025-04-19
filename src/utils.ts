// src/utils.ts
import fs from "fs";
import path from "path";

export function injectScripts() {
  const pkgPath = path.resolve(process.cwd(), "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  pkg.scripts ??= {};
  if (!pkg.scripts["generate:routes"]) {
    pkg.scripts["generate:routes"] = "routegen";
  }
  if (!pkg.scripts["watch:routes"]) {
    pkg.scripts["watch:routes"] = "routegen watch";
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log(
    "✅ Added generate:routes & watch:routes scripts to package.json",
  );
}
