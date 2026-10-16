import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index.html", "recette.html"];
const scriptPaths = new Set();
let resources = 0;
for (const page of pages) {
  const html = readFileSync(resolve(root, page), "utf8");
  if (!/<html[^>]+lang=["']fr["']/i.test(html)) throw new Error(`${page}: langue française absente`);
  if (!/<meta\s+name=["']viewport["']/i.test(html)) throw new Error(`${page}: viewport absent`);
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)=["']([^"']+)["'][^>]*>/gi)) {
    const asset = match[1].split("?")[0];
    if (/^(https?:|\/\/|data:)/i.test(asset)) continue;
    const path = resolve(root, asset.replace(/^\//, ""));
    if (!existsSync(path)) throw new Error(`${page}: ressource manquante ${asset}`);
    if (asset.endsWith(".js")) scriptPaths.add(asset);
    resources++;
  }
}
for (const file of scriptPaths) {
  const result = spawnSync(process.execPath, ["--check", resolve(root, file)], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${file}: erreur de syntaxe JavaScript\n${result.stderr}`);
}
console.log(`OK — ${pages.length} pages, ${resources} ressources locales, ${scriptPaths.size} scripts vérifiés.`);
