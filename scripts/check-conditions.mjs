#!/usr/bin/env node
// Guards the rental-conditions texts in content/condiciones-web-*.md.
//   node scripts/check-conditions.mjs            check every translation present
//   node scripts/check-conditions.mjs en de      check only these languages
// Fails (exit 1) when a file contains curly quotes, or when a translation
// drifts from the Spanish master in structure, clause numbers or numbers.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ALL = ["es", "en", "de", "it", "nl", "ru", "uk"];
const requested = process.argv.slice(2);
const langs = (requested.length ? requested : ALL).filter((l) => l !== "es");

// U+2018..U+201F (single/double curly and low-9 quotes) and U+02BC (modifier
// apostrophe). Plain ' and " are the only quote characters allowed.
const CURLY = new RegExp("[" + String.fromCharCode(0x2018) + "-" + String.fromCharCode(0x201f) + String.fromCharCode(0x2bc) + "]", "g");

const file = (lang) => join(root, "content", `condiciones-web-${lang}.md`);
const read = (lang) => readFileSync(file(lang), "utf8");

function structure(text) {
  const lines = text.split(/\r?\n/);
  const count = (re) => lines.filter((l) => re.test(l)).length;
  return {
    h1: count(/^# /),
    h2: count(/^## /),
    h3: count(/^### /),
    listItems: count(/^- /),
    tableRows: count(/^\|/),
    tableSeparators: count(/^\|[-| ]+\|$/),
    rules: count(/^---$/),
    // 4.1. / 11.4. style clause labels, in order
    clauses: lines.map((l) => l.match(/^(\d+\.\d+)\./)?.[1]).filter(Boolean).join(" "),
    // section headings keep their number: "### 4. ..."
    sectionNumbers: lines.map((l) => l.match(/^### (\d+)\./)?.[1]).filter(Boolean).join(" "),
    // list letters a) b) c)
    letters: lines.map((l) => l.match(/^- ([a-j])\)/)?.[1]).filter(Boolean).join(""),
  };
}

// Digits only: "1.000 EUR", "1,000 EUR" and "1000 EUR" are the same figure.
// The translation note (a blockquote) is excluded from the comparison.
function figures(text) {
  const body = text.split(/\r?\n/).filter((l) => !l.startsWith(">")).join("\n");
  return (body.match(/\d+(?:[.,]\d+)*/g) || []).map((n) => n.replace(/[.,]/g, "")).sort();
}

function diff(a, b) {
  const remaining = [...b];
  const missing = [];
  for (const x of a) {
    const i = remaining.indexOf(x);
    if (i === -1) missing.push(x);
    else remaining.splice(i, 1);
  }
  return { missing, extra: remaining };
}

let failed = false;
const fail = (msg) => {
  failed = true;
  console.error("  FAIL " + msg);
};

const master = read("es");
const masterStructure = structure(master);
const masterFigures = figures(master);

console.log("es (master)");
if (CURLY.test(master)) fail("curly quote in master");
CURLY.lastIndex = 0;

for (const lang of langs) {
  console.log(lang);
  if (!existsSync(file(lang))) {
    console.log("  (no file yet)");
    continue;
  }
  const text = read(lang);

  const quotes = [...text.matchAll(CURLY)];
  if (quotes.length) {
    const first = text.slice(0, quotes[0].index).split("\n").length;
    fail(`${quotes.length} curly quote(s), first on line ${first}: ${JSON.stringify(quotes[0][0])}`);
  }

  const s = structure(text);
  for (const key of Object.keys(masterStructure)) {
    if (s[key] !== masterStructure[key]) {
      fail(`${key}: expected ${JSON.stringify(masterStructure[key])}, found ${JSON.stringify(s[key])}`);
    }
  }

  const { missing, extra } = diff(masterFigures, figures(text));
  if (missing.length) fail(`figures missing from translation: ${missing.join(", ")}`);
  if (extra.length) fail(`figures not in the Spanish source: ${extra.join(", ")}`);

  if (!text.split(/\r?\n/).some((l) => l.startsWith("> "))) {
    fail("missing the '> ' note saying the Spanish version prevails");
  }
  if (!/[^\s]/.test(text) || text.length < master.length * 0.6) {
    fail(`suspiciously short (${text.length} chars vs ${master.length} in Spanish)`);
  }
}

console.log(failed ? "\nconditions check FAILED" : "\nconditions check OK");
process.exit(failed ? 1 : 0);
