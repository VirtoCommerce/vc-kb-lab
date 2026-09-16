#!/usr/bin/env node
/**
 * The cross-plane check, measured: what it catches, what it misses, what it cries wolf about.
 *
 *   node measurements/kb-contradiction-2026-09/probe.mjs [--base <path>]
 *
 * Read-only. It runs `src/contradiction.mjs` -- the SAME implementation `kb validate` runs, not a
 * copy. Two implementations kept in step by a test is the arrangement nothing in this corpus would
 * detect failing, which is already the rule for the search index and applies here for the same
 * reason: a probe that disagreed with the gate would report a number nobody could act on.
 *
 * Two populations, because one of them cannot measure recall:
 *
 *   LIVE       every active written entry in the corpus. This says how NOISY the check is -- a
 *              check that flags a tenth of the corpus gets switched off, and then the next false
 *              claim rides for another twelve runs.
 *   PLANTED    five sentences written here, three of which the contract refutes and two of which
 *              it says nothing about. This says whether the check WORKS, which the live corpus
 *              cannot: it holds one known contradiction, so a check that found it and nothing else
 *              would be indistinguishable from one hard-coded to that sentence.
 *
 * The planted set is small and it is mine. It is in this file rather than in the gate's tests so
 * that the measurement and the regression suite do not become the same thing.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { parseEntry } from '../../src/frontmatter.mjs';
import { publishedOperations, contradictions } from '../../src/contradiction.mjs';
import { CAPTURED_DIR, FLOWS_DIR } from '../../src/planes.mjs';

const argv = process.argv.slice(2);
const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : (process.env.KB_BASE ?? 'C:/_VIRTO/vc-knowledge');

const PLANTED = [
  { refuted: true, s: 'A promotion cannot be deleted once it has been used on an order.' },
  { refuted: true, s: 'There is no way to delete a store through the API once products reference it.' },
  { refuted: true, s: 'A customer order cannot be updated after it reaches Completed.' },
  { refuted: false, s: 'A shopper cannot rename their own organization from the storefront.' },
  { refuted: false, s: 'The Active column cannot be sorted in the Admin members grid.' },
];

const ops = publishedOperations(base);
const written = [];
for (const dir of [CAPTURED_DIR, FLOWS_DIR]) {
  const abs = join(base, dir);
  if (!existsSync(abs)) continue;
  for (const f of readdirSync(abs)) {
    if (!f.endsWith('.md')) continue;
    const { data, body } = parseEntry(readFileSync(join(abs, f), 'utf8'), `${dir}/${f}`);
    if (data.status === 'active') written.push({ data, body, rel: `${dir}/${f}` });
  }
}

console.log(`base ${base}`);
console.log(`${written.length} active written entries, ${ops.length} published operations\n`);

console.log('LIVE');
let flagged = 0;
for (const { data, body, rel } of written) {
  const seen = new Set();
  for (const c of contradictions(body ?? '', ops)) {
    if (seen.has(c.coordinate)) continue;
    seen.add(c.coordinate);
    if (seen.size === 1) flagged += 1;
    console.log(`  ${data.id}  ${rel}`);
    console.log(`    says     : ${c.sentence.slice(0, 120)}`);
    console.log(`    contract : ${c.coordinate}${c.operationId ? ` (${c.operationId})` : ''}  @kb(${c.via})`);
  }
}
console.log(`  entries flagged: ${flagged} of ${written.length}`);

console.log('\nPLANTED');
let caught = 0;
let criedWolf = 0;
for (const p of PLANTED) {
  const found = contradictions(p.s, ops);
  const ok = p.refuted ? found.length > 0 : found.length === 0;
  if (p.refuted && found.length) caught += 1;
  if (!p.refuted && found.length) criedWolf += 1;
  console.log(`  ${ok ? 'ok  ' : 'MISS'}  ${p.refuted ? 'refuted by contract' : 'contract says nothing'}  ${found[0] ? found[0].coordinate.padEnd(34) : ''.padEnd(34)} ${p.s.slice(0, 66)}`);
}
console.log(`  refuted claims caught: ${caught} of ${PLANTED.filter((p) => p.refuted).length}`);
console.log(`  legitimate claims flagged: ${criedWolf} of ${PLANTED.filter((p) => !p.refuted).length}`);

console.log('');
console.log('This check looks for ONE shape: a claim that something cannot be done, where the contract');
console.log('publishes an operation that does it. It will miss most disagreements between the planes. It');
console.log('catches the one that has actually cost this project something, and it is a NOTICE rather');
console.log('than a failure -- a published operation is not proof it works, and may be permission-gated.');
