#!/usr/bin/env node
// Fails when a file contains curly/typographic quotes or apostrophes
// (U+2018..U+201F, U+02BC). Plain ' and " are the only allowed quote marks in
// the rental-conditions work: curly ones break copy/paste into forms and
// legal exports and have caused bad escapes in .ts/.tsx before.
//   node scripts/check-curly-quotes.mjs            check the default file list
//   node scripts/check-curly-quotes.mjs a.ts b.md  check these files
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULT_FILES = [
  "content/condiciones-web-es.md",
  "content/condiciones-web-en.md",
  "content/condiciones-web-de.md",
  "content/condiciones-web-it.md",
  "content/condiciones-web-nl.md",
  "content/condiciones-web-ru.md",
  "content/condiciones-web-uk.md",
  "src/routes/condiciones.tsx",
  "src/routes/cancellation-policy.tsx",
  "src/components/ConditionsDocument.tsx",
  "src/data/conditions.ts",
  "src/lib/markdown.ts",
  "shared/cancellation.js",
  "shared/cancellation.test.js",
  "shared/dates.js",
  "scripts/check-conditions.mjs",
  "scripts/check-curly-quotes.mjs",
];

const CURLY = new RegExp("[" + String.fromCharCode(0x2018) + "-" + String.fromCharCode(0x201f) + String.fromCharCode(0x2bc) + "]");
const files = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_FILES;

let bad = 0;
for (const rel of files) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    console.error(`MISSING ${rel}`);
    bad++;
    continue;
  }
  readFileSync(path, "utf8")
    .split(/\r?\n/)
    .forEach((line, i) => {
      const m = line.match(CURLY);
      if (m) {
        bad++;
        const code = "U+" + m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
        console.error(`CURLY QUOTE ${code} in ${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
      }
    });
}

if (bad) {
  console.error(`\n${bad} problem(s): replace curly quotes with plain ' or "`);
  process.exit(1);
}
console.log(`no curly quotes in ${files.length} files`);
