#!/usr/bin/env node
/**
 * WHAT ARM C DID WITH ITS LICENCE, scored against a list sealed before it ran.
 *
 *   node measurements/kb-run5-2026-09/score-protocol.mjs \
 *     --arm-c <log dir> [--arm-a <log dir>] --catalog <the brief as handed>
 *
 * Read-only. Run AFTER both arms.
 *
 * THIS SCRIPT IS THE THIRD VERSION OF ROUND FOUR'S, AND THE HISTORY IS THE INSTRUCTION. That one
 * was wrong three times: it counted opens against the LIVE corpus (reporting a working mechanism as
 * dead), then required `captured/KB-xxxxxxxx.md` as a single token (so `cd .../captured && cat
 * A.md` hid two of three opens), then counted an id anywhere in the report (so the report's own
 * bookkeeping table made every confirm a citation). Two of those flattered the treatment. Every one
 * was a regex over shell text.
 *
 * So this script does two things differently.
 *
 *   1. It reports the protocol verdicts, which are the headline, and REFUSES to guess them. `acted`
 *      versus `re-verified` cannot be read off a log: both look like an id appearing in prose. The
 *      script prints, per licensed entry, every mechanical trace it has — cited, opened, confirmed,
 *      disputed, with timestamps — and requires a human to write the verdict into VERDICTS.json.
 *      An unfilled verdict is reported as `unscored`, never as `untouched`.
 *   2. Everything it counts mechanically, it counts the way round four's third version learned to:
 *      against the catalog AS HANDED, filenames matched wherever they sit in a command, and table
 *      rows separated from prose.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const at = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const HERE = fileURLToPath(new URL('.', import.meta.url));
const armC = at('--arm-c', null);
const armA = at('--arm-a', null);
const catalogFile = at('--catalog', join(HERE, 'BRIEF-arm-C-catalog.md'));

if (!armC || !existsSync(armC)) {
  console.error('score-protocol: --arm-c <dir> must name the treated arm\'s log directory');
  process.exit(2);
}
if (!existsSync(catalogFile)) {
  console.error(`score-protocol: --catalog ${catalogFile} is not there. Score against what the arm was HANDED.`);
  process.exit(2);
}

// The licensed entries this round is about, read out of the handed catalog rather than the live
// corpus: the corpus moves during a run, and round four scored one of the arm's own new entries.
const handed = new Map();
let section = '(before any section)';
for (const line of readFileSync(catalogFile, 'utf8').split(/\r?\n/)) {
  const h = line.match(/^## (.+?) —/);
  if (h) { section = h[1]; continue; }
  const row = line.match(/^\| \[`(KB-[0-9A-F]{8})`\]\([^)]*\) \| `([^`]*)` \| (\d+) \| (yes|no) \| (yes|no)/);
  if (!row) continue;
  handed.set(row[1], {
    id: row[1], subject: row[2], parties: Number(row[3]), attested: row[4] === 'yes',
    disputed: row[5] !== 'no', section, position: handed.size + 1,
  });
}
const licensed = [...handed.values()].filter((e) => e.parties >= 2 && !e.disputed);

const sealed = readFileSync(join(HERE, 'SEALED-RELEVANCE.md'), 'utf8');
const predictedUsed = new Set([...sealed.matchAll(/^\| `(KB-[0-9A-F]{8})` \|[^|]*\| \*\*used\*\*/gm)].map((m) => m[1]));
// THE GROUND'S licensed entries — the 7 the sealed page predicts over. Everything else that is
// licensed is still reported if the arm touched it: an entry acted on from another namespace is
// the protocol working just as much, and scoring only the predicted set would hide it.
const onGround = new Set([...sealed.matchAll(/^\| `(KB-[0-9A-F]{8})` \|/gm)].map((m) => m[1]));

// --- mechanical traces ----------------------------------------------------------------------------

