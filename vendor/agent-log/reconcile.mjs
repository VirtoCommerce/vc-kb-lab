#!/usr/bin/env node
/* reconcile.mjs — put the two logs of one session side by side and report where they disagree.
 *
 *   node tools/reconcile.mjs <session-dir>        # the folder holding both logs
 *   node tools/reconcile.mjs <session-dir> --verbose
 *
 * This is the analysis the whole two-log design exists for, and until now the toolkit only
 * promised it. `log-row check` validates the question log against itself and counts lines in the
 * tool log; it never reads WHAT was called. So it can catch a row claiming a lookup at an
 * unchanged call count, and it cannot catch the opposite and more interesting case: work that
 * happened and was never written down.
 *
 * Four reports, in order of how often they find something:
 *
 *   1. COVERAGE — every tool call is attributed to the row that was open when it happened (a
 *      row's window runs from its own call stamp to the next row's). Calls before the first row
 *      are work done before logging began; calls after the last row are normal tail-end work.
 *   2. UNDER-LOGGED WINDOWS — a row whose window holds far more calls than the median almost
 *      certainly covered several questions of which one was logged. This is the closest thing to
 *      a direct measurement of "a question the agent did not notice itself asking".
 *   3. METHOD NOT FOUND — for each row that names a method, do any of the calls in its window
 *      look like it? HEURISTIC, and it says so in the output: it matches distinctive tokens, so
 *      an unusual phrasing produces a false positive. Treat a hit as a question, not a verdict.
 *   4. TOOL MIX BY PHASE — which tools did the work in each phase. Not a defect report; it is
 *      how you see that one phase ran entirely through a browser and another entirely through
 *      curl, which is usually the most interesting difference between two sessions.
 *
 * It reads only. It writes nothing, and exits 0 unless the logs cannot be read — the reports are
 * observations to interpret, not gates to pass.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIR = process.argv[2];
const VERBOSE = process.argv.includes("--verbose");
if (!DIR || !existsSync(DIR)) {
  console.error("usage: node reconcile.mjs <session-dir> [--verbose]");
  process.exit(1);
}

/* ---- load both logs ---- */
const files = readdirSync(DIR);
/* VC_MEASURE_SESSION, which log-row.mjs and the door both honour and this file did not.
 *
 * `files.find` takes whichever tool log sorts first, and run 05 found that out the hard way: its
 * own log was `tool-log-f00f5968` beside the authoring session's `tool-log-c842f27b`, `c` sorts
 * before `f`, and reconcile happily measured 4 question rows against a 10-line log from a different
 * session -- then reported that the log had kept pace with the work. The only tell was a negative
 * count after the last row.
 *
 * Run 04's numbers happened to be right because `8df1fb2c` sorted before `c842f27b`. A measurement
 * that is correct by the accident of a hex string is not a measurement, which is why this is now
 * the second deliberate divergence from the vendored toolkit -- see README.md. */
const wanted = (process.env.VC_MEASURE_SESSION || "").trim();

/* HOST MATCHING IS DELIBERATELY NOT USED HERE, and the reason is worth writing down.
 *
 * The door resolves by CLAUDE_CODE_HOST_SESSION_ID because the caller IS the run: "which log is
 * mine" and "which log should be written to" are the same question there. This file is run by an
 * ANALYST, afterwards, pointing at somebody else's directory -- so the caller's own host id names
 * the wrong log, confidently. Adding it here would reproduce the exact defect run 05 caught: a run
 * reconciled against another session's log, reporting that the log kept pace.
 *
 * So the refusal stands, and VC_MEASURE_SESSION is how an analyst says which run they mean. */
const pick = (re) => {
  const all = files.filter((f) => re.test(f));
  const mine = wanted ? all.filter((f) => f.includes(wanted)) : all;
  if (wanted && mine.length === 0 && all.length) {
    console.error(`VC_MEASURE_SESSION=${wanted} matches none of: ${all.join(", ")}`);
    process.exit(1);
  }
  if (!wanted && all.length > 1) {
    console.error(`${all.length} candidates in ${DIR}: ${all.join(", ")}`);
    console.error("Set VC_MEASURE_SESSION to the one this run is, or give each run its own");
    console.error("VC_MEASURE_OUT. Guessing here silently reconciles one run against another's log.");
    process.exit(1);
  }
  return mine[0];
};
const toolFile = pick(/^tool-log-.*\.jsonl$/);
const qFile = pick(/^questions-.*\.csv$/);
if (!toolFile || !qFile) {
  console.error("need one tool-log-*.jsonl and one questions-*.csv in " + DIR +
    "\n  found: " + files.join(", "));
  process.exit(1);
}

const parseCsv = (text) => {
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

const grid = parseCsv(readFileSync(join(DIR, qFile), "utf8"));
const head = grid[0];
const rows = grid.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));

/* a batch continuation is a line, not a call — the same rule the hook counts by */
const lines = readFileSync(join(DIR, toolFile), "utf8").split(String.fromCharCode(10)).filter(Boolean);
const calls = [];
for (const l of lines) {
  let o;
  try { o = JSON.parse(l); } catch { continue; }
  if (o.part) { calls.push({ ...o, isPart: true }); continue; }
  calls.push(o);
}
const callOnly = calls.filter((c) => !c.isPart);

