/**
 * Every question anybody has ever really asked this base, replayed through the FLOW plane under
 * six candidate goal rules, scored against a bar written by hand BEFORE the variants were run.
 *
 *   node measurements/kb-flowmiss-2026-09/replay-variants.mjs [--base <path>] [--why]
 *
 * The questions are FROZEN in `questions.json` -- 88 distinct ones taken from the corpus's own
 * `demand.jsonl` at 278 rows, none of them written for this measurement. Frozen rather than read
 * live, and the reason is a defect this measurement caught in itself: `kb ask` and `kb how` WRITE
 * a demand row, so probing a COPY of the corpus appends to that copy, and five questions written
 * while making the change under test turned up inside the set that was supposed to be held out
 * from it. The count went 88 -> 93 and every variant's score moved. `--from-demand` refreshes the
 * file deliberately, from the base given.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openFlows, FUNCTION_WORDS, relevanceFloor } from '../../src/resolve.mjs';
import { tokenize, SEARCH_OPTIONS } from '../../src/index-build.mjs';
import { EXPECT, BORDERLINE } from './bar.mjs';
const argv = process.argv.slice(2);
const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : (process.env.KB_BASE ?? 'C:/_VIRTO/vc-knowledge');
const FROZEN = fileURLToPath(new URL('questions.json', import.meta.url));
if (argv.includes('--from-demand')) {
  const rows = readFileSync(join(base, 'demand.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
  const fresh = [...new Set(rows.filter((r) => r.question).map((r) => r.question))];
  const held = JSON.parse(readFileSync(FROZEN, 'utf8'));
  writeFileSync(FROZEN, `${JSON.stringify({ ...held, takenAt: new Date().toISOString().slice(0, 10), demandRows: rows.length, distinctQuestions: fresh.length, questions: fresh }, null, 1)}\n`);
  console.log(`refrozen: ${fresh.length} questions from ${rows.length} demand rows in ${base}`);
  process.exit(0);
}
const qs = JSON.parse(readFileSync(FROZEN, 'utf8')).questions;
const fl = openFlows(base);
const GOAL = new Set(['subject', 'question']);
const termsOf = (q) => new Set(tokenize(q).map((t) => t.toLowerCase()).filter((t) => t.length > 1 && !FUNCTION_WORDS.has(t)));

// goal terms, counted two ways: EXACT (the indexed goal term is a query term) and PREFIX (a query
// term is a prefix of the indexed goal term -- `read` against `reading`, which is what a person
// means when they say a question is about a goal).
function goalCount(hit, terms, { prefix }) {
  const out = new Set();
  for (const [t, fields] of Object.entries(hit.match)) {
    if (!fields.some((f) => GOAL.has(f))) continue;
    if (terms.has(t)) { out.add(t); continue; }
    if (prefix) for (const q of terms) if (t.startsWith(q) && q.length >= 3) out.add(q);
  }
  return out.size;
}
const VARIANTS = {
  'V0 none (before today)': () => true,
  'V1 majority, exact (shipped)': (g, n) => g > n / 2,
  'V2 majority, prefix credit': (g, n) => g > n / 2,
  'V3 min(2,n) exact': (g, n) => g >= Math.min(2, n),
  'V4 min(2,n) prefix credit': (g, n) => g >= Math.min(2, n),
  'V5 >=2 and >=40%, prefix': (g, n) => g >= Math.min(2, n) && g >= n * 0.4,
};
const usesPrefix = (name) => /prefix/.test(name);

const run = (q, rule, prefix) => {
  const terms = termsOf(q); const floor = relevanceFloor(terms);
  return fl.flows.search(q, SEARCH_OPTIONS)
    .filter((h) => Object.keys(h.match).filter((t) => terms.has(t)).length >= floor)
    .filter((h) => rule(goalCount(h, terms, { prefix }), terms.size))
    .sort((a, b) => b.score - a.score).slice(0, 2).map((h) => h.id);
};
console.log(`bar: ${Object.values(EXPECT).filter(Boolean).length} must hit, ${Object.values(EXPECT).filter((v) => v === null).length} must MISS, ${BORDERLINE.length} borderline, out of ${qs.length} real questions\n`);
console.log('variant                        falseMISS  falseHIT  wrongFlow  correct  answered/all  borderline hit');
for (const [name, rule] of Object.entries(VARIANTS)) {
  let falseMiss = 0, falseHit = 0, wrongFlow = 0, correct = 0, answered = 0, bl = 0;
  const bad = [];
  for (const q of qs) {
    const got = run(q, rule, usesPrefix(name));
    if (got.length) answered += 1;
    if (BORDERLINE.includes(q)) { if (got.length) bl += 1; continue; }
    if (!(q in EXPECT)) continue;
    const want = EXPECT[q];
    if (want === null) { if (got.length) { falseHit += 1; bad.push(`  falseHIT  ${got.join(',')}  ${q.slice(0, 80)}`); } else correct += 1; }
    else if (!got.length) { falseMiss += 1; bad.push(`  falseMISS want ${want}  ${q.slice(0, 80)}`); }
    else if (got[0] !== want) { wrongFlow += 1; bad.push(`  wrongFLOW got ${got[0]} want ${want}  ${q.slice(0, 70)}`); }
    else correct += 1;
  }
  console.log(`${name.padEnd(30)} ${String(falseMiss).padStart(9)} ${String(falseHit).padStart(9)} ${String(wrongFlow).padStart(10)} ${String(correct).padStart(8)} ${String(answered).padStart(12)} ${String(bl).padStart(15)}`);
  if (argv.includes('--why') && bad.length) console.log(bad.join('\n'));
}
