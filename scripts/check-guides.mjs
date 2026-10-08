#!/usr/bin/env node
// Guards content/guides/*.json: every translation must have the Spanish
// master's exact structure (keys, list lengths) and the same figures, and use
// plain quotes only.
//   node scripts/check-guides.mjs          all languages present
//   node scripts/check-guides.mjs en de    only these
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ALL = ["es", "en", "de", "it", "nl", "ru", "uk"];
const wanted = process.argv.slice(2);
const langs = (wanted.length ? wanted : ALL).filter((l) => l !== "es");
const CURLY = new RegExp("[" + String.fromCharCode(0x2018) + "-" + String.fromCharCode(0x201f) + String.fromCharCode(0x2bc) + "]");

const load = (l) => JSON.parse(readFileSync(join(root, "content/guides", `${l}.json`), "utf8"));

// Shape of a value: object keys / array lengths / string leaf.
function shape(v) {
  if (Array.isArray(v)) return v.map(shape);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, shape(v[k])]));
  return typeof v;
}
function strings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}
// Digits only, thousands separators ignored: "1.308 €", "1,308 €" and "1308 €" match.
const figures = (v) =>
  strings(v)
    .join(" ")
    .match(/\d+(?:[.,  ]\d{3})*(?:[.,]\d+)?/g)
    ?.map((n) => n.replace(/[.,  ]/g, ""))
    .sort() ?? [];

let failed = false;
const fail = (m) => { failed = true; console.error("  FAIL " + m); };

const master = load("es");
const masterShape = JSON.stringify(shape(master));
const masterFigs = figures(master.guides);
console.log("es (master)");
if (CURLY.test(JSON.stringify(master))) fail("curly quote in master");

for (const l of langs) {
  console.log(l);
  if (!existsSync(join(root, "content/guides", `${l}.json`))) { console.log("  (no file yet)"); continue; }
  let t;
  try { t = load(l); } catch (e) { fail("invalid JSON: " + e.message); continue; }
  if (CURLY.test(JSON.stringify(t))) fail("curly quote found");
  if (JSON.stringify(shape(t)) !== masterShape) fail("structure differs from the Spanish master (keys or list lengths)");
  const f = figures(t.guides);
  const rest = [...f];
  const missing = masterFigs.filter((x) => { const i = rest.indexOf(x); if (i < 0) return true; rest.splice(i, 1); return false; });
  if (missing.length) fail("figures missing: " + missing.join(", "));
  if (rest.length) fail("figures not in the source: " + rest.join(", "));
  for (const s of strings(t)) if (!s.trim()) fail("empty string");
}
console.log(failed ? "\nguides check FAILED" : "\nguides check OK");
process.exit(failed ? 1 : 0);