console.log("session:   " + (qFile.replace(/^questions-|\.csv$/g, "")));
console.log("questions: " + rows.length + " rows");
console.log("tool log:  " + callOnly.length + " calls (" + calls.length + " lines, batch actions unpacked)");
console.log("");

/* ---- 1. coverage: attribute calls to the row that was open ---- */
const stamps = rows.map((r) => Number(r.calls)).map((n) => (Number.isFinite(n) ? n : null));
const firstStamp = stamps.find((n) => n !== null);
const lastStamp = [...stamps].reverse().find((n) => n !== null);

const windows = rows.map((r, i) => {
  const from = stamps[i];
  let to = null;
  for (let j = i + 1; j < stamps.length; j += 1) if (stamps[j] !== null) { to = stamps[j]; break; }
  if (from === null) return { row: r, size: null };
  return { row: r, from, to: to === null ? callOnly.length : to, size: (to === null ? callOnly.length : to) - from };
});

console.log("1. COVERAGE");
console.log("   before the first row:  " + (firstStamp === undefined ? "?" : firstStamp) +
  " call(s) — work done before anything was logged");
console.log("   after the last row:    " + (lastStamp === undefined ? "?" : callOnly.length - lastStamp) +
  " call(s) — tail-end work, normally the report and the write-up");
const sizes = windows.map((w) => w.size).filter((n) => n !== null);
const median = sizes.length ? [...sizes].sort((a, b) => a - b)[Math.floor(sizes.length / 2)] : 0;
console.log("   calls per row:         median " + median +
  ", max " + (sizes.length ? Math.max(...sizes) : 0) +
  ", rows with an empty window " + windows.filter((w) => w.size === 0).length);
console.log("");

/* ---- 2. under-logged windows ---- */
console.log("2. UNDER-LOGGED WINDOWS   (a window far above the median covered questions that were not written down)");
const threshold = Math.max(median * 3, median + 5);
const wide = windows.filter((w) => w.size !== null && w.size >= threshold);
if (!wide.length) {
  console.log("   none above " + threshold + " calls. The log kept pace with the work.");
} else {
  for (const w of wide) {
    console.log("   row " + w.row.row + "  " + w.size + " calls (median " + median + ")  [" +
      w.row.phase + "]  " + String(w.row.question).slice(0, 74));
    if (VERBOSE) {
      for (const c of callOnly.slice(w.from, w.to)) console.log("        " + c.tool + "  " + String(c.target).slice(0, 90));
    }
  }
  console.log("   Re-read those windows: the row names one question and the calls did several.");
}
console.log("");

/* ---- 3. method not found in its own window ---- */
const STOP = new Set(["the", "a", "an", "and", "or", "of", "in", "on", "for", "to", "with", "from",
  "then", "read", "it", "i", "my", "this", "that", "is", "as", "at", "by", "am", "about", "look"]);
const tokens = (s) => String(s).toLowerCase().split(/[^a-z0-9_./:-]+/)
  .filter((t) => t.length >= 4 && !STOP.has(t));

console.log("3. METHOD NOT FOUND IN ITS WINDOW   (heuristic token match — a hit is a question, not a verdict)");
const notFound = [];
for (const w of windows) {
  const m = String(w.row.method || "").trim();
  if (!m || w.size === null || w.size === 0) continue;
  const want = tokens(m);
  if (!want.length) continue;
  const haystack = callOnly.slice(w.from, w.to).map((c) => String(c.tool) + " " + String(c.target)).join(" ").toLowerCase();
  const hit = want.some((t) => haystack.includes(t));
  if (!hit) notFound.push(w);
}
if (!notFound.length) {
  console.log("   every row's named method appears among the calls it is attributed.");
} else {
  for (const w of notFound) {
    console.log("   row " + w.row.row + "  [" + w.row.backed_by + "]  method: " + String(w.row.method).slice(0, 78));
    if (VERBOSE) for (const c of callOnly.slice(w.from, w.to)) console.log("        " + c.tool + "  " + String(c.target).slice(0, 90));
  }
  console.log("   Either the method was phrased differently from the call, or it was not what happened.");
}
console.log("");

/* ---- 4. tool mix by phase ---- */
console.log("4. TOOL MIX BY PHASE");
const byPhase = {};
for (const w of windows) {
  if (w.size === null) continue;
  const p = w.row.phase || "(none)";
  byPhase[p] = byPhase[p] || {};
  for (const c of callOnly.slice(w.from, w.to)) {
    const t = String(c.tool).split("/")[0];
    byPhase[p][t] = (byPhase[p][t] || 0) + 1;
  }
}
for (const [p, mix] of Object.entries(byPhase)) {
  const total = Object.values(mix).reduce((a, b) => a + b, 0);
  const parts = Object.entries(mix).sort((a, b) => b[1] - a[1]).map(([t, n]) => t + " " + n);
  console.log("   " + p.padEnd(11) + String(total).padStart(4) + " calls   " + parts.join(" · "));
}
console.log("");
console.log("Nothing above is a pass or a fail. Report 2 is where unlogged questions show up, and");
console.log("report 3 is where a row and the record of what happened do not line up.");
