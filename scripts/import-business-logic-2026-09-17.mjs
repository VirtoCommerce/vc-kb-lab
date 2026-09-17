#!/usr/bin/env node
/**
 * ONE-OFF. Move the 216 `BL-*` invariants out of `vc-fix/knowledge/oracles/business-logic.md` and
 * into the base's normative plane.
 *
 *   node scripts/import-business-logic-2026-09-17.mjs [--base <path>] [--source <md>]
 *                                                    [--write] [--limit N] [--report <path>]
 *
 * DRY RUN BY DEFAULT, like every other script in here. `--write` opts in.
 *
 * WHY IT GOES THROUGH `capture()` AND NOT THROUGH THE FILESYSTEM. Every refusal the door makes is a
 * rule somebody argued for at the point of code: a rule must lead with its id, two rules must not
 * share one, a transcribed row must not vote, an anchor must not be a path on this machine, a base
 * without `kb.json` is not a base. An importer that wrote 216 files directly would be 216 chances
 * to be wrong in a way nothing notices. The cost is that it is slower and that the door rebuilds
 * the index 216 times; both are paid once.
 *
 * WHAT THE PAGE CLAIMS AND WHAT THE BASE WILL SAY. `business-logic.md` carries lines like
 * "CONFIRMED 3/3" and "triangulated". None of that becomes a confirmation. Each rule lands with one
 * evidence row marked `attested: false`, naming the page it was read out of, and reads 0 parties
 * until somebody watches it hold and writes down what they saw. That is decision 11 -- nothing is
 * imported as confirmed -- enforced by the door rather than by this script.
 *
 * THREE THINGS THE PLAN EXPECTED AND THE DOCUMENT DID NOT SUPPORT. The handoff named three cases to
 * route to a human. Measured against the file, two of them are not routing decisions:
 *
 *   "a Verify step naming no coordinate"  -- 143 of the 216 name no coordinate ANYWHERE, in Rule,
 *      Verify or Violation signal, and only 49 name one this base can resolve. They are not badly
 *      written: "money rounds half-up to two decimals" is about the platform, not about a place in
 *      it. A rule is reached by its id and its domain. So this is counted and reported, not queued,
 *      and the door no longer asks a rule for an anchor.
 *   "a --source module the base does not record as installed"  -- `--source` is NOT used at all.
 *      Passing it would mark the row as code somebody read, and nobody in this import read any C#;
 *      the page did. The Source: line stays in the body verbatim, where a reader can follow it.
 *      Which modules the base does not record as installed is still worth knowing, so it is
 *      reported -- as information about coverage, not as a gate.
 *   "a coordinate collision with an existing entry"  -- on this plane identity is the rule id, so a
 *      fingerprint collision only ever means "already imported". The thing that was MEANT -- the 13
 *      contradictions the overlap annex found between these rules and observed behaviour -- does
 *      not collide with anything, because a rule and an observation are different planes. It is
 *      detected by coordinate overlap instead, reported per rule with the `kb dispute` line that
 *      settles it. Ten of the thirteen involve this page and are seeded by hand from the annex's
 *      own rows, because two of them name no coordinate and a regex cannot see either.
 *
 * WHAT IS ACTUALLY HELD BACK: an entry with no Rule or no Verify (nothing to state, or nothing that
 * could refute it), a rule id already in the base, and a minted `KB-` id already held by a different
 * subject. Everything else is imported, flagged where it needs a human, and the flags are the
 * report.
 *
 * WHERE `from:` POINTS. At a copy of the page inside the base -- `sources/business-logic-2026-09-17.md`
 * -- and not at `vc-mcp-testing-module`, because that file is being deleted. A transcription's whole
 * value is that a reader can open the artefact and disagree; a path into a directory that will not
 * exist is a claim about a page rather than a reference to one. The copy is byte-identical and its
 * origin is recorded beside it.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { capture, CaptureRefused, readRules, loadEntry } from '../src/capture.mjs';
import { coordinateIndex } from '../src/coordinates.mjs';
import { normalizeAnchor } from '../src/anchors.mjs';
import { ruleIdOf } from '../src/rules.mjs';
import { installedVersionOf, moduleRepos } from '../src/source-door.mjs';
import { parseEntry } from '../src/frontmatter.mjs';
import { DERIVED_ENTRIES, CAPTURED_DIR } from '../src/planes.mjs';

const LAB = join(dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const flag = (name, fallback = null) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback);
const base = flag('--base', 'C:/_VIRTO/vc-knowledge');
const src = flag('--source', 'C:/_VIRTO/vc-mcp-testing-module/plugins/vc-fix/knowledge/oracles/business-logic.md');
const write = argv.includes('--write');
const limit = Number(flag('--limit', '0')) || 0;
const reportPath = flag('--report', join(LAB, 'measurements', 'IMPORT-BUSINESS-LOGIC-2026-09-17.md'));

// The archived copy, dated. A later re-import writes a second file rather than moving this one, so
// every `from:` row already in the corpus keeps resolving to the page it was actually read from.
const ARCHIVE_REL = 'sources/business-logic-2026-09-17.md';

// The contradictions the overlap annex found BY READING, as pairs, copied from its own rows. Seeded
// by hand precisely because the extractor below is weak: BL-B2B-005 and BL-ORD-007 name no
// coordinate at all, so coordinate overlap cannot see either of them.
//
// Only the ones that involve THIS page. The annex lists thirteen contradictions across the whole of
// `vc-fix/knowledge`; six of them are against `e-commerce-edge-cases-library.md`,
// `vc-bug-catalog.md` or `domain/products.md`, and those belong to B3 rather than here.
//
// The annex's own reading of the B2B cluster, kept because it changes what the human should do:
// six of the seven B2B pairs are consistent with vc-fix describing the VCST-5028
// `OrganizationMembership` model while `vcptcore_stable` runs a Customer module that writes
// `contact.status` and the global lockout. That is a module-mix difference, not one side being
// wrong, and a dispute row is the wrong instrument for it -- a scope axis is.
const KNOWN_CONTRADICTIONS = new Map([
  ['BL-B2B-005', ['KB-02238DE5']],
  ['BL-AUTH-012', ['KB-06409954', 'KB-DA14E8B7']],
  ['BL-ORD-007', ['KB-4C5627CE']],
  ['BL-B2B-008', ['KB-B769C7B1', 'KB-4D082C89']],
  ['BL-B2B-009', ['KB-4D082C89']],
  ['BL-B2B-012', ['KB-4D082C89', 'KB-BAEBCDA7', 'KB-FA724D31', 'KB-DA14E8B7']],
  ['BL-B2B-013', ['KB-DA14E8B7']],
  ['BL-CART-003', ['KB-13B32D5F']],
  ['BL-CAT-006', ['KB-0C163966']],
  ['BL-CART-009', ['KB-35F20D97', 'KB-A54C919F']],
]);

const die = (msg, code = 4) => { console.error(msg); process.exit(code); };

// --- preflight ---------------------------------------------------------------------------------

if (!existsSync(join(base, 'kb.json'))) {
  die(`refusing: ${base} holds no kb.json, so it is not a knowledge base. Pass a drive-letter path.`);
}
if (!existsSync(src)) die(`refusing: ${src} does not exist`);

const raw = readFileSync(src);
const sha = createHash('sha256').update(raw).digest('hex');
const text = raw.toString('utf8');

/** The commit the page was read at. A page without one is still importable; it is just less exact. */
function originCommit(path) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%H %aI', '--', path], {
      cwd: dirname(path), encoding: 'utf8',
    }).trim();
    return out || null;
  } catch { return null; }
}
const origin = originCommit(src);

