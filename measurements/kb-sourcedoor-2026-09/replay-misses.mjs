#!/usr/bin/env node
/**
 * The source door, scored against what agents actually did.
 *
 *   node measurements/kb-sourcedoor-2026-09/replay-misses.mjs [--base <path>] [--why]
 *
 * Read-only. It calls `ask` through the module API, which is pure; the CLI's demand row is written
 * by `bin/kb.mjs` and never happens here. Nothing touches the deployment.
 *
 * TWO QUESTION SETS, kept apart because one is evidence and the other is mine.
 *
 *   RECORDED   the eight questions that really returned MISS, read out of the corpus's own
 *              demand.jsonl. Nobody wrote them for this measurement.
 *   ORACLE     round two's eight oracle items, phrased as a question. I wrote the phrasing, so
 *              these are reported separately and never folded into a headline.
 *
 * GROUND TRUTH IS NOT A JUDGEMENT HERE. Round two's three arms fetched platform source 31 times
 * between them, and every URL names a repository. Those repositories, mapped back through
 * `src/data/module-repos.json`, are the set of modules agents demonstrably needed for that task.
 * The door is scored on whether it points inside that set. The set is recomputed from the logs on
 * every run rather than pasted here.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { ask } from '../../src/resolve.mjs';
import { moduleRepos } from '../../src/source-door.mjs';

const argv = process.argv.slice(2);
const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : (process.env.KB_BASE ?? 'C:/_VIRTO/vc-knowledge');
const why = argv.includes('--why');
const CMP = 'C:/_VIRTO/_comparison-logs';

// --- ground truth: which repositories round two's arms actually read ------------------------------
const repoToModule = new Map();
for (const [id, row] of Object.entries(moduleRepos())) {
  if (row && row.repo) repoToModule.set(row.repo, id);
}
const fetchedRepos = new Map();
for (const arm of ['arm-A', 'arm-B', 'arm-C']) {
  const dir = join(CMP, 'round2', arm);
  if (!existsSync(dir)) continue;
  const f = readdirSync(dir).find((x) => /^tool-log-.*\.jsonl$/.test(x));
  if (!f) continue;
  for (const line of readFileSync(join(dir, f), 'utf8').split(/\r?\n/).filter(Boolean)) {
    const t = String(JSON.parse(line).target ?? '');
    for (const m of t.matchAll(/raw\.githubusercontent\.com\/VirtoCommerce\/([a-z0-9-]+)\//g)) {
      fetchedRepos.set(m[1], (fetchedRepos.get(m[1]) ?? 0) + 1);
    }
  }
}
const needed = new Set([...fetchedRepos.keys()].map((r) => repoToModule.get(r)).filter(Boolean));

// --- the questions ---------------------------------------------------------------------------------
const recorded = [...new Set(
  readFileSync(join(base, 'demand.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean)
    .map((l) => JSON.parse(l)).filter((r) => r.miss && r.question).map((r) => r.question),
)];

// Round two's eight oracle items, phrased by me. Kept as data so the phrasing can be disputed.
const ORACLE = [
  'why is discountAmountWithTax zero on an order discount row',
  'why is shippingTotal zero when a fixed rate shipping method was selected',
  'why is taxTotal zero and taxDetails empty on this store',
  'what happens to an order shipment when the order is cancelled',
  'why is paymentTotal zero while the inPayment sum is the order total',
  'why is paymentMethodCode absent while paymentMethod code is populated on an order',
  'does a promotion name have to match the reward it grants',
  'why did only one promotion apply when two were active and neither is exclusive',
];

const score = (label, questions) => {
  let miss = 0, withDoor = 0, inside = 0, outside = 0;
  const rows = [];
  for (const q of questions) {
    const r = ask(base, q, { limit: 3 });
    if (!r.miss) { rows.push(['HIT     ', '', q]); continue; }
    miss += 1;
    const doors = r.source ?? [];
    if (!doors.length) { rows.push(['MISS    ', '(no door)', q]); continue; }
    withDoor += 1;
    const named = doors.map((d) => d.module);
    const hitsNeeded = named.filter((m) => needed.has(m));
    if (hitsNeeded.length) inside += 1; else outside += 1;
    rows.push([hitsNeeded.length ? 'MISS+door' : 'MISS+far ', doors.map((d) => `${d.module.replace('VirtoCommerce.', '')}@${d.version}`).join(' '), q]);
  }
  console.log(`\n${label}: ${questions.length} questions`);
  console.log(`  MISS                                   ${miss}`);
  console.log(`  of those, a door names a module        ${withDoor}`);
  console.log(`  door names a module the arms read      ${inside}`);
  console.log(`  door names only modules they did not   ${outside}`);
  if (why) for (const [what, mods, q] of rows) console.log(`    ${what}  ${mods.padEnd(46)} ${q.slice(0, 86)}`);
};

console.log(`base ${base}`);
console.log(`round two's arms read ${[...fetchedRepos.values()].reduce((a, b) => a + b, 0)} source files from ${fetchedRepos.size} repositories:`);
console.log(`  ${[...fetchedRepos.entries()].sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r}x${n}`).join('  ')}`);
console.log(`resolved to ${needed.size} modules: ${[...needed].map((m) => m.replace('VirtoCommerce.', '')).join(', ')}`);

score('RECORDED — questions that really returned MISS', recorded);
score('ORACLE — round two items, phrased by me', ORACLE);

console.log('');
console.log('A door is scored as useful only if it names a module some arm actually went and read for');
console.log('this task. It is not scored on whether the answer is IN that module: this measurement says');
console.log('where to look, which is all the door claims. Whether reading it settles the question is');
console.log('the next run\u2019s problem, and no replay can answer it.');
