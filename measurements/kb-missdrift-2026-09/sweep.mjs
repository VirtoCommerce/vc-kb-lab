#!/usr/bin/env node
/**
 * The `ask` MISS contract, as the corpus grows: what would restore it, and what each option costs.
 *
 *   node measurements/kb-missdrift-2026-09/sweep.mjs [--base <path>] [--why]
 *
 * Read-only: `ask` is called through the module API, which writes nothing. The CLI's demand row is
 * written by `bin/kb.mjs` and never happens here.
 *
 * THE DEFECT. `README.md` states the contract as "an uncovered question returns an explicit MISS
 * rather than a plausible non-answer". The independent review's D4 said it drifts as the corpus
 * grows and demonstrated it on `kb how`. The flow side was fixed on 2026-09-16
 * (measurements/kb-flowmiss-2026-09/). This is the `ask` side, and it is worse: of the eight
 * questions the base ITSELF recorded as MISS in its own demand log, it answers seven today, and
 * six of those seven answers are adjacent rather than right.
 *
 * WHY A FIXED TERM COUNT CANNOT HOLD THE LINE. The floor asks for `min(3, n)` exact content terms.
 * As entries accumulate, more of them contain any three given words, so the same question clears
 * the same floor with worse candidates. The floor measures HOW MANY words matched and never WHICH,
 * and in a corpus of 668 entries about one platform the common words are the medium, not the
 * subject. That is not a new idea here: FUNCTION_WORDS already excludes `graphql`, `api`, `gql`
 * by hand for exactly this reason, and the comment there says so. A document-frequency floor is
 * that same rule, measured instead of listed.
 *
 * WHAT IS SWEPT. Each candidate is the current floor AND one extra condition, so nothing can be
 * served that would not be served today -- every candidate can only refuse more. The sweep reports
 * what each refusal costs on three independent guards:
 *
 *   negatives   4 questions the base recorded as MISS and that nothing written since answers
 *   positives   3 questions the corpus demonstrably answers, with the entry named; two are WRONG
 *               today, so this half is a target and not only a guard
 *   regression  the 34 held-out rows of measurements/kb-retrieval-2026-09/, scored the way that
 *               harness scores them: an anchor lost is a regression, whatever else improved. Plus
 *               the two blind graders' off-topic and wanted lists from grader-bar.mjs.
 */
const NL = String.fromCharCode(10);
import { readFileSync } from 'node:fs';

import { openBase, openFlows, FUNCTION_WORDS, relevanceFloor, aboutGoal } from '../../src/resolve.mjs';
import { tokenize, SEARCH_OPTIONS } from '../../src/index-build.mjs';
import { QUESTIONS } from '../kb-retrieval-2026-09/questions.mjs';
import { BAR } from '../kb-retrieval-2026-09/grader-bar.mjs';
import { SHOULD_MISS, SHOULD_SERVE, checkStale, renderStale } from './bar.mjs';

const argv = process.argv.slice(2);
const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : (process.env.KB_BASE ?? 'C:/_VIRTO/vc-knowledge');
const why = argv.includes('--why');

const opened = openBase(base);
const flows = openFlows(base);
const baseline = JSON.parse(readFileSync(new URL('../kb-retrieval-2026-09/data/baseline.json', import.meta.url), 'utf8'));
const wasServed = new Map(baseline.rows.map((r) => [r.row, r]));
const graderBar = new Map(BAR.map((b) => [b.row, b]));

const termsOf = (q) => new Set(
  tokenize(q).map((t) => t.toLowerCase()).filter((t) => t.length > 1 && !FUNCTION_WORDS.has(t)),
);

// Document frequency over BOTH read planes, because a term common in the corpus is common wherever
// the reader meets it. Cached: the sweep asks for the same terms hundreds of times.
const dfCache = new Map();
function df(term) {
  if (dfCache.has(term)) return dfCache.get(term);
  const n = opened.derived.search(term, { prefix: false, fuzzy: 0 }).length
    + (opened.captured ? opened.captured.search(term, { prefix: false, fuzzy: 0 }).length : 0);
  dfCache.set(term, n);
  return n;
}

const exact = (hit, terms) => Object.keys(hit.match).filter((t) => terms.has(t));

// A flow whose GOAL is what was asked. Reuses the rule measured and shipped for `kb how` on
// 2026-09-16 rather than inventing a second notion of "this question is procedural".
function flowGoalMatch(q, terms) {
  if (!flows.flows) return null;
  const floor = relevanceFloor(terms);
  const hit = flows.flows.search(q, SEARCH_OPTIONS)
    .filter((h) => exact(h, terms).length >= floor)
    .filter((h) => aboutGoal(
      Object.entries(h.match).filter(([t, f]) => terms.has(t) && f.some((x) => x === 'subject' || x === 'question')).map(([t]) => t),
      terms,
    ))
    .sort((a, b) => b.score - a.score)[0];
  return hit ? hit.id : null;
}

