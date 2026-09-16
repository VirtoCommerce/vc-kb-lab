#!/usr/bin/env node
/**
 * WHAT THE ARM OPENED, WHERE IT SAT IN THE CATALOG, AND WHETHER I PREDICTED IT.
 *
 *   node measurements/kb-run4-2026-09/score-opens.mjs --log <dir with the run's logs> [--base <path>]
 *
 * Read-only. Run AFTER the arm, against `SEALED-RELEVANCE.md`, which was written before it.
 *
 * Three things it answers, none of which needs a judgement after the fact:
 *
 *   1. WAS THE CATALOG READ AT ALL? Opens, and the stopping rule stated in the sealed page: zero
 *      opens means the frame is wrong and this project should say so.
 *   2. WHERE DID ATTENTION FALL? The catalog POSITION and SECTION of every open. Sections were built
 *      on the claim that a list stays readable when the part you must read is short; if every open
 *      comes from the first section or the first few rows, the claim is measured rather than argued,
 *      and the row budget in `src/catalog-budget.mjs` — labelled a guess where it is defined — can
 *      be replaced by a number.
 *   3. WAS THE PREDICTION RIGHT? relevant-opened, irrelevant-opened, relevant-missed against the
 *      sealed list. The list is allowed to be wrong; that is why it was sealed rather than written
 *      afterwards.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const at = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const base = at('--base', process.env.KB_BASE ?? 'C:/_VIRTO/vc-knowledge');
const logDir = at('--log', null);
const HERE = fileURLToPath(new URL('.', import.meta.url));

if (!logDir || !existsSync(logDir)) {
  console.error('score-opens: --log <dir> must name the directory holding the run\'s tool-log-*.jsonl and kb-log-*.jsonl');
  process.exit(2);
}

// --- the catalog, in the order the arm was handed it ---------------------------------------------
const catalog = readFileSync(join(base, 'captured-catalog.md'), 'utf8').split(/\r?\n/);
const order = [];
let section = '(before any section)';
for (const line of catalog) {
  const h = line.match(/^## (.+?) —/);
  if (h) { section = h[1]; continue; }
  const row = line.match(/^\| \[`(KB-[0-9A-F]{8})`\]/);
  if (row) order.push({ id: row[1], section, position: order.length + 1 });
}
const where = new Map(order.map((r) => [r.id, r]));

// --- what the sealed page predicted --------------------------------------------------------------
const sealed = readFileSync(join(HERE, 'SEALED-RELEVANCE.md'), 'utf8');
const predicted = new Set([...sealed.matchAll(/^\| `(KB-[0-9A-F]{8})`/gm)].map((m) => m[1]));

// --- what the arm actually opened ----------------------------------------------------------------
// Two sources, both written by the tool: `kb show` in the kb journal, and any tool call whose target
// names an entry id or its file. An arm that `cat`s a path has still opened the entry.
const opens = [];
const seen = new Set();
const note = (id, how, ts) => {
  if (!/^KB-[0-9A-F]{8}$/.test(id) || seen.has(id)) return;
  seen.add(id);
  opens.push({ id, how, ts });
};
for (const f of readdirSync(logDir)) {
  if (!f.endsWith('.jsonl')) continue;
  for (const line of readFileSync(join(logDir, f), 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (r.verb === 'show') for (const s of r.served ?? []) note(s.id, 'kb show', r.ts);
    const target = String(r.target ?? '');
    if (/captured[\\/]KB-[0-9A-F]{8}\.md/.test(target) || /\bshow\s+KB-[0-9A-F]{8}/i.test(target)) {
      for (const m of target.matchAll(/KB-[0-9A-F]{8}/g)) note(m[0], 'read the file', r.ts);
    }
  }
}

// --- report --------------------------------------------------------------------------------------
console.log(`catalog handed over: ${order.length} rows in ${new Set(order.map((r) => r.section)).size} sections`);
console.log(`sealed prediction  : ${predicted.size} entries expected relevant`);
console.log('');

if (!opens.length) {
  console.log('OPENS: none.');
  console.log('');
  console.log('This is the failure stated in advance in SEALED-RELEVANCE.md: the catalog was in the');
  console.log('prompt for the whole session and the arm opened nothing. Under the stopping rule the');
  console.log('conclusion is that a corpus of this shape does not beat an agent with a browser and a');
  console.log('source MCP, and it should be written down that way rather than explained away.');
  process.exit(0);
}

console.log('opened  position  section                      predicted?  how');
for (const o of opens.sort((a, b) => String(a.ts).localeCompare(String(b.ts)))) {
  const w = where.get(o.id);
  console.log(
    `${o.id}  ${String(w?.position ?? '—').padStart(8)}  ${String(w?.section ?? 'not in the catalog').padEnd(27)}  `
    + `${predicted.has(o.id) ? 'yes       ' : 'no        '}  ${o.how}`,
  );
}

const opened = new Set(opens.map((o) => o.id));
const relevantOpened = [...opened].filter((id) => predicted.has(id));
const irrelevantOpened = [...opened].filter((id) => !predicted.has(id));
const relevantMissed = [...predicted].filter((id) => !opened.has(id));
const positions = opens.map((o) => where.get(o.id)?.position).filter(Boolean);

console.log('');
console.log(`relevant-opened   ${relevantOpened.length}`);
console.log(`irrelevant-opened ${irrelevantOpened.length}`);
console.log(`relevant-missed   ${relevantMissed.length}   ${relevantMissed.join(', ')}`);
console.log('');
if (positions.length) {
  const deepest = Math.max(...positions);
  const median = positions.slice().sort((a, b) => a - b)[Math.floor(positions.length / 2)];
  console.log(`deepest row opened: ${deepest} of ${order.length}   median opened row: ${median}`);
  console.log(`sections reached  : ${[...new Set(opens.map((o) => where.get(o.id)?.section).filter(Boolean))].join(', ')}`);
  console.log('');
  console.log('If opens cluster in the first rows and the first section, the attention limit is measured');
  console.log('and the row budget in src/catalog-budget.mjs stops being a guess. If they are spread, the');
  console.log('list is being read whole and the budget can rise.');
}