function tracesOf(dir) {
  const seen = new Map();
  const add = (id, how, ts) => {
    if (!handed.has(id)) return;
    if (!seen.has(id)) seen.set(id, []);
    seen.get(id).push({ how, ts });
  };
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.jsonl')) {
      for (const line of readFileSync(join(dir, f), 'utf8').split(/\r?\n/)) {
        if (!line.trim()) continue;
        let r; try { r = JSON.parse(line); } catch { continue; }
        if ((r.verb === 'confirm' || r.verb === 'dispute') && r.exit === 0 && r.wrote?.id) add(r.wrote.id, r.verb, r.ts);
        if (r.verb === 'show') for (const s of r.served ?? []) add(s.id, 'opened', r.ts);
        const target = String(r.target ?? '');
        for (const m of target.matchAll(/KB-[0-9A-F]{8}(?=\.md)/g)) add(m[0], 'opened', r.ts);
      }
    }
    if (/REPORT\.md$/i.test(f)) {
      for (const line of readFileSync(join(dir, f), 'utf8').split(/\r?\n/)) {
        const how = /^\s*\|/.test(line) ? 'listed' : 'cited';
        for (const m of line.matchAll(/KB-[0-9A-F]{8}/g)) add(m[0], how, null);
      }
    }
  }
  return seen;
}

const c = tracesOf(armC);
const a = armA && existsSync(armA) ? tracesOf(armA) : null;

// --- the verdicts, which a person writes ----------------------------------------------------------

const verdictFile = join(HERE, 'VERDICTS.json');
const verdicts = existsSync(verdictFile) ? JSON.parse(readFileSync(verdictFile, 'utf8')) : {};
const LEGAL = new Set(['acted', 're-verified', 'contradicted', 'untouched']);

console.log(`licensed entries in the handed register: ${licensed.length}   (of ${handed.size} rows handed)`);
console.log(`sealed prediction: ${predictedUsed.size} used`);
console.log('');
console.log(`of those, on this round's ground: ${licensed.filter((e) => onGround.has(e.id)).length}`);
console.log('');
console.log('entry         ground  att  predicted  verdict        mechanical traces');
let acted = 0; let unscored = 0; let harmed = 0;
// Ground first, then anything else the arm actually touched. A licensed entry from another
// namespace that was never touched is noise on this page.
const rows = licensed.filter((e) => onGround.has(e.id) || c.has(e.id));
for (const e of rows.sort((x, y) => Number(onGround.has(y.id)) - Number(onGround.has(x.id)))) {
  const t = c.get(e.id) ?? [];
  const v = verdicts[e.id];
  const verdict = v && LEGAL.has(v.verdict) ? v.verdict : (onGround.has(e.id) || t.length ? 'unscored' : 'untouched');
  if (verdict === 'unscored') unscored += 1;
  if (verdict === 'acted') acted += 1;
  if (v?.held === false && verdict === 'acted') harmed += 1;
  const how = t.length ? [...new Set(t.map((x) => x.how))].join(' + ') : '—';
  console.log(`${e.id}  ${onGround.has(e.id) ? ' yes  ' : '  no  '}  ${e.attested ? 'yes' : ' no'}  ${predictedUsed.has(e.id) ? 'used     ' : 'not used '}  ${verdict.padEnd(13)}  ${how}`);
}

console.log('');
if (unscored) {
  console.log(`${unscored} entr(ies) UNSCORED. Write VERDICTS.json before quoting any number from this page:`);
  console.log('  { "KB-XXXXXXXX": { "verdict": "acted|re-verified|contradicted|untouched", "held": true|false,');
  console.log('                     "evidence": "the sentence in REPORT.md that settles it" } }');
  console.log('`acted` and `re-verified` are indistinguishable in a log — both are an id in prose — so this');
  console.log('script will not guess between them. Round four published a number a regex had guessed.');
} else {
  console.log(`acted on without re-verifying: ${acted} of ${rows.length} licensed entr(ies) in play`);
  if (!acted) {
    console.log('');
    console.log('ZERO. That is the failure stated in advance in SEALED-RELEVANCE.md: the licence to act on a');
    console.log('confirmed entry is not taken even when handed one on covered ground. Write it down that way.');
  }
  if (harmed) {
    console.log('');
    console.log(`${harmed} entr(ies) were ACTED ON AND DID NOT HOLD. That is the licence doing harm and it`);
    console.log('outranks every other number here.');
  }
}

if (a) {
  console.log('');
  console.log('--- arm A, the control. Commissioned by the ground; useful as tier two, not as evidence ---');
  const both = licensed.filter((e) => a.has(e.id));
  console.log(`licensed entries arm A's report names: ${both.length}`);
  for (const e of both) console.log(`  ${e.id}  ${e.subject}`);
  console.log('');
  console.log('For each, read arm A\'s report: if it ESTABLISHED the fact independently, that report is an');
  console.log('artefact — `kb confirm <id> --deployment <name> --note "<what arm A saw>" --from <report>`.');
  console.log('An id it merely mentions is not a confirmation.');
}
