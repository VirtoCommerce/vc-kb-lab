#!/usr/bin/env node
/**
 * ROUND FIVE'S GROUND, by the second rule: the namespace the register covers best.
 *
 *   node measurements/kb-run5-2026-09/pick-covered-namespace.mjs [--base <path>]
 *
 * WHY THERE IS A SECOND RULE. `pick-namespace.mjs` implements the corpus-blind condition — contract
 * and logs only — and picks `/api/platform`, which has SEVEN register entries and ZERO licensed.
 * Round five would then test the protocol on nothing, exactly as round four did. The assumption
 * that most-walked implies best-covered does not hold: infrastructure namespaces are traversed by
 * every run on the way to somewhere else and surprise nobody, so nothing surprising is written
 * about them, while the licensed entries sit where a few runs dug deep.
 *
 * Three conditions — a corpus-blind pick, ground the register covers, and questions its author did
 * not write — are satisfiable two at a time. Round five drops the first and says so on its face.
 *
 * WHY A RULE AND NOT A CHOICE. Picking `/api/order` by hand and explaining the reason is the same
 * act as re-picking until the number looks good; the explanation is not what makes it honest. A
 * rule anybody can re-run is the only form of "picked for coverage" that is not also "picked by
 * me". This file is committed before it decides anything, like the question template before it.
 *
 * WHAT IS STILL CONTAMINATED, NAMED RATHER THAN ENGINEERED AWAY. The ground is now chosen because
 * the register holds things there. So rediscovery by the control arm on this ground is commissioned
 * BY THE GROUND and is not a result. What is not commissioned: the five questions were frozen in
 * `QUESTION-TEMPLATE.md` before any namespace was known and were not derived from these entries,
 * and the sealed prediction can still fail. The headline of round five is the protocol — for each
 * licensed entry the treated arm meets, whether it acted on it, re-verified it, or contradicted it,
 * and whether it held — and that measure does not improve just because the ground is well covered.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { parseEntry } from '../../src/frontmatter.mjs';
import { confirmationsOf, isDisputed, attestedOf } from '../../src/capture.mjs';
import { normalizeAnchor } from '../../src/anchors.mjs';

const argv = process.argv.slice(2);
const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : (process.env.KB_BASE ?? 'C:/_VIRTO/vc-knowledge');

const ns = new Map();
const bump = (key, field, id) => {
  if (!ns.has(key)) ns.set(key, { entries: new Set(), licensed: new Set(), attested: new Set() });
  ns.get(key)[field].add(id);
};

for (const f of readdirSync(join(base, 'captured'))) {
  if (!f.endsWith('.md')) continue;
  const { data } = parseEntry(readFileSync(join(base, 'captured', f), 'utf8'), f);
  if (data.status !== 'active') continue;

  const licensed = confirmationsOf(data) >= 2 && !isDisputed(data);
  const seen = new Set();
  for (const a of data.anchors ?? []) {
    const m = normalizeAnchor(a.coordinate ?? a).match(/(\/api\/[a-z]+)/);
    if (!m || seen.has(m[1])) continue;
    seen.add(m[1]);
    bump(m[1], 'entries', data.id);
    if (licensed) {
      bump(m[1], 'licensed', data.id);
      if (attestedOf(data)) bump(m[1], 'attested', data.id);
    }
  }
}

const rows = [...ns.entries()]
  .map(([key, v]) => ({ ns: key, entries: v.entries.size, licensed: v.licensed.size, attested: v.attested.size, ids: [...v.licensed].sort() }))
  // Licensed first; ties broken by total entries, then by name so the rule is deterministic.
  .sort((a, b) => b.licensed - a.licensed || b.entries - a.entries || a.ns.localeCompare(b.ns));

console.log('REST namespaces by how many entries an agent may act on WITHOUT re-verifying');
console.log('');
console.log('licensed  attested  entries  namespace');
for (const r of rows) {
  console.log(`${String(r.licensed).padStart(8)}  ${String(r.attested).padStart(8)}  ${String(r.entries).padStart(7)}  ${r.ns}`);
}

const picked = rows[0];
console.log('');
if (!picked || picked.licensed === 0) {
  console.log('NO namespace has a licensed entry. Round five cannot test the protocol anywhere, and that');
  console.log('is a result about the corpus rather than a reason to pick something.');
  process.exit(1);
}

console.log(`PICKED: ${picked.ns} — ${picked.licensed} licensed entr(ies), ${picked.attested} of them attested.`);
console.log('');
console.log('The licence will be exercised on these, and each one is scored: acted on, re-verified, or');
console.log('contradicted — and whether it held.');
for (const id of picked.ids) console.log(`  ${id}`);
console.log('');
console.log(`${picked.licensed - picked.attested} of them carry no row saying what anybody saw. That is what the control arm is for:`);
console.log('where it establishes one of these independently, its report is an artefact and becomes a');
console.log('`from:` row — an attested confirmation by a party that never read the register.');