const CANDIDATES = [];
CANDIDATES.push({ name: 'control — today', pass: () => true, redirect: false });
for (const k of [1, 2, 3, 5, 8, 12, 20]) {
  CANDIDATES.push({
    name: `rarity: one matched term with df <= ${k}`,
    pass: (h, t) => exact(h, t).some((x) => df(x) <= k),
    redirect: false,
  });
}
CANDIDATES.push({ name: 'coverage: half the question\'s terms matched', pass: (h, t) => exact(h, t).length >= Math.ceil(t.size / 2), redirect: false });
// A GATE ON THE BEST HIT, not a filter on every hit -- the one shape the earlier goal-rule
// measurement did not try. The question is not "does this entry deserve slot three", it is "does
// this base have anything to say at all". If the best-scoring entry's own SUBJECT and QUESTION --
// the fields that say what it claims to answer -- share nothing with what was asked, then the
// ranking has nothing to rank and the honest answer is MISS.
for (const k of [1, 2, 3]) {
  CANDIDATES.push({ name: `gate: best hit carries >= ${k} goal term(s)`, pass: () => true, redirect: false, gate: k });
}
CANDIDATES.push({ name: 'gate: best hit >= 2 goal terms + flow redirect', pass: () => true, redirect: true, gate: 2 });
CANDIDATES.push({ name: 'flow redirect only', pass: () => true, redirect: true });
CANDIDATES.push({ name: 'rarity df <= 5 + flow redirect', pass: (h, t) => exact(h, t).some((x) => df(x) <= 5), redirect: true });
CANDIDATES.push({ name: 'rarity df <= 8 + flow redirect', pass: (h, t) => exact(h, t).some((x) => df(x) <= 8), redirect: true });

function serve(q, limit, cand) {
  const terms = termsOf(q);
  if (cand.redirect && flowGoalMatch(q, terms)) return { ids: [], redirected: true };
  const floor = relevanceFloor(terms);
  const raw = [
    ...opened.derived.search(q, SEARCH_OPTIONS),
    ...(opened.captured ? opened.captured.search(q, SEARCH_OPTIONS) : []),
  ];
  const kept = raw
    .filter((h) => exact(h, terms).length >= floor)
    .filter((h) => cand.pass(h, terms))
    .sort((a, b) => b.score - a.score);
  if (cand.gate) {
    const best = kept[0];
    const goals = best
      ? Object.entries(best.match).filter(([t, f]) => terms.has(t) && f.some((x) => x === 'subject' || x === 'question')).length
      : 0;
    if (goals < Math.min(cand.gate, terms.size)) return { ids: [], redirected: false };
  }
  return { ids: kept.slice(0, limit).map((h) => h.id), redirected: false };
}

console.log(`base ${base}\n`);
// THE BAR IS CHECKED BEFORE IT IS USED. It went stale in ninety minutes once and nothing noticed for
// a day; a table printed from a stale bar docks every candidate for being right.
const stale = checkStale(base);
if (stale.length) console.log(renderStale(stale) + NL);

console.log(`candidate                                      refused/${SHOULD_MISS.length}  answered/${SHOULD_SERVE.length}  anchors lost/34  off-topic  wanted`);
const detail = [];
for (const cand of CANDIDATES) {
  let refused = 0; let answered = 0; let lost = 0; let junk = 0; let wanted = 0;
  const rows = [];

  for (const n of SHOULD_MISS) {
    const { ids, redirected } = serve(n.q, 3, cand);
    if (!ids.length) { refused += 1; rows.push(`   refused${redirected ? ' (-> kb how)' : ''}  ${n.q.slice(0, 74)}`); }
    else rows.push(`   SERVED  ${ids.join(',')}  ${n.q.slice(0, 60)}`);
  }
  for (const p of SHOULD_SERVE) {
    const { ids } = serve(p.q, 3, cand);
    const ok = [p.want, ...(p.alsoAcceptable ?? [])].some((w) => ids.includes(w));
    if (ok) { answered += 1; rows.push(`   answered ${p.want}  ${p.q.slice(0, 62)}`); }
    else rows.push(`   ${ids.length ? 'missed  ' : 'MISS    '} want ${p.want} got ${ids.join(',') || '(none)'}  ${p.q.slice(0, 48)}`);
  }
  for (const q of QUESTIONS) {
    const { ids } = serve(q.q, q.limit, cand);
    const anchor = q.anchor ?? wasServed.get(q.row)?.served?.[0] ?? null;
    if (anchor && !ids.includes(anchor)) { lost += 1; rows.push(`   LOST ${q.row} ${anchor}  ${q.q.slice(0, 60)}`); }
    const b = graderBar.get(q.row);
    if (b) {
      junk += b.offTopic.filter((o) => ids.includes(o.id)).length;
      wanted += b.missing.filter((w) => ids.includes(w.id)).length;
    }
  }

  console.log(
    `${cand.name.padEnd(46)} ${String(refused).padStart(9)}  ${String(answered).padStart(10)}  ${String(lost).padStart(15)}  ${String(`${junk}/7`).padStart(9)}  ${String(`${wanted}/10`).padStart(6)}`,
  );
  detail.push([cand.name, rows]);
}

if (why) for (const [name, rows] of detail) console.log(`\n=== ${name}\n${rows.join('\n')}`);

console.log('');
console.log('`refused` counts the four questions the base itself once recorded as MISS and that nothing');
console.log('written since answers. `answered` counts three it demonstrably can answer, two of which it');
console.log('gets wrong today. `anchors lost` is the 2026-09-12 held-out set: an entry a real run used');
console.log('and would no longer be served. `off-topic` and `wanted` are the two blind graders\u2019 own lists.');
console.log('Every candidate can only REFUSE more than today: none of them can serve something new.');
