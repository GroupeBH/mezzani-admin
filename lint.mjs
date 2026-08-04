import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = new URL(".", import.meta.url).pathname.replace(/^\/(.:\/)/, "$1");
const sourceRoot = join(root, "src");
const failures = [];
const rules = [
  { name: "explicit any", pattern: /(?:\:\s*any\b|\bas\s+any\b|<any>)/g },
  { name: "suppressed TypeScript error", pattern: /@ts-(?:ignore|nocheck)/g },
  { name: "public browser secret", pattern: /NEXT_PUBLIC_[A-Z0-9_]*(?:TOKEN|SECRET|API_KEY)/g },
  { name: "disabled lint rule", pattern: /eslint-disable/g },
];

function inspect(path) {
  for (const entry of readdirSync(path)) {
    const target = join(path, entry);
    if (statSync(target).isDirectory()) {
      inspect(target);
      continue;
    }
    if (![".ts", ".tsx"].includes(extname(target)) || target.endsWith(".test.ts")) continue;
    const source = readFileSync(target, "utf8");
    for (const rule of rules) {
      for (const match of source.matchAll(rule.pattern)) {
        const line = source.slice(0, match.index).split("\n").length;
        failures.push(`${relative(root, target)}:${line}: ${rule.name}`);
      }
    }
  }
}

inspect(sourceRoot);
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("MEZANI source policy lint passed");