// --- parse -------------------------------------------------------------------------------------

const HEADING = /^### (BL-[A-Z0-9]+-[0-9A-Za-z]+):\s*(.*)$/;

const entries = [];
let cur = null;
let domain = null;
for (const line of text.split(/\r?\n/)) {
  const h = HEADING.exec(line);
  if (h) { cur = { id: h[1], heading: line.replace(/^###\s*/, ''), title: h[2], domain, lines: [] }; entries.push(cur); continue; }
  if (/^## /.test(line)) { cur = null; domain = line.replace(/^##\s*/, '').trim(); continue; }
  if (cur) cur.lines.push(line);
}

/**
 * The bullets of one entry, keyed by their bold label.
 *
 * Labels are NOT normalized into a fixed set. The file carries 26 one-off ones -- "Known behavior
 * (2026-03-13)", "Role whitelist is NOT a permission boundary (VCST-5239)", "Open flag - NOT
 * resolved by this decision" -- and each is a sentence somebody wrote deliberately. This map is used
 * only to decide routing and anchors; the BODY is the block verbatim, so nothing here can lose one.
 */
function fieldsOf(e) {
  const out = {};
  let key = null;
  for (const l of e.lines) {
    const m = /^-\s*\*\*([^*]+?):\*\*\s*(.*)$/.exec(l);
    if (m) { key = m[1]; out[key] = (out[key] ? `${out[key]}\n` : '') + m[2]; continue; }
    if (key && l.trim()) out[key] += `\n${l}`;
    if (!l.trim()) key = null;
  }
  return out;
}
// `^Rule\b` and not `=== 'Rule'`: BL-PROFILE-001 splits itself into "Rule (write path — ...)" and
// "Rule (read path — ...)", and treating that as an entry with no rule would hold back the one
// entry in the file whose author took the most care.
const pick = (fields, re) => Object.entries(fields).filter(([k]) => re.test(k)).map(([, v]) => v).join('\n');

// --- anchors -----------------------------------------------------------------------------------

const index = coordinateIndex(base);

/**
 * How the base itself spells a coordinate.
 *
 * The index is keyed on the normalized form, which is lowercased, so writing anchors from it would
 * put `carttype.discounts` in 49 entries while every other entry in the corpus says
 * `CartType.discounts`. This reads the raw spelling back off the entries that already use it.
 */
function rawSpellings(b) {
  const out = new Map();
  for (const dir of [DERIVED_ENTRIES, CAPTURED_DIR]) {
    const abs = join(b, dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs).filter((x) => x.endsWith('.md'))) {
      let data;
      try { ({ data } = parseEntry(readFileSync(join(abs, f), 'utf8'), `${dir}/${f}`)); } catch { continue; }
      for (const a of data.anchors ?? []) {
        const key = normalizeAnchor(a?.coordinate);
        if (key && !out.has(key)) out.set(key, String(a.coordinate));
      }
    }
  }
  return out;
}
const spelled = rawSpellings(base);

const ROUTE = /^(?:(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+)?\/[A-Za-z0-9/{}\-_.:]*$/;

/** Everything in the prose that could be a place. Deliberately over-generous; filtered below. */
function candidatesIn(block) {
  const out = new Set();
  for (const m of block.matchAll(/`([^`]+)`/g)) {
    const t = m[1].trim();
    if (ROUTE.test(t)) { out.add(t); continue; }
    for (const d of t.matchAll(/\b([A-Za-z][A-Za-z0-9]*(?:\[\])?(?:\.[A-Za-z][A-Za-z0-9]*(?:\[\])?)+)\b/g)) out.add(d[1]);
    // A BARE TYPE NAME IS NOT AN ANCHOR. `Product` and `MoneyType` resolve -- they are real nodes
    // in the projected schema -- and anchoring a rule on one makes it arrive on every tool call
    // that mentions a product. It costs one entry to leave them out, and it keeps the arrival
    // hook -- which already fires at 254-286 ms and on the reviewer's own commands -- from
    // gaining 216 new reasons to. An operation name is kept, marked, and only used if it
    // resolves as a mutation or a query.
    if (/^[a-z][A-Za-z0-9]{3,}$/.test(t)) out.add(`__op:${t}`);
  }
  for (const m of block.matchAll(/(?:^|[\s(])((?:GET|POST|PUT|PATCH|DELETE)\s+\/[A-Za-z0-9/{}\-_.]+)/g)) out.add(m[1].trim());
  for (const m of block.matchAll(/(?:^|[\s(])(\/api\/[A-Za-z0-9/{}\-_.]+)/g)) out.add(m[1].trim());
  return [...out];
}

/** The form of a candidate that the base knows, or null. */
function resolveCandidate(c) {
  const bare = c.replace(/\[\]/g, '');
  const parts = bare.split('.');
  if (c.startsWith('__op:')) {
    const op = c.slice(5);
    for (const form of [`Mutations.${op}`, `Query.${op}`]) {
      const key = normalizeAnchor(form);
      if (key && index.has(key)) return spelled.get(key) ?? form;
    }
    return null;
  }
  const forms = [bare];
  if (parts.length >= 2) {
    forms.push(parts.slice(-2).join('.'));
    forms.push(`${parts.at(-2)}Type.${parts.at(-1)}`);
  }
  for (const form of forms) {
    const key = normalizeAnchor(form);
    if (key && index.has(key)) return spelled.get(key) ?? form;
  }
  // THE DEPLOYMENT DECIDES WHICH VERB EXISTS. The page says
  // `GET /api/platform/security/roles/search`; the contract projects POST on that path and
  // nothing on GET. Keeping the page's spelling writes an anchor that reads like a real
  // coordinate and resolves to nothing, which the gate calls worse than no anchor -- it looks
  // reached. So a route that misses is retried on its path alone, and taken only when exactly
  // one verb answers; two would be a guess about which one the rule meant.
  const path = bare.replace(/^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+/, '');
  if (path.startsWith('/')) {
    const tail = normalizeAnchor(path);
    const verbed = [...index.keys()].filter((k) => k.endsWith(` ${tail}`));
    if (verbed.length === 1) return spelled.get(verbed[0]) ?? verbed[0];
  }
  return null;
}

/**
 * The anchors one entry earns.
 *
 * TWO KINDS GET IN AND ONE DOES NOT. A candidate the base already knows gets in, spelled the way the
 * base spells it. A route-shaped candidate gets in even when nothing projects it, because a route is
 * unambiguously a place and an unprojected one is the design -- `unreachableAnchors` reports it and
 * `arrivesAt` exists for exactly that case. A DOTTED candidate that resolves to nothing does NOT get
 * in: that is where the junk lives (`L1.listPrice` from a worked example, `header.vue`,
 * `OrganizationMembership.IsLocked` which is a C# property and not a coordinate), and an invented
 * anchor is worse than none -- it makes a rule arrive somewhere it has nothing to say about.
 */
function anchorsFor(block) {
  const keep = new Set();
  const dropped = [];
  for (const c of candidatesIn(block)) {
    const hit = resolveCandidate(c);
    if (hit) { keep.add(hit); continue; }
    if (c.startsWith('__op:') || !ROUTE.test(c)) { dropped.push(c.replace('__op:', '')); continue; }
    if (c.includes('...') || c === '/api' || c.length < 3) { dropped.push(c); continue; }
    keep.add(c);
  }
  // A bare "/locked" that is also the tail of "/api/platform/security/users/{userId}/locked" is a
  // fragment of a sentence, not a second route. Same for a verbless path already carried with a verb.
  // Compared on the NORMALIZED form and not on the string, because a candidate that resolved came
  // back spelled the way the BASE spells it -- `GET /api/platform/security/users/{id}` for a page
  // that wrote `{userId}` -- and a string comparison then sees two different routes and keeps both.
  const pathOf = (a) => normalizeAnchor(a).replace(/^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) /i, '');
  const verbed = new Set([...keep].filter((a) => /^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s/.test(a)).map(pathOf));
  for (const a of [...keep]) {
    const path = pathOf(a);
    if (!path.startsWith('/')) continue;
    // the same route written twice, once with its verb and once without
    if (!/^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s/.test(a) && verbed.has(path)) { keep.delete(a); continue; }
    // "/locked" lifted out of "/api/platform/security/users/{}/locked" is a fragment of a sentence
    if (path.split('/').length !== 2) continue;
    for (const other of keep) {
      const otherPath = pathOf(other);
      if (otherPath !== path && otherPath.endsWith(path)) { keep.delete(a); break; }
    }
  }
  return { anchors: [...keep], dropped };
}

// --- the plan ----------------------------------------------------------------------------------

const repoToModule = (() => {
  const map = moduleRepos();
  const out = new Map();
  for (const [id, row] of Object.entries(map)) {
    if (!row || !row.repo || out.has(row.repo)) continue;
    out.set(row.repo, id);
  }
  return out;
})();

const already = new Map(readRules(base).map((e) => [ruleIdOf(e.data.subject), e.data.id]));

const plan = [];
const shapeProblems = [];
const modulesSeen = new Map();

for (const e of entries) {
  const f = fieldsOf(e);
  const rule = pick(f, /^Rule\b/);
  const verify = pick(f, /^Verify\b/);
  const violation = pick(f, /^Violation signal\b/);
  const source = pick(f, /^Source\b/);

  const row = {
    ruleId: e.id,
    domain: e.domain,
    subject: `${e.id} ${e.title.replace(/`\[P[0-9]-[a-z]+\]`\s*$/, '').trim()}`,
    body: [e.heading, '', ...e.lines].join('\n').replace(/\s+$/, '') + '\n',
    severity: (e.heading.match(/\[(P[0-9]-[a-z]+)\]/) ?? [])[1] ?? null,
    flags: [],
    skip: null,
  };

  if (!rule.trim()) { row.skip = 'no Rule: bullet — nothing to state'; shapeProblems.push(row); }
  else if (!verify.trim()) { row.skip = 'no Verify: bullet — nothing names what would refute it'; shapeProblems.push(row); }

  const { anchors, dropped } = anchorsFor([rule, verify, violation].join('\n'));
  row.anchors = anchors;
  row.droppedCandidates = dropped;
  if (!anchors.length) row.flags.push('no-coordinate');
  if (!row.severity) row.flags.push('no-severity');

  // Which experiential entries already speak about the same coordinate. Not a collision -- a rule
  // and an observation are different planes with different identity -- but the one place a rule and
  // a sighting can disagree, which is what the migration exists to surface.
  const neighbours = new Map();
  for (const a of anchors) {
    for (const hit of index.get(normalizeAnchor(a)) ?? []) {
      if (hit.plane !== 'experiential') continue;
      neighbours.set(hit.id, hit.subject);
    }
  }
  // The annex's pairs come first and are never overwritten by extraction: a reader established
  // them, a regex did not. Where extraction ALSO finds the same entry it adds nothing new.
  const named = KNOWN_CONTRADICTIONS.get(e.id) ?? [];
  for (const id of named) if (!neighbours.has(id)) neighbours.set(id, '(named by the overlap annex)');
  row.neighbours = [...neighbours].map(([id, subject]) => ({ id, subject, named: named.includes(id) }));
  if (named.length) row.flags.push('known-contradiction');
  else if (row.neighbours.length) row.flags.push('neighbour-observation');

  // The modules the page cites, and whether this deployment runs them. Reported, never acted on:
  // a rule about a module nobody installed is still a rule, it is just one this base cannot check.
  for (const m of source.matchAll(/\b(vc-module-[a-z0-9-]+)\b/g)) {
    const moduleId = repoToModule.get(m[1]) ?? null;
    const installed = moduleId ? installedVersionOf(base, moduleId) : null;
    if (!modulesSeen.has(m[1])) modulesSeen.set(m[1], { moduleId, installed, rules: [] });
    modulesSeen.get(m[1]).rules.push(e.id);
    if (!installed) row.flags.push(`module-not-installed:${m[1]}`);
  }

  if (already.has(e.id)) row.skip = `already in the base as ${already.get(e.id)}`;

  plan.push(row);
}

const duplicates = plan.map((r) => r.ruleId).filter((v, i, a) => a.indexOf(v) !== i);
if (duplicates.length) die(`refusing: the page carries the same rule id twice: ${duplicates.join(', ')}`);
if (plan.length !== 216) {
  console.error(`note: the page parsed to ${plan.length} rules, not the 216 this import was written against.`);
  console.error('      The skeleton has changed. Read the diff before passing --write.');
  if (write) process.exit(4);
}

const importable = plan.filter((r) => !r.skip);
const held = plan.filter((r) => r.skip);
const work = limit ? importable.slice(0, limit) : importable;

// --- report ------------------------------------------------------------------------------------

const count = (pred) => plan.filter(pred).length;
const flagged = (name) => plan.filter((r) => r.flags.some((x) => x === name || x.startsWith(`${name}:`)));

const lines = [];
const say = (s = '') => { lines.push(s); console.log(s); };

say(`# Import — business-logic.md → the normative plane`);
say('');
say(`source      ${src}`);
say(`sha256      ${sha}`);
say(`origin      ${origin ?? '(not under git, or git not available)'}`);
say(`base        ${base}`);
say(`mode        ${write ? 'WRITE' : 'dry run (pass --write)'}${limit ? `, limited to the first ${limit}` : ''}`);
say('');
say(`parsed              ${plan.length} rules in ${new Set(plan.map((r) => r.domain)).size} domains`);
say(`importable          ${importable.length}`);
say(`held back           ${held.length}`);
say(`carry a coordinate  ${count((r) => r.anchors.length)}  (${plan.reduce((n, r) => n + r.anchors.length, 0)} anchors)`);
say(`no coordinate       ${flagged('no-coordinate').length}  — reached by id and domain, which is what a rule is for`);
say(`no severity tag     ${flagged('no-severity').length}`);
say(`known contradiction ${flagged('known-contradiction').length}  — the overlap annex found these by reading`);
say(`neighbour sighting  ${flagged('neighbour-observation').length}  — share a coordinate with an observed entry`);
say('');

if (held.length) {
  say('## Held back');
  say('');
  for (const r of held) say(`  ${r.ruleId.padEnd(16)} ${r.skip}`);
  say('');
}

say('## Contradictions the annex established');
say('');
say('A person read the rule and the entry side by side and found them to disagree. Both are');
say('recorded and neither is edited: the rule says what the platform is meant to do, the entry says');
say('what somebody watched it do. Settling one means deciding which, and saying so ON the rule --');
say('after --write, with the KB id printed below:');
say('');
say('    kb dispute <KB id> --deployment <env> --note "<what was seen instead>"');
say('');
say('Six of the B2B pairs are probably NOT one side being wrong. The annex reads them as vc-fix');
say('describing the VCST-5028 OrganizationMembership model while this stand runs a Customer module');
say('that writes contact.status and the global lockout. A scope axis settles those, not a dispute.');
say('');
for (const r of plan.filter((x) => x.flags.includes('known-contradiction'))) {
  say(`  ${r.ruleId.padEnd(16)} ${r.kbId ?? ''}`);
  for (const n of r.neighbours.filter((x) => x.named)) say(`      vs ${n.id}`);
}
say('');

say('## Rules that land beside an observation');
say('');
say('Not a disagreement -- a shared coordinate. These are the rules the arrival hook and');
say('`writtenNeighbours` will show next to an entry somebody wrote from a deployment, which is the');
say('whole reason an anchor is worth extracting. Listed so a reader can spot a pair the annex missed.');
say('');
for (const r of plan.filter((x) => x.flags.includes('neighbour-observation'))) {
  say(`  ${r.ruleId.padEnd(16)} ${r.anchors.join(', ')}`);
  for (const n of r.neighbours) say(`      ${n.id}  ${n.subject}`);
}
say('');

say('## Modules the page cites');
say('');
for (const [repo, m] of [...modulesSeen].sort()) {
  say(`  ${repo.padEnd(28)} ${m.moduleId ?? '(no module id in the repo map)'} ${m.installed ? `@ ${m.installed}` : '— NOT recorded as installed'}  (${m.rules.length} rule${m.rules.length === 1 ? '' : 's'})`);
}
say('');

say('## What each rule will become');
say('');
say('| rule | severity | anchors | flags |');
say('|---|---|---|---|');
for (const r of work) {
  say(`| ${r.ruleId} | ${r.severity ?? '—'} | ${r.anchors.join(', ') || '—'} | ${r.flags.join(', ') || '' } |`);
}
say('');

// --- write -------------------------------------------------------------------------------------

say('## What a reader will and will not reach');
say('');
say('`kb rules`, `kb rules <domain>` and `kb show BL-...` reach every one of them. The arrival hook');
say('and `writtenNeighbours` reach the 49 that carry a coordinate.');
say('');
say('`kb ask` does NOT. resolve.mjs loads the derived, captured and flow indexes and not the rules');
say('index, so a question a rule answers returns the observations around it and never the rule. That');
say('is arguably the design -- a rule is found by working in its domain, which is why the catalog has');
say('no question column -- but "does a coupon apply to the sale price" is a question BL-CART-003');
say('answers, and today it comes back without it. Deciding it belongs with the session hook and the');
say('skill (A4, A6), and the shape that does not repeat the dead-weight failure is: rules in the');
say('ranked list but in their own labelled block, after what somebody actually saw. 216 unattested');
say('entries mixed into 100 observed ones would drown the half of the corpus that was earned.');
say('');

if (!write) {
  say(`Nothing written. ${work.length} rule(s) would be captured. Pass --write.`);
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, lines.join('\n') + '\n');
  console.log(`\nreport: ${reportPath}`);
  process.exit(0);
}

// The page travels with the corpus. Copied before anything is captured, because `--from` is checked
// to exist and a run that wrote 216 rows pointing at a file it had not yet made would be exactly
// the unauditable transcription this whole mechanism exists to end.
mkdirSync(join(base, dirname(ARCHIVE_REL)), { recursive: true });
copyFileSync(src, join(base, ARCHIVE_REL));
writeFileSync(join(base, `${ARCHIVE_REL.replace(/\.md$/, '')}.provenance.json`), `${JSON.stringify({
  archived: ARCHIVE_REL,
  origin: { repository: 'vc-mcp-testing-module', path: src, commit: origin },
  sha256: sha,
  importedBy: 'scripts/import-business-logic-2026-09-17.mjs',
  rules: plan.length,
  note: 'A verbatim copy. The rules transcribed from it cite this path in their first evidence row, '
    + 'which is marked attested: false — the page asserts, nobody observed. The original is being '
    + 'deleted from the plugin, which is why the copy is here rather than a path into it.',
}, null, 2)}\n`);
say(`archived ${ARCHIVE_REL}`);

// The base says which planes it holds. It listed three.
const cfgPath = join(base, 'kb.json');
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
if (Array.isArray(cfg.planes) && !cfg.planes.includes('normative')) {
  cfg.planes = [...cfg.planes, 'normative'];
  writeFileSync(cfgPath, `${JSON.stringify(cfg, null, 2)}\n`);
  say('kb.json: added "normative" to planes');
}

let written = 0;
const refused = [];
for (const r of work) {
  try {
    const out = capture(base, {
      rule: true,
      subject: r.subject,
      claim: r.body,
      refutableBy: 'observation',
      anchors: r.anchors,
      from: ARCHIVE_REL,
    });
    written += 1;
    if (written % 25 === 0) say(`  … ${written}/${work.length}`);
    r.kbId = out.id;
  } catch (err) {
    if (!(err instanceof CaptureRefused)) throw err;
    refused.push({ ruleId: r.ruleId, message: err.message.split('\n')[0] });
  }
}

say('');
say(`captured ${written} rule(s); ${refused.length} refused at the door`);
for (const x of refused) say(`  ${x.ruleId.padEnd(16)} ${x.message}`);
say('');
say('The ids, for the citations that point at them:');
for (const r of work.filter((x) => x.kbId)) say(`  ${r.ruleId.padEnd(16)} ${r.kbId}  ${loadEntry(base, r.kbId) ? '' : '(MISSING)'}`);
say('');
say('Next: `node bin/kb.mjs validate --base ' + base + '` and read 20 of them.');

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, lines.join('\n') + '\n');
console.log(`\nreport: ${reportPath}`);
