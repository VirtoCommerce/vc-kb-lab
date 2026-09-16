#!/usr/bin/env node
/**
 * REDISCOVERY AVOIDED — how often somebody re-established a fact the base already held.
 *
 *   node measurements/kb-rediscovery-2026-09/rediscovery.mjs [--base <path>] [--why]
 *
 * Read-only. Touches no deployment. Proposed by the second independent review as the outcome
 * measure this project has been missing, and the reasoning is worth restating: three controlled
 * rounds were null on tool calls, and the base's own protocol FORBIDS them from moving — it tells
 * its reader to treat the base as a lens and verify in proportion to blast radius. A corpus that
 * instructs re-verification cannot save its reader calls. What it can do is stop a fact from having
 * to be discovered twice.
 *
 * TWO POPULATIONS, kept apart because they answer different questions.
 *
 *   ARMLESS PARTIES (arm A: nothing; arm B: the QA repository) never had the base. When one of them
 *   reports a fact the corpus already held, that is the clean demand signal: somebody paid to find
 *   out something already written down. No design decision of this project can flatter it — they
 *   could not have consulted the base whatever it looked like.
 *
 *   PARTIES WITH THE BASE re-establishing a held fact is a different finding: the mechanism was
 *   available and did not deliver, or delivered and was not trusted. Split further by whether the
 *   base had actually served the entry first.
 *
 * WHAT COUNTS AS EVIDENCE, and why neither half is a judgement call:
 *
 *   armless party    an evidence row naming that party's report in `from:`. Those rows were
 *                    relabelled on 2026-09-16 and each names a file on disk, so a reader can open it
 *                    and dispute the transcription. (Before that day they said `by: round2-arm-B`,
 *                    which named a witness that had never written anything.)
 *   party with base  a `confirm` in that party's own kb journal against an entry that already
 *                    existed. The journal is written by the tool, not by the party.
 *
 * An entry counts only if it was born BEFORE the party started — the same rule as the arrival
 * replay, shared from ../lib/birth.mjs, because a fact written after a run cannot have been
 * rediscovered by it.
 *
 * WHAT THIS CANNOT SEE. A party that rediscovered a fact and did not write it down anywhere leaves
 * no trace here, so every number below is a floor. And the transcriptions were made by one person
 * reading reports; `--why` prints the entry and the report so the judgement can be checked.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CAPTURED_DIR, FLOWS_DIR } from '../../src/planes.mjs';
import { birthDates, describeBirths } from '../lib/birth.mjs';

const argv = process.argv.slice(2);
const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : (process.env.KB_BASE ?? 'C:/_VIRTO/vc-knowledge');
const why = argv.includes('--why');

const LAB = fileURLToPath(new URL('../..', import.meta.url));
const CMP = 'C:/_VIRTO/_comparison-logs';

// Every party, with the one fact that decides which population it belongs to.
const PARTIES = [
  { label: 'r1 A', dir: `${CMP}/arm-A`, had: 'nothing', report: `${CMP}/arm-A/artifacts/REPORT.md` },
  { label: 'r1 B', dir: `${CMP}/arm-B`, had: 'QA repo', report: `${CMP}/arm-B/report.md` },
  { label: 'r1 C', dir: `${CMP}/arm-C`, had: 'the base', report: `${CMP}/arm-C/report.md` },
  { label: 'r2 A', dir: `${CMP}/round2/arm-A`, had: 'nothing', report: `${CMP}/round2/arm-A/report.md` },
  { label: 'r2 B', dir: `${CMP}/round2/arm-B`, had: 'QA repo', report: `${CMP}/round2/arm-B/report.md` },
  { label: 'r2 C', dir: `${CMP}/round2/arm-C`, had: 'the base', report: `${CMP}/round2/arm-C/report.md` },
  { label: 'r3 A', dir: `${CMP}/round3/arm-A`, had: 'nothing', report: `${CMP}/round3/arm-A/artifacts/company-members-audit/REPORT.md` },
  { label: 'r3 B', dir: `${CMP}/round3/arm-B`, had: 'QA repo', report: `${CMP}/round3/arm-B/report.md` },
  { label: 'r3 C', dir: `${CMP}/round3/arm-C`, had: 'the base', report: `${CMP}/round3/arm-C/report.md` },
];

// WHICH CORPUS FACT EACH ARMLESS REPORT RESTATES — a judgement, kept here as DATA so it can be
// disputed row by row, the way the arrival replay keeps SOURCE_SUBJECTS. Every row was read out of
// the named section and checked against the entry's own claim; the section is quoted so a reader
// can go and disagree without re-reading six reports.
//
// The `from:` rows in the corpus are picked up automatically and merged with this; they are the
// same judgement made earlier and recorded in the corpus instead of here.
//
// WHAT IS DELIBERATELY ABSENT. Facts an armless party established that the corpus did NOT yet hold
// are not rediscoveries — they are discoveries, and several entries were written FROM these very
// reports afterwards (KB-5ADBFB34, KB-0C102D97, KB-132A40B3, KB-BF730613 among them). Counting
// those would credit the base for facts it learned from the party it is being measured against.
// The birth filter below removes them mechanically, but they are called out here because the
// distinction is the whole point: convergent DISCOVERY by several parties is evidence a fact is
// worth holding; REDISCOVERY is evidence the holding did not pay.
const RESTATED = [
  { party: 'r1 A', id: 'KB-6AA0D7FB', where: 'section 4', what: 'the configured Ground rate is literally zero, not a discount' },
  { party: 'r1 B', id: 'KB-6AA0D7FB', where: 'section 4', what: 'the store shipping method is configured with a zero rate' },
  { party: 'r1 B', id: 'KB-4982C91F', where: 'section 3', what: '241.9455 exact against a displayed 241.95' },
  { party: 'r2 A', id: 'KB-6AA0D7FB', where: 'section 2', what: 'the choice and the price are stored separately; the method survives, the money does not' },
  { party: 'r2 A', id: 'KB-4CCC2DD6', where: 'section 4', what: 'the cancellation cascade exists for payments and does not exist for shipments' },
  { party: 'r2 A', id: 'KB-0DD47BD1', where: 'section 5', what: 'PaymentTotal is what the payment methods cost, not what is being paid' },
  { party: 'r2 B', id: 'KB-6AA0D7FB', where: 'section 2', what: 'the same, independently' },
  { party: 'r2 B', id: 'KB-4CCC2DD6', where: 'section 4', what: 'the same, independently' },
  { party: 'r2 B', id: 'KB-0DD47BD1', where: 'section 5', what: 'the same, independently' },
  { party: 'r3 A', id: 'KB-27B4CD10', where: 'section 2', what: 'the Active column reports Contact.Status and nothing else' },
  { party: 'r3 A', id: 'KB-4B889114', where: 'section 1', what: 'the contact record and the security account diverge on the same person' },
  { party: 'r3 A', id: 'KB-4D082C89', where: 'section 1', what: 'PendingApproval with no roles is what an un-accepted invitation looks like' },
  { party: 'r3 B', id: 'KB-27B4CD10', where: 'section 2', what: 'the same, independently, with the storefront status filter as corroboration' },
  { party: 'r3 B', id: 'KB-4B889114', where: 'section 1', what: 'the same, independently' },
  { party: 'r3 B', id: 'KB-4D082C89', where: 'section 1', what: 'the same, independently' },
];
const archive = join(LAB, 'MEASUREMENT-archive');
for (const d of existsSync(archive) ? readdirSync(archive) : []) {
  if (!/^run-\d+/.test(d)) continue;
  PARTIES.push({ label: d.slice(0, 6), dir: join(archive, d), had: 'the base', report: null });
}

const readJsonl = (file) => readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => {
  try { return JSON.parse(l); } catch { return null; }
}).filter(Boolean);

const findLog = (dir, prefix) => {
  if (!existsSync(dir)) return null;
  const f = readdirSync(dir).find((x) => x.startsWith(prefix) && x.endsWith('.jsonl'));
  return f ? join(dir, f) : null;
};

const births = birthDates(base);
const { bornAt } = births;
console.log(describeBirths(births));

const subjects = new Map();
// Which entries each report was transcribed into. Built from the CORPUS, not from the reports: a
// `from:` row names the artefact a claim was read out of, and the path has to exist.
const restated = new Map();
for (const dir of [CAPTURED_DIR, FLOWS_DIR]) {
  const abs = join(base, dir);
  if (!existsSync(abs)) continue;
  for (const f of readdirSync(abs)) {
    if (!f.endsWith('.md')) continue;
    const id = f.replace('.md', '');
    const txt = readFileSync(join(abs, f), 'utf8');
    const m = txt.match(/^subject: (.*)$/m);
    subjects.set(id, m ? m[1].trim() : '');
    for (const row of txt.matchAll(/^ *from: (.*)$/gm)) {
      const path = row[1].trim();
      if (!restated.has(path)) restated.set(path, new Set());
      restated.get(path).add(id);
    }
  }
}

const rows = [];
for (const p of PARTIES) {
  const toolLog = findLog(p.dir, 'tool-log-');
  if (!toolLog) { rows.push({ ...p, missing: true }); continue; }
  const calls = readJsonl(toolLog);
  const startedAt = calls[0]?.ts ?? '0000';

  // What the base served this party and when — only meaningful where it had one.
  const servedAt = new Map();
  const confirmed = [];
  const kbLog = findLog(p.dir, 'kb-log-');
  if (kbLog) {
    for (const r of readJsonl(kbLog)) {
      for (const s of r.served ?? []) if (!servedAt.has(s.id)) servedAt.set(s.id, r.ts);
      if (r.verb === 'confirm' && r.wrote?.id) confirmed.push({ id: r.wrote.id, ts: r.ts });
    }
  }

  const found = [];
  const later = [];
  const add = (id, how) => {
    const born = bornAt.get(id) ?? '9999';
    if (found.some((f) => f.id === id)) return;
    if (born >= startedAt) { later.push({ id, born }); return; }
    found.push({ id, born, how, served: servedAt.get(id) ?? null });
  };
  if (p.report && restated.has(p.report)) {
    for (const id of restated.get(p.report)) add(id, 'a `from:` row cites this report');
  }
  for (const r of RESTATED.filter((r) => r.party === p.label)) add(r.id, `${r.where}: ${r.what}`);
  for (const c of confirmed) add(c.id, 'confirmed it in its own kb journal');

  rows.push({ ...p, calls: calls.length, startedAt, found, later });
}

console.log('');
console.log('party   had         calls  rediscovered  base served it first');
for (const r of rows) {
  if (r.missing) { console.log(`${r.label.padEnd(7)} ${String(r.had).padEnd(11)}  (no tool log under ${r.dir})`); continue; }
  const servedFirst = r.found.filter((f) => f.served).length;
  console.log(
    `${r.label.padEnd(7)} ${String(r.had).padEnd(11)} ${String(r.calls).padStart(5)}  ${String(r.found.length).padStart(12)}  ${String(r.had === 'the base' ? servedFirst : '—').padStart(19)}`,
  );
  if (why) for (const f of r.found) {
    console.log(`          ${f.id}  ${f.how.padEnd(19)} born ${f.born.slice(0, 16)}  ${subjects.get(f.id) ?? ''}`);
  }
}

const armless = rows.filter((r) => !r.missing && r.had !== 'the base');
const withBase = rows.filter((r) => !r.missing && r.had === 'the base');
const sum = (list) => list.reduce((a, r) => a + r.found.length, 0);
const distinctOf = (list) => new Set(list.flatMap((r) => r.found.map((f) => f.id)));

const armlessFacts = distinctOf(armless);
console.log('');
console.log(`REDISCOVERED BY PARTIES THAT NEVER HAD THE BASE: ${sum(armless)} event(s), ${armlessFacts.size} distinct fact(s).`);
for (const id of armlessFacts) {
  const by = armless.filter((r) => r.found.some((f) => f.id === id)).map((r) => r.label);
  console.log(`  ${id}  found again by ${by.length} (${by.join(', ')})  ${subjects.get(id) ?? ''}`);
}
console.log('  Each is a fact the corpus already held that somebody paid to find out again. This is the');
console.log('  demand signal, and the only number here no design decision of this project can flatter.');

console.log('');
console.log(`REDISCOVERED BY PARTIES THAT HAD THE BASE: ${sum(withBase)} event(s), ${distinctOf(withBase).size} distinct fact(s).`);
console.log('  The base held it and the party established it anyway. Where the base had SERVED the entry');
console.log('  first, that is the protocol working as written — it tells its reader to verify, and it is');
console.log('  why call counts cannot move. Where it had not, the entry was held and never offered.');
