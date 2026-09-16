#!/usr/bin/env node
/**
 * ONE-OFF. Relabel the fifteen evidence rows that named an arm as their author.
 *
 *   node scripts/relabel-transcriptions-2026-09-16.mjs [--base <path>] [--write]
 *
 * WHAT WAS WRONG. Fifteen rows across eleven entries carried `by: round2-arm-B` and the like, with
 * timestamps rounded to the minute the arm had run (`2026-09-15T09:30:00.000Z`). No arm ever ran a
 * writing verb in any round. Every one of those rows was typed on 2026-09-16 by the author of this
 * tool, reading the arm's report, and dated to when the arm ran rather than when the row was
 * written. The second independent review found it and called it the thing to change first.
 *
 * WHAT IT COST. Three entries stood at `confirmed` on one party's transcription of three reports --
 * the self-confirmation the independence rule had been written days earlier to stop. The arrival
 * replay counts an entry as pre-existing if its first `at:` predates the run, so a row dated into
 * the run it was transcribed from read as help that was already there; that is where the brief's
 * "two calls gained" came from, and both of the two were one backdated entry.
 *
 * WHAT THIS DOES. It does NOT delete the rows. Three arms really did rediscover KB-27B4CD10 and
 * KB-5ADBFB34 independently, and that is the least contaminated demand signal this project has. It
 * moves the claim from an unfalsifiable author string to an auditable one:
 *
 *   by:   the session that actually typed it
 *   from: the report it was read out of -- a path that exists, that a reader can open and dispute
 *   at:   when it was typed, taken from the commit that introduced the row
 *
 * `partiesOf` then counts `from` ahead of `by`, so one author transcribing three reports is three
 * parties (they are three observations, badly recorded) and one author writing three rows unaided
 * is one (which is what it is).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { parseEntry, stringifyFrontmatter } from '../src/frontmatter.mjs';

const argv = process.argv.slice(2);
const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : 'C:/_VIRTO/vc-knowledge';
const write = argv.includes('--write');
const LOGS = 'C:/_VIRTO/_comparison-logs';

// Every arm named by a row, mapped to the report it was read out of. Checked to exist below: a
// transcription whose artefact cannot be opened is exactly the claim this migration exists to end.
const REPORTS = {
  'round1-arm-B': `${LOGS}/arm-B/report.md`,
  'round1-arm-C': `${LOGS}/arm-C/report.md`,
  'round2-arm-A': `${LOGS}/round2/arm-A/report.md`,
  'round2-arm-B': `${LOGS}/round2/arm-B/report.md`,
  'round2-arm-C': `${LOGS}/round2/arm-C/report.md`,
  'round3-arm-B': `${LOGS}/round3/arm-B/report.md`,
  'round3-arm-C': `${LOGS}/round3/arm-C/report.md`,
};

// The session that typed them. Recorded as a constant rather than read from the environment: this
// migration may be re-run from any session, and the fact being recorded is who wrote the rows in
// the first place, which does not change.
const TRANSCRIBER = 'session:09e39416';

const missing = Object.entries(REPORTS).filter(([, p]) => !existsSync(p));
if (missing.length) {
  console.error(`refusing: ${missing.length} report(s) named by a row do not exist:`);
  for (const [arm, p] of missing) console.error(`  ${arm} -> ${p}`);
  process.exit(4);
}

/** When the row was really written: the commit that introduced it, not the timestamp it carries. */
function writtenAt(file, marker) {
  try {
    const out = execFileSync('git', ['log', '--diff-filter=AM', '--format=%aI', '-S', marker, '-1', '--', file], {
      cwd: base, encoding: 'utf8',
    }).trim();
    return out || null;
  } catch { return null; }
}

const dir = join(base, 'captured');
let rows = 0;
const touched = [];

for (const f of readdirSync(dir)) {
  if (!f.endsWith('.md')) continue;
  const abs = join(dir, f);
  const { data, body } = parseEntry(readFileSync(abs, 'utf8'), `captured/${f}`);
  let changed = false;

  for (const row of data.evidence ?? []) {
    const report = REPORTS[row.by];
    if (!report) continue;
    const real = writtenAt(`captured/${f}`, `by: ${row.by}`);
    const was = { by: row.by, at: row.at };
    row.by = TRANSCRIBER;
    row.from = report;
    if (real) row.at = real;
    rows += 1;
    changed = true;
    touched.push({ id: data.id, was, now: { by: row.by, from: row.from, at: row.at } });
  }

  if (changed && write) writeFileSync(abs, stringifyFrontmatter(data) + String.fromCharCode(10) + body);
}

for (const t of touched) {
  console.log(`${t.id}  ${t.was.by} @ ${t.was.at}`);
  console.log(`            -> ${t.now.by}  from ${t.now.from.replace(LOGS, '…')}  @ ${t.now.at}`);
}
console.log(`\n${rows} row(s) ${write ? 'relabelled' : 'would be relabelled (pass --write)'}`);
