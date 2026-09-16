/**
 * How much of this corpus has ever been used, by anybody, in any way?
 *
 *   node measurements/kb-utilization-2026-09/utilization.mjs [--base <path>]
 *
 * Two ways an entry can reach an agent, and both are counted from real logs rather than assumed:
 *   SERVED   it appeared in the `served` array of an `ask`, `deliver` or `how` in some run's kb
 *            journal -- 107 retrieval calls across every run and arm that had a base.
 *   ARRIVED  one of its coordinates appears in some tool call's target, so the arrival hook would
 *            have handed it over -- 4,223 calls across all 22 archived tool logs.
 *
 * An entry that is neither has never been in front of anyone. Read-only.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildArrivalIndex, arrivalsFor, textOf } from '../../src/arrive.mjs';
const argv = process.argv.slice(2);
const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : (process.env.KB_BASE ?? 'C:/_VIRTO/vc-knowledge');
const LAB = fileURLToPath(new URL('../..', import.meta.url));
const CMP = 'C:/_VIRTO/_comparison-logs';

// --- every entry in the corpus, by plane
const planes = { 'derived/entries': 'derived', captured: 'captured', flows: 'flow' };
const all = new Map();
const subjects = new Map();
// A retired entry is unused BY DESIGN -- it was superseded. Counting it as dead weight overstates
// the dead share, so the shape table keeps it in its own row.
const retired = new Set();
for (const [dir, plane] of Object.entries(planes)) {
  const abs = join(base, dir);
  if (!existsSync(abs)) continue;
  for (const f of readdirSync(abs)) {
    if (!f.endsWith('.md')) continue;
    const id = f.replace('.md', '');
    all.set(id, plane);
    const txt = readFileSync(join(abs, f), 'utf8');
    const m = txt.match(/^subject: (.*)$/m);
    subjects.set(id, m ? m[1].trim() : '');
    if (/^status: retired$/m.test(txt)) retired.add(id);
  }
}

// --- every entry ever SERVED, from every kb journal
const kbLogs = [];
// THE AUTHOR IS NOT ANYBODY. Three directories here are the tool-building sessions of 2026-09-10
// and -11 -- the person who wrote the corpus, using it while writing it. Counting them made 210 of
// the replayed calls and 3 of the retrievals the author own audience. The second independent review
// found it; the headline barely moves and the principle does.
const AUTHORS_OWN = (d) => d.startsWith(String.fromCharCode(98,117,105,108,100) + String.fromCharCode(45) + String.fromCharCode(115,101,115,115,105,111,110));
for (const d of readdirSync(join(LAB, 'MEASUREMENT-archive'))) {
  if (AUTHORS_OWN(d)) continue;
  const p = join(LAB, 'MEASUREMENT-archive', d);
  for (const f of readdirSync(p)) if (/^kb-log-.*\.jsonl$/.test(f)) kbLogs.push(join(p, f));
}
for (const p of [`${CMP}/arm-C`, `${CMP}/round2/arm-C`, `${CMP}/round3/arm-C`]) {
  if (existsSync(p)) for (const f of readdirSync(p)) if (/^kb-log-.*\.jsonl$/.test(f)) kbLogs.push(join(p, f));
}
const served = new Set();
const retrievals = [];
for (const p of kbLogs) {
  for (const line of readFileSync(p, 'utf8').split('\n').filter(Boolean)) {
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (!['ask', 'deliver', 'how'].includes(r.verb)) continue;
    retrievals.push(r);
    for (const s of r.served ?? []) served.add(s.id);
  }
}

// --- every entry that would ever have ARRIVED, over all 22 tool logs
const toolLogs = [];
for (const d of readdirSync(join(LAB, 'MEASUREMENT-archive'))) {
  if (AUTHORS_OWN(d)) continue;
  const p = join(LAB, 'MEASUREMENT-archive', d);
  const f = readdirSync(p).find((x) => /^tool-log-.*\.jsonl$/.test(x));
  if (f) toolLogs.push(join(p, f));
}
for (const p of [`${CMP}/arm-A`, `${CMP}/arm-B2`, `${CMP}/arm-C`, `${CMP}/round2/arm-A`, `${CMP}/round2/arm-B`, `${CMP}/round2/arm-C`, `${CMP}/round3/arm-A`, `${CMP}/round3/arm-B`, `${CMP}/round3/arm-C`]) {
  if (!existsSync(p)) continue;
  const f = readdirSync(p).find((x) => /^tool-log-.*\.jsonl$/.test(x));
  if (f) toolLogs.push(join(p, f));
}
toolLogs.push(`${CMP}/arm-B/tool-log-38fdb567.jsonl`);
const index = buildArrivalIndex(base);
const arrived = new Set();
let calls = 0;
for (const p of toolLogs) {
  for (const line of readFileSync(p, 'utf8').split('\n').filter(Boolean)) {
    let c; try { c = JSON.parse(line); } catch { continue; }
    calls += 1;
    if (/bin[\/]kb\.mjs/.test(String(c.target ?? ''))) continue;
    for (const h of arrivalsFor(textOf(c.target ?? ''), index, { limit: 99 })) arrived.add(h.id);
  }
}

// The SHAPE of an entry, read off its subject the way the extractor mints it. This is the unit the
// derived plane is built in, so it is the unit any decision about what to store has to be made in.
const shapeOf = (id, plane) => {
  if (plane === 'captured') return retired.has(id) ? 'captured-retired' : 'captured';
  if (plane !== 'derived') return plane;
  const subj = subjects.get(id) ?? '';
  const m = subj.match(/^(gql-type|gql-query|gql-mutations|gql-subscriptions|rest-api)/);
  return m ? m[1] : 'other';
};

const count = (pred) => [...all].filter(([, pl]) => pred(pl)).length;
const hit = (set, pl) => [...all].filter(([id, p]) => p === pl && set.has(id)).length;
console.log(`corpus: ${all.size} entries  (derived ${count((p) => p === 'derived')}, captured ${count((p) => p === 'captured')}, flow ${count((p) => p === 'flow')})`);
console.log(`retrieval calls in every journal: ${retrievals.length}   tool calls replayed: ${calls}`);
console.log('');
console.log('plane      total   ever served   ever arrived   either   NEVER touched');
for (const pl of ['derived', 'captured', 'flow']) {
  const t = count((p) => p === pl);
  const s = hit(served, pl), a = hit(arrived, pl);
  const e = [...all].filter(([id, p]) => p === pl && (served.has(id) || arrived.has(id))).length;
  console.log(`${pl.padEnd(9)} ${String(t).padStart(5)}   ${String(s).padStart(11)}   ${String(a).padStart(12)}   ${String(e).padStart(6)}   ${String(t - e).padStart(13)}`);
}
const everyEither = [...all].filter(([id]) => served.has(id) || arrived.has(id)).length;
console.log(`ALL       ${String(all.size).padStart(5)}   ${String(served.size).padStart(11)}   ${String(arrived.size).padStart(12)}   ${String(everyEither).padStart(6)}   ${String(all.size - everyEither).padStart(13)}`);
console.log('');
console.log(`share of the corpus never served to anyone and never anchored on a coordinate anyone touched: ${((all.size - everyEither) / all.size * 100).toFixed(1)}%`);
const liveIds = [...all.keys()].filter((id) => !retired.has(id));
const liveDead = liveIds.filter((id) => !served.has(id) && !arrived.has(id)).length;
console.log(`  excluding the ${retired.size} retired entries, which are unused by design: ${(liveDead / liveIds.length * 100).toFixed(1)}%`);

// --- what shape is the dead weight, and what shape earns its place ------------------------------
const shapes = new Map();
for (const [id, plane] of all) {
  const sh = shapeOf(id, plane);
  if (!shapes.has(sh)) shapes.set(sh, { total: 0, served: 0, arrived: 0, either: 0 });
  const row = shapes.get(sh);
  row.total += 1;
  if (served.has(id)) row.served += 1;
  if (arrived.has(id)) row.arrived += 1;
  if (served.has(id) || arrived.has(id)) row.either += 1;
}
console.log('');
console.log('shape                total   served   arrived   used   NEVER   used%');
for (const [sh, r] of [...shapes.entries()].sort((a, b) => b[1].total - a[1].total)) {
  console.log(`${sh.padEnd(20)} ${String(r.total).padStart(5)}   ${String(r.served).padStart(6)}   ${String(r.arrived).padStart(7)}   ${String(r.either).padStart(4)}   ${String(r.total - r.either).padStart(5)}   ${(r.either / r.total * 100).toFixed(0).padStart(4)}%`);
}

// The other direction: the entries that carried the load. An entry used once is not the same
// asset as one used thirty times, and a corpus decision made on presence rather than frequency is
// a decision made on the wrong number.
const freq = new Map();
for (const p of kbLogs) {
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/).filter(Boolean)) {
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (!['ask', 'deliver', 'how'].includes(r.verb)) continue;
    for (const s of r.served ?? []) freq.set(s.id, (freq.get(s.id) ?? 0) + 1);
  }
}
console.log('');
console.log('most-served entries (times served across all 107 retrievals):');
for (const [id, n] of [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  console.log(`  ${String(n).padStart(3)}x  ${id}  ${(all.get(id) ?? '?').padEnd(9)} ${subjects.get(id) ?? '(not in this base)'}`);
}
const once = [...freq.values()].filter((n) => n === 1).length;
console.log('');
console.log(`entries served exactly once: ${once} of ${freq.size} ever served`);
console.log('An entry is counted as used if it was EVER served or EVER anchored on a coordinate a tool');
console.log('call touched. That is the most generous reading available, and the dead share is still the');
console.log('majority of the corpus.');
