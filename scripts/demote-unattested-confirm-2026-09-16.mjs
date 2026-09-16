#!/usr/bin/env node
/**
 * ONE-OFF. Mark the round-four confirm on KB-7E35E6BC as unattested.
 *
 *   node scripts/demote-unattested-confirm-2026-09-16.mjs [--base <path>] [--write]
 *
 * WHAT IS WRONG. At 12:29:23 on 2026-09-16 round four's arm confirmed KB-7E35E6BC -- "Admin renders
 * order timestamps in local time while the API returns UTC" -- in a batch of three confirms one
 * second apart, at the end of a session whose task was pricing. Its report, archived at
 * `_comparison-logs/round4/arm-C-catalog/REPORT.md`, never mentions a timestamp. The row is a
 * sighting nobody described, and it took the entry to two parties, which is `confirmed`: the
 * round-five register would hand the next agent a licence to act on it without re-verifying.
 *
 * Found by the second review, which also asked for the same check over every confirm ever written.
 * That sweep is NOT done here, and the numbers are the reason:
 *
 *   47  confirm rows in the corpus (an observation row that is not an entry's first)
 *   40  of them carry no `from`
 *   37  of those carry no `by` either -- they predate `sessionParty`, and there is no artefact and
 *       no author to check them against
 *    3  are round four's, the only ones with both a session id and an archived report
 *   23  entries are currently licensed: two or more parties, not disputed
 *    7  would remain if every anonymous confirm row were demoted
 *
 * `confirm` has never required a note, so NO row in this corpus is attested by its own record. That
 * is a defect in the verb, and the fix is `--note`, landing with the round-five brief. It is not a
 * finding about the 37 rows. Demoting them would take a gap in the tool and write it into the
 * corpus as a verdict on evidence nobody can read -- and would leave round five with seven licensed
 * entries to test a protocol whose whole subject is what an agent may do with a licensed entry.
 *
 * WHAT THIS DOES. Adds `attested: false` and a `whyNot` to exactly one row. The row is kept: it
 * records that a session touched the entry, and a later reader can disagree with this judgement by
 * opening the report named in `whyNot`. `partiesOf` skips it, so the entry reads 1 again until
 * somebody who has actually seen a timestamp confirms it.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { parseEntry, stringifyFrontmatter } from '../src/frontmatter.mjs';
import { partiesOf } from '../src/provenance.mjs';

const argv = process.argv.slice(2);
const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : 'C:/_VIRTO/vc-knowledge';
const write = argv.includes('--write');

const TARGET = {
  id: 'KB-7E35E6BC',
  by: 'session:8ec21246',
  at: '2026-09-16T12:29:23.274Z',
  report: 'C:/_VIRTO/_comparison-logs/round4/arm-C-catalog/REPORT.md',
  whyNot:
    'confirmed at the end of a pricing task; the run report names no timestamp anywhere. ' +
    'See C:/_VIRTO/_comparison-logs/round4/arm-C-catalog/REPORT.md',
};

// The judgement rests on a file. If it is not here, this script has no standing to make it.
if (!existsSync(TARGET.report)) {
  console.error(`refused: ${TARGET.report} is not there.`);
  console.error('  This migration demotes a row because a named report does not describe the thing');
  console.error('  confirmed. Without the report, that is an assertion rather than a check.');
  process.exit(2);
}
const report = readFileSync(TARGET.report, 'utf8');
if (/timestamp|utc|local time/i.test(report)) {
  console.error('refused: the report DOES mention a timestamp. Re-read it before demoting the row.');
  process.exit(2);
}

const file = join(base, 'captured', `${TARGET.id}.md`);
const parsed = parseEntry(readFileSync(file, 'utf8'));
const rows = parsed.data.evidence ?? [];
const row = rows.find((r) => r.by === TARGET.by && r.at === TARGET.at);

if (!row) {
  console.error(`refused: no row on ${TARGET.id} with by=${TARGET.by} at=${TARGET.at}.`);
  console.error('  Already migrated, or the row moved. Nothing guessed.');
  process.exit(2);
}
if (row.attested === false) {
  console.log(`${TARGET.id}: already marked unattested. Nothing to do.`);
  process.exit(0);
}

const before = partiesOf(rows.filter((r) => !r.contradicts && r.method !== 'source'));
row.attested = false;
row.whyNot = TARGET.whyNot;
const after = partiesOf(rows.filter((r) => !r.contradicts && r.method !== 'source'));

console.log(`${TARGET.id}  "${parsed.data.subject}"`);
console.log(`  row   : by=${TARGET.by} at=${TARGET.at}`);
console.log(`  reason: ${TARGET.whyNot}`);
console.log(`  parties: ${before} -> ${after}`);
console.log('');

if (!write) {
  console.log('DRY RUN. Nothing written. Re-run with --write to apply, then `kb reindex` and `kb validate`.');
  process.exit(0);
}

writeFileSync(file, stringifyFrontmatter(parsed.data, parsed.body));
console.log(`written: ${file}`);
console.log('Now run `node bin/kb.mjs reindex` and `node bin/kb.mjs validate`.');
