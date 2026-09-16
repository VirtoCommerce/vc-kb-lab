#!/usr/bin/env node
/**
 * WHERE ROUND FIVE GOES: the most-walked namespace, by the same rule round four used inverted.
 *
 *   node measurements/kb-run5-2026-09/pick-namespace.mjs [--base <path>]
 *
 * Round four went to ground NO run had touched, which made the sealed prediction falsifiable and
 * meant the run said nothing about covered ground. It also meant the treatment's second half never
 * got tested: the licence to act on a `confirmed` entry without re-verifying was exercised zero
 * times with any weight on it, because only one entry the arm touched was licensed at all.
 *
 * So this run goes to ground that HAS been walked, and the second review's condition holds: the
 * choice is made from the deployment's contract and the archived tool logs, and this script never
 * opens `captured/` to decide anything.
 *
 * WHAT IS REPORTED AFTER THE PICK, AND IS NOT AN INPUT TO IT. Once the namespace is chosen, the
 * script counts how many register entries anchor there and how many of those are licensed. That
 * number is a CONSEQUENCE of the pick and a fact the run needs stated in advance — if it is zero,
 * round five tests the protocol on nothing and we should know that before the arm starts rather
 * than after. It is printed below a rule that says so, and it can only be read, never optimised
 * against: changing the pick to raise it would be the commissioning this whole design removes.
 *
 * The correlation being relied on is honest and worth naming: the register was written BY runs
 * walking this ground, so the most-walked namespace is likely to be the best covered. That is a
 * prediction this script's own output can falsify, not an assumption it encodes.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseEntry } from '../../src/frontmatter.mjs';
import { confirmationsOf, isDisputed } from '../../src/capture.mjs';
import { normalizeAnchor } from '../../src/anchors.mjs';

const LAB = fileURLToPath(new URL('../..', import.meta.url));
const CMP = 'C:/_VIRTO/_comparison-logs';
const argv = process.argv.slice(2);
const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : (process.env.KB_BASE ?? 'C:/_VIRTO/vc-knowledge');

// --- the pick: contract and logs only -------------------------------------------------------------

const routes = new Map();
const derivedDir = join(base, 'derived', 'entries');
for (const f of readdirSync(derivedDir)) {
  if (!f.endsWith('.md')) continue;
  const t = readFileSync(join(derivedDir, f), 'utf8');
  if (!/^subject: rest-api/m.test(t)) continue;
  for (const m of t.matchAll(/^ {2}- coordinate: (?:[A-Z]+ )?(\/api\/[^\s]*)$/gm)) {
    const ns = m[1].split('/').slice(0, 3).join('/');
    if (!routes.has(ns)) routes.set(ns, new Set());
    routes.get(ns).add(m[1]);
  }
}

const dirs = [];
const archive = join(LAB, 'MEASUREMENT-archive');
if (existsSync(archive)) for (const d of readdirSync(archive)) dirs.push(join(archive, d));
for (const d of ['arm-A', 'arm-B', 'arm-B2', 'arm-C']) dirs.push(`${CMP}/${d}`);
for (const r of ['round2', 'round3']) for (const d of ['arm-A', 'arm-B', 'arm-C']) dirs.push(`${CMP}/${r}/${d}`);
dirs.push(`${CMP}/round4/arm-C-catalog`);

const logs = [];
for (const dir of dirs) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (/^tool-log-.*\.jsonl$/.test(f)) logs.push(readFileSync(join(dir, f), 'utf8').toLowerCase());
  }
}
const haystack = logs.join('\n');

// HOW WALKED, not whether. Round four only needed a yes/no because it wanted the zeroes; picking the
// most-walked needs them ordered, so count occurrences rather than test for one.
const occurrences = (needle) => {
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) { n += 1; i = haystack.indexOf(needle, i + needle.length); }
  return n;
};

const rows = [...routes.entries()]
  .map(([ns, set]) => ({ ns, routes: set.size, hits: occurrences(ns.toLowerCase()) }))
  .sort((a, b) => b.hits - a.hits || b.routes - a.routes);

console.log(`REST namespaces the contract publishes, by how often ${logs.length} archived tool logs touched one`);
console.log('');
console.log('   hits  routes  namespace');
for (const r of rows.slice(0, 12)) console.log(`${String(r.hits).padStart(7)}  ${String(r.routes).padStart(6)}  ${r.ns}`);
if (rows.length > 12) console.log(`         … ${rows.length - 12} more, all quieter`);

const picked = rows[0];
console.log('');
console.log(`PICKED: ${picked.ns} — ${picked.hits} mentions across the archived logs, ${picked.routes} routes in the contract.`);

// --- reported after the pick, and never an input to it ---------------------------------------------

console.log('');
console.log('--- everything below is a CONSEQUENCE of the pick, not a reason for it -------------------');
console.log('');

let anchored = 0;
let licensed = 0;
const capturedDir = join(base, 'captured');
for (const f of readdirSync(capturedDir)) {
  if (!f.endsWith('.md')) continue;
  const { data } = parseEntry(readFileSync(join(capturedDir, f), 'utf8'), f);
  if (data.status !== 'active') continue;
  const here = (data.anchors ?? []).some((a) => normalizeAnchor(a.coordinate ?? a).includes(picked.ns.toLowerCase()));
  if (!here) continue;
  anchored += 1;
  if (confirmationsOf(data) >= 2 && !isDisputed(data)) licensed += 1;
}

console.log(`register entries anchored in ${picked.ns} : ${anchored}`);
console.log(`  of those, licensed (2+ parties, not disputed): ${licensed}`);
console.log('');
if (licensed === 0) {
  console.log('ZERO LICENSED ENTRIES ON THIS GROUND. Round five would test the protocol on nothing, exactly');
  console.log('as round four did. Say so in the run page before the arm starts; do NOT re-pick, because');
  console.log('re-picking to raise this number is the commissioning this design exists to remove.');
} else {
  console.log(`The licence to act without re-verifying can be exercised ${licensed} time(s) here. That is what`);
  console.log('round four could not test. It is a ceiling, not a prediction: the arm may touch none of them.');
}
