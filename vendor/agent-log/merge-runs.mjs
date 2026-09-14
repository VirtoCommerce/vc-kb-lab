/* Merge several sessions' question logs into one analysable table and print the cross-session
 * tallies. Nothing is hand-counted: every number in an analysis should come from here.
 *
 *   node tools/merge-runs.mjs <runs-dir> [out-dir] [runA runB ...]
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/* usage: node merge-runs.mjs <runs-dir> [out-dir] [run-names...]
 * <runs-dir> holds one subdirectory per run, each with a questions-<session>.csv. */
const RUNS = process.argv[2];
const OUT = process.argv[3] || RUNS;
if (!RUNS) { console.error("usage: node merge-runs.mjs <runs-dir> [out-dir] [runA runB ...]"); process.exit(1); }
const RUN_NAMES = process.argv.slice(4);
const LF = String.fromCharCode(10);

const parse = (text) => {
  const out = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (c === '"') q = false; else cell += c; continue; }
    if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); out.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); out.push(row); }
  return out;
};
const cell = (v) => { const s = v == null ? "" : String(v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

const runsPresent = RUN_NAMES.length ? RUN_NAMES
  : readdirSync(RUNS).filter((d) => { try { return readdirSync(join(RUNS, d)).some((f) => f.startsWith("questions-")); } catch { return false; } }).sort();
/* UNION the headers and map every file's cells BY NAME.
 *
 * Taking the first file's header and concatenating the others positionally is silent corruption
 * as soon as two captures have different columns - which is what happens the moment the tool
 * gains a field between batches. Nothing errors; the extra cells land in the wrong place or
 * vanish. So collect every column name in first-seen order and rebuild each row against it. A
 * column a file does not have comes out empty, which is true and visible.
 *
 * This stops two tool versions corrupting each other. It does NOT make them comparable - whether
 * rows captured under different versions may be pooled is a question about the measurement. */
const files = [];
const cols = ["run"];
for (const run of runsPresent) {
  const dir = join(RUNS, run);
  const f = readdirSync(dir).find((x) => x.startsWith("questions-") && x.endsWith(".csv"));
  if (!f) { console.error("no questions-*.csv in " + dir); process.exit(1); }
  const g = parse(readFileSync(join(dir, f), "utf8"));
  files.push({ run, header: g[0], rows: g.slice(1) });
  for (const c of g[0]) if (!cols.includes(c)) cols.push(c);
}
const header = cols;
const all = [];
for (const f of files) {
  const missing = cols.filter((c) => c !== "run" && !f.header.includes(c));
  if (missing.length) console.log("  note: " + f.run + " has no column(s): " + missing.join(", "));
  for (const r of f.rows) {
    const byName = Object.fromEntries(f.header.map((n2, i) => [n2, r[i] ?? ""]));
    byName.run = f.run;
    all.push(cols.map((c) => byName[c] ?? ""));
  }
}
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "questions.csv"), [header.map(cell).join(",")].concat(all.map((r) => r.map(cell).join(","))).join(LF) + LF, "utf8");

const I = (n) => header.indexOf(n);
const get = (r, n) => r[I(n)] || "";
const byRun = (run) => all.filter((r) => get(r, "run") === run);

console.log("merged " + all.length + " rows -> " + join(OUT, "questions.csv"));
console.log("");

const tally = (rows, field) => {
  const m = {};
  for (const r of rows) { const k = get(r, field) || "(blank)"; m[k] = (m[k] || 0) + 1; }
  return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + " " + v).join(" · ");
};

console.log("PER RUN");
for (const run of runsPresent) {
  const rows = byRun(run);
  console.log("  " + run + "  n=" + rows.length);
  for (const f of ["class", "backed_by", "held", "phase", "marker", "applied", "reusable", "re_asked"]) {
    console.log("      " + f.padEnd(11) + tally(rows, f));
  }
}

console.log("");
console.log("VALUE ROWS — does each carry a reusable recipe?");
for (const run of runsPresent) {
  const v = byRun(run).filter((r) => get(r, "class") === "VALUE");
  const noRecipe = v.filter((r) => /NO-RECIPE/i.test(get(r, "note")));
  console.log("  " + run + "  VALUE=" + v.length + "   explicitly NO-RECIPE=" + noRecipe.length +
    "   (KNOWLEDGE rows that ARE recipes are counted in the KNOWLEDGE column)");
}

console.log("");
console.log("REUSABILITY — rows a future task would ask again");
for (const run of runsPresent) {
  const rows = byRun(run);
  const reusable = rows.filter((r) => get(r, "reusable") === "yes");
  const heldReusable = reusable.filter((r) => get(r, "held") === "HELD");
  console.log("  " + run + "  reusable=" + reusable.length + " of " + rows.length +
    "   of which HELD=" + heldReusable.length + "  (these are the candidate KB entries)");
}

console.log("");
console.log("THE CALL COST — tool calls per logged row");
for (const run of runsPresent) {
  const rows = byRun(run);
  const calls = rows.map((r) => Number(get(r, "calls"))).filter(Number.isFinite);
  const max = calls.length ? Math.max(...calls) : 0;
  console.log("  " + run + "  rows=" + rows.length + "  final call count=" + max +
    "  calls/row=" + (rows.length ? (max / rows.length).toFixed(1) : "-"));
}
