#!/usr/bin/env node
/**
 * ONE-OFF. Give the corpus's anonymous evidence rows the author the tool already recorded.
 *
 *   node scripts/attribute-anonymous-rows-2026-09-16.mjs [--base <path>] [--write] [--report <file>]
 *
 * WHAT I GOT WRONG. I told the second review that the corpus's anonymous confirm rows "predate
 * `sessionParty`, and there is no artefact and no author to check them against", and refused a
 * sweep on that basis. Refusing the sweep was right. The reason was wrong. Every writing verb a run
 * ever ran was recorded by the tool in that run's kb journal, with a timestamp and a session id,
 * and 19 of those journals are archived. The author was never missing; nobody had looked.
 *
 * WHAT THIS DOES. For each evidence row carrying no `by` and no `from`, it looks for a tool-written
 * event on the SAME entry, with the matching verb (`capture` for an entry's first row, `confirm`
 * for any later one), within five seconds. On a hit it sets `by: session:<id>` — exactly what
 * `sessionParty` would have written had it existed. Nothing else changes.
 *
 * WHAT IT REFUSES TO DO.
 *
 *   * It sets no `from`. A `from` says the claim was TRANSCRIBED out of a named artefact, and
 *     `partiesOf` counts it ahead of `by` for that reason. These rows were not transcribed from the
 *     journal; the journal is the tool's record that the row was written. Using `from` here would
 *     buy auditability by lying about what kind of evidence this is.
 *   * It writes no `attested` mark, in either direction. Whether anything was described is a
 *     question about a note that never existed, and this migration has nothing to say about it.
 *   * It leaves an unmatched row anonymous and lists it. Three confirm rows have no journal event
 *     within TWO DAYS in any archive — they were not written by any archived run — and two of those
 *     sit 251ms apart, which is the shape of the batch already demoted on KB-7E35E6BC. Guessing a
 *     session for them would be the typed-witness failure this project spent a day removing.
 *
 * WHAT IT COSTS. Nothing, which is the point. Licensed entries — two or more parties, not disputed,
 * the set an agent may act on without re-verifying — is 22 before and 22 after. The anonymous rows
 * really were distinct sessions, so attributing them neither promotes nor demotes anything. What it
 * buys is a register that can print who saw each fact.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { parseEntry, stringifyFrontmatter } from '../src/frontmatter.mjs';
import { partiesOf } from '../src/provenance.mjs';
import { confirmationsOf, isDisputed } from '../src/capture.mjs';

const argv = process.argv.slice(2);
const at = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const base = at('--base', 'C:/_VIRTO/vc-knowledge');
const write = argv.includes('--write');
const reportPath = at('--report', null);

const WINDOW_MS = 5000;
const ARCHIVES = ['C:/_VIRTO/vc-kb-lab/MEASUREMENT-archive', 'C:/_VIRTO/_comparison-logs'];

// --- every event the tool ever journalled ---------------------------------------------------------

const journals = [];
const walk = (d) => {
  if (!existsSync(d)) return;
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/^kb-log-.*\.jsonl$/.test(f)) journals.push(p);
  }
};
for (const r of ARCHIVES) walk(r);

if (!journals.length) {
  console.error('refused: no archived kb journals found. This migration reads authorship out of them;');
  console.error('  without them it would be assigning sessions by guesswork.');
  process.exit(2);
}

const events = [];
for (const p of journals) {
  const session = p.match(/kb-log-([0-9a-f]+)\.jsonl$/)[1];
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let r;
    try { r = JSON.parse(line); } catch { continue; }
    if (!r.ts || !r.wrote?.id) continue;
    events.push({ verb: r.verb, id: r.wrote.id, ts: Date.parse(r.ts), session, journal: p });
  }
}

const findEvent = (id, verb, atIso) => {
  const t = Date.parse(atIso);
  if (Number.isNaN(t)) return null;
  return events.find((e) => e.id === id && e.verb === verb && Math.abs(e.ts - t) <= WINDOW_MS) ?? null;
};

// --- the rows -------------------------------------------------------------------------------------

const capturedDir = join(base, 'captured');
const matched = [];
const unmatched = [];
const files = new Map();

for (const f of readdirSync(capturedDir)) {
  if (!f.endsWith('.md')) continue;
  const parsed = parseEntry(readFileSync(join(capturedDir, f), 'utf8'), f);
  const rows = parsed.data.evidence ?? [];
  let touched = false;

  rows.forEach((row, i) => {
    if (row.by || row.from) return;            // already attributable
    if (row.method === 'source') return;       // a source row names its module and path already
    const verb = i === 0 ? 'capture' : 'confirm';
    const hit = findEvent(parsed.data.id, verb, row.at);
    if (!hit) {
      unmatched.push({ id: parsed.data.id, at: row.at, verb });
      return;
    }
    row.by = `session:${hit.session}`;
    matched.push({ id: parsed.data.id, at: row.at, verb, session: hit.session, journal: hit.journal });
    touched = true;
  });

  if (touched) files.set(join(capturedDir, f), parsed);
}

// --- what it costs, computed before anything is written -------------------------------------------

const licensed = (dir) => {
  let n = 0;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const { data } = parseEntry(readFileSync(join(dir, f), 'utf8'), f);
    if (data.status === 'active' && confirmationsOf(data) >= 2 && !isDisputed(data)) n += 1;
  }
  return n;
};
const before = licensed(capturedDir);
let after = 0;
for (const f of readdirSync(capturedDir)) {
  if (!f.endsWith('.md')) continue;
  const p = join(capturedDir, f);
  const { data } = files.has(p) ? files.get(p) : parseEntry(readFileSync(p, 'utf8'), f);
  if (data.status !== 'active' || isDisputed(data)) continue;
  const rows = (data.evidence ?? []).filter((e) => !e.contradicts && e.method !== 'source');
  if (partiesOf(rows) >= 2) after += 1;
}

console.log(`journals read      : ${journals.length}  (${events.length} tool-written events)`);
console.log(`rows attributed    : ${matched.length}`);
console.log(`rows left anonymous: ${unmatched.length}`);
console.log(`licensed entries   : ${before} -> ${after}`);
console.log('');
if (unmatched.length) {
  console.log('LEFT ANONYMOUS — no archived run wrote these, and none is guessed:');
  for (const u of unmatched) console.log(`  ${u.id}  ${u.verb.padEnd(7)}  ${u.at}`);
  console.log('');
}

if (after < before) {
  console.error('refused: attribution LOWERS the licensed count. That means two rows this migration');
  console.error('  attributed to one session were counted as two parties before. Stop and look: the');
  console.error('  entries that move are self-confirmations, and they need a judgement, not a sweep.');
  process.exit(2);
}

if (reportPath) {
  const lines = [
    '# Attribution of anonymous evidence rows, 2026-09-16',
    '',
    'Written by `scripts/attribute-anonymous-rows-2026-09-16.mjs`. Every row below carried no author',
    'until now; the session comes from the tool\'s own journal for that run, matched on entry id,',
    'verb and a timestamp within five seconds. Nothing here is a judgement about what was observed.',
    '',
    `Journals read: ${journals.length}. Rows attributed: ${matched.length}. Left anonymous: ${unmatched.length}.`,
    `Licensed entries: ${before} before, ${after} after.`,
    '',
    '| entry | verb | row timestamp | session | journal |',
    '|---|---|---|---|---|',
    ...matched.map((m) => `| \`${m.id}\` | ${m.verb} | ${m.at} | \`session:${m.session}\` | \`${m.journal.split(/[\\/]/).slice(-2).join('/')}\` |`),
    '',
    '## Left anonymous',
    '',
    'No archived run wrote these. Two of them sit 251ms apart, which is the shape of the batch',
    'already demoted on `KB-7E35E6BC`. They are candidates for the same scrutiny, not for a guess.',
    '',
    '| entry | verb | row timestamp |',
    '|---|---|---|',
    ...unmatched.map((u) => `| \`${u.id}\` | ${u.verb} | ${u.at} |`),
    '',
  ];
  writeFileSync(reportPath, lines.join('\n'));
  console.log(`report written: ${reportPath}`);
}

if (!write) {
  console.log('DRY RUN. Nothing written. Re-run with --write, then `kb reindex` and `kb validate`.');
  process.exit(0);
}

for (const [path, parsed] of files) {
  writeFileSync(path, stringifyFrontmatter(parsed.data) + String.fromCharCode(10) + parsed.body);
}
console.log(`written: ${files.size} entr(ies)`);
console.log('Now run `node bin/kb.mjs reindex` and `node bin/kb.mjs validate`.');
