#!/usr/bin/env node
/**
 * WHAT THE ARM DID WITH THE REGISTER, scored against a list sealed before it ran.
 *
 *   node measurements/kb-run4-2026-09/score-opens.mjs --log <the run's log dir> [--catalog <the brief it was handed>]
 *
 * Read-only. Run AFTER the arm, against `SEALED-RELEVANCE.md`, which was written before it.
 *
 * THIS SCRIPT MEASURED THE WRONG THING ON ITS FIRST RUN, and the correction is the finding.
 *
 * It counted OPENS — `kb show`, or reading an entry's file — because that is what a catalog of ids
 * seemed to be for. Against round four's log that returned two opens, one of them an entry the arm
 * had written itself minutes earlier, and zero of the eight predicted. Read that way the run looks
 * like a failure.
 *
 * The report says otherwise. The arm used five of the eight, cited them by id as the reasoning for
 * its answers — "this reproduces @kb(KB-F1542157)", "@kb(KB-AD1FA66B) describes the read path as
 * recomputing every figure the storefront shows" — and confirmed three of them against what it saw.
 * It did that WITHOUT opening them, because the one-line claim in the catalog was enough. Which is
 * the mechanism being tested: a register you can see is not a store you have to visit.
 *
 * So engagement is counted three ways, weakest last:
 *
 *   CITED     the report names the id as part of an answer. The strongest: the entry changed what
 *             was written.
 *   CONFIRMED or disputed, in the run's own kb journal, written by the tool.
 *   OPENED    `kb show`, or the entry's file read.
 *
 * Two rules keep it honest. The catalog scored against is the one the arm was HANDED, not the corpus
 * as it stands now — the arm wrote five entries during the run and scoring against the live corpus
 * counted one of its own back to it. And an id absent from that handed catalog cannot count at all.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const at = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const logDir = at('--log', null);
const HERE = fileURLToPath(new URL('.', import.meta.url));
const catalogFile = at('--catalog', join(HERE, 'BRIEF-arm-C-catalog.md'));

if (!logDir || !existsSync(logDir)) {
  console.error("score-opens: --log <dir> must name the directory holding the run's tool-log-*.jsonl and kb-log-*.jsonl");
  process.exit(2);
}
if (!existsSync(catalogFile)) {
  console.error(`score-opens: --catalog ${catalogFile} is not there. Score against what the arm was HANDED, not the corpus as it stands.`);
  process.exit(2);
}

// --- the catalog as handed, in the order it was handed --------------------------------------------
const order = [];
let section = '(before any section)';
for (const line of readFileSync(catalogFile, 'utf8').split(/\r?\n/)) {
  const h = line.match(/^## (.+?) —/);
  if (h) { section = h[1]; continue; }
  const row = line.match(/^\| \[`(KB-[0-9A-F]{8})`\]/);
  if (row) order.push({ id: row[1], section, position: order.length + 1 });
}
const where = new Map(order.map((r) => [r.id, r]));

const sealed = readFileSync(join(HERE, 'SEALED-RELEVANCE.md'), 'utf8');
const predicted = new Set([...sealed.matchAll(/^\| `(KB-[0-9A-F]{8})`/gm)].map((m) => m[1]));

// --- what the arm did -----------------------------------------------------------------------------
const engaged = new Map();
let truncated = 0;
const note = (id, how) => {
  if (!where.has(id)) return;               // written during the run, or not in the register at all
  if (!engaged.has(id)) engaged.set(id, new Set());
  engaged.get(id).add(how);
};

for (const f of readdirSync(logDir)) {
  if (f.endsWith('.jsonl')) {
    for (const line of readFileSync(join(logDir, f), 'utf8').split(/\r?\n/)) {
      if (!line.trim()) continue;
      let r; try { r = JSON.parse(line); } catch { continue; }
      if ((r.verb === 'confirm' || r.verb === 'dispute') && r.exit === 0 && r.wrote?.id) note(r.wrote.id, 'confirmed');
      if (r.verb === 'show') for (const s of r.served ?? []) note(s.id, 'opened');
      // AN OPEN IS A FILENAME, WHEREVER IT SITS IN THE COMMAND. The first rule required
      // `captured/KB-xxxxxxxx.md` as a single token. Round four's call 307 was
      // `cd .../captured && cat KB-AD1FA66B.md; echo …; cat KB-35A09C64.md` — the directory and the
      // filenames separated by `&& cat` — so two of the three opens were invisible and the run was
      // published as "1 open, 7 used without opening". Match the filename itself.
      const target = String(r.target ?? '');
      for (const m of target.matchAll(/KB-[0-9A-F]{8}(?=\.md)/g)) note(m[0], 'opened');
      if (target.length >= 200) truncated += 1;
    }
  }
  if (/REPORT\.md$/i.test(f)) {
    // A CITATION IS PROSE, NOT BOOKKEEPING. The first rule counted an id anywhere in the report, and
    // the report ends with a "Register work" table naming every confirm — so every confirmed entry
    // was a citation by construction. `KB-7E35E6BC` appeared in that table and nowhere else and was
    // counted as reasoning. Table rows are listed separately and do not count as use.
    for (const line of readFileSync(join(logDir, f), 'utf8').split(/\r?\n/)) {
      const how = /^\s*\|/.test(line) ? 'listed' : 'cited';
      for (const m of line.matchAll(/KB-[0-9A-F]{8}/g)) note(m[0], how);
    }
  }
}

// --- report ---------------------------------------------------------------------------------------
console.log(`catalog as handed : ${order.length} rows in ${new Set(order.map((r) => r.section)).size} sections`);
console.log(`sealed prediction : ${predicted.size} entries expected relevant`);
console.log('');

if (!engaged.size) {
  console.log('The arm touched no register entry, in any of the three ways.');
  console.log('That is the failure stated in advance in SEALED-RELEVANCE.md, and it should be written down');
  console.log('as one rather than explained away.');
  process.exit(0);
}

console.log('entry         pos  section                  predicted?  how');
const rows = [...engaged].sort((a, b) => (where.get(a[0]).position - where.get(b[0]).position));
for (const [id, hows] of rows) {
  const w = where.get(id);
  console.log(`${id}  ${String(w.position).padStart(3)}  ${w.section.padEnd(23)}  ${predicted.has(id) ? 'yes       ' : 'no        '}  ${[...hows].join(' + ')}`);
}

const used = new Set(engaged.keys());
const relevantUsed = [...used].filter((id) => predicted.has(id));
const unpredictedUsed = [...used].filter((id) => !predicted.has(id));
const missed = [...predicted].filter((id) => !used.has(id));
const positions = rows.map(([id]) => where.get(id).position);
const cited = [...engaged].filter(([, h]) => h.has('cited')).length;
const listedOnly = [...engaged].filter(([, h]) => h.has('listed') && !h.has('cited')).length;
const openedCount = [...engaged].filter(([, h]) => h.has('opened')).length;

console.log('');
console.log(`register entries touched: ${used.size} of ${order.length}`);
console.log(`  cited in the body     : ${cited}`);
console.log(`  named only in a table : ${listedOnly}   (bookkeeping, not reasoning)`);
console.log(`  confirmed or disputed : ${[...engaged].filter(([, h]) => h.has('confirmed')).length}`);
console.log(`  opened as a file      : ${openedCount}${truncated ? `   (a floor: ${truncated} of the log's targets are cut at 200 chars)` : ''}`);
console.log('');
console.log(`predicted and used    : ${relevantUsed.length} of ${predicted.size}   ${relevantUsed.join(', ')}`);
console.log(`used but not predicted: ${unpredictedUsed.length}   ${unpredictedUsed.join(', ')}`);
console.log(`predicted and missed  : ${missed.length}   ${missed.join(', ')}`);
console.log('');
console.log(`deepest row reached   : ${Math.max(...positions)} of ${order.length}`);
console.log(`sections reached      : ${[...new Set(rows.map(([id]) => where.get(id).section))].join(', ')}`);
console.log('');
console.log(`Cited in the body without being opened: ${cited - [...engaged].filter(([, h]) => h.has('cited') && h.has('opened')).length}.`);
console.log('That is the largest number this script is entitled to print about the treatment, and it is');
console.log('still not the result. Whether a citation CHANGED anything is a judgement about prose, and no');
console.log('rule here can make it: an entry cited "only as context, which I did not re-verify" scores');
console.log('exactly like one an observation was built against. Read the report for the substantive');
console.log('count, and say which of these numbers it is. A confirm with no --note is a sighting nobody');
console.log('described; the tool cannot presently record one, so confirms are unattested by construction.');
