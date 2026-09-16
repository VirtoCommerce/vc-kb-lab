#!/usr/bin/env node
/**
 * Replay every archived tool log through the arrival matcher, and ask the question that matters:
 * would the base have ARRIVED before the agent went to fetch the same kind of answer elsewhere?
 *
 *   node measurements/kb-arrival-2026-09/replay-logs.mjs [--base <path>] [--detail]
 *
 * Twenty-two logs: the twelve exploratory runs in MEASUREMENT-archive/ and the ten arms of the
 * three controlled comparisons in C:/_VIRTO/_comparison-logs/. Round one's aborted arm-B attempt
 * (25 calls) and round three's quarantined contamination log are deliberately not in the list.
 *
 * THE FIRST VERSION OF THIS SCRIPT COUNTED "FIRES", AND THAT IS THE WRONG METRIC. A fire is a
 * coordinate the base knew something about; it says nothing about whether the agent needed it. The
 * column that can say something is the ORDER OF TWO EVENTS in one run:
 *
 *   arrival-call   the first call at which an entry that ALREADY EXISTED before the run began
 *                  would have been handed over, unasked, because the call touched its coordinate
 *   source-call    the first call at which the arm went to platform source for an answer:
 *                  `raw.githubusercontent.com` in a Bash target, or a tool on the source MCP
 *                  (its server id contains `da5c9759`). These are the two channels every arm of
 *                  rounds two and three used; the twelve runs and round one used neither.
 *
 * `delta` = source-call - arrival-call. Positive means the base would have arrived first.
 *
 * THREE HONESTY RULES, kept from the first version or added here:
 *
 *   1. An entry counts only if it existed BEFORE the run started, read off its first evidence
 *      row's `at:` -- otherwise every run is helped by answers it wrote itself. Derived entries
 *      count as pre-existing: the plane is projected from the deployment's own contract and the
 *      coordinates it is anchored on were there. (The plane was restructured on 2026-09-12 from 287
 *      to 590 entries; the coordinates did not change, the entry boundaries did. Stated, not hidden.)
 *   2. A call TO the base is not an arrival AT a coordinate. `kb capture --anchors /company/members`
 *      names the coordinate in order to write about it; counting that as the base arriving would
 *      count the agent's own hand. Every call whose target invokes `bin/kb.mjs` is excluded from
 *      arrivals and counted in its own column.
 *   3. Arrival is by COORDINATE and the source fetch is by TOPIC, and this script does not judge
 *      whether the two are about the same thing. `--detail` prints every source call with the
 *      pre-existing arrivals that preceded it, so a reader can judge -- and should, before quoting
 *      the summary line.
 *
 * THE JUDGEMENT IS DATA, NOT CODE. `SOURCE_SUBJECTS` below says, for every source call in every
 * arm, what the arm went to source FOR, and which pre-existing entry -- if any -- answers that
 * subject. It was written by a person reading the source calls next to the arrivals (`--detail`).
 * It is in the script so the summary number is reproducible and so anyone can dispute a row by
 * editing it. "6 of 6 arrived first" was the first number this script printed, and it was true and
 * meaningless: the arrivals were route tables and a promotion flow, and the fetches were for C#.
 *
 * KNOWN LIMIT OF THE LOGS THEMSELVES: `target` is truncated to 200 characters (669 of the 4,038
 * calls end in an ellipsis). A coordinate past the cut is invisible to the matcher, so arrivals are,
 * if anything, under-counted. A source URL past the cut is invisible too.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildArrivalIndex, arrivalsFor, textOf } from '../../src/arrive.mjs';
import { CAPTURED_DIR, FLOWS_DIR } from '../../src/planes.mjs';

const HERE = fileURLToPath(new URL('../..', import.meta.url));
const args = process.argv.slice(2);
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : (process.env.KB_BASE ?? 'C:/_VIRTO/vc-knowledge');
const detail = args.includes('--detail');
const CMP = 'C:/_VIRTO/_comparison-logs';

const archive = (dir) => join(HERE, 'MEASUREMENT-archive', dir);
const RUNS = [
  ['run 01', archive('run-01-promotions'), null, 'promotions, REST by curl'],
  ['run 02', archive('run-02-order-discount'), null, 'discount to checkout, browser'],
  ['run 03', archive('run-03-org-roles'), null, 'organization roles, browser UI'],
  ['run 04', archive('run-04-member-state'), null, 'member state'],
  ['run 05', archive('run-05-invitation'), null, 'invitation'],
  ['run 06', archive('run-06-shared-lists'), null, 'shared lists'],
  ['run 07', archive('run-07-order-fields'), null, 'order fields'],
  ['run 08', archive('run-08-shipment'), null, 'shipment'],
  ['run 09', archive('run-09-promotion-edit'), null, 'promotion edit'],
  ['run 10', archive('run-10-coupons'), null, 'coupons'],
  ['run 11', archive('run-11-configurable'), null, 'configurable products'],
  ['run 12', archive('run-12-cart-staleness'), null, 'cart staleness'],
  ['r1 A', `${CMP}/arm-A`, null, 'round 1, nothing'],
  ['r1 B', `${CMP}/arm-B`, 'tool-log-38fdb567.jsonl', 'round 1, QA repo (completed attempt)'],
  ['r1 B2', `${CMP}/arm-B2`, null, 'round 1, QA repo rerun'],
  ['r1 C', `${CMP}/arm-C`, null, 'round 1, the base'],
  ['r2 A', `${CMP}/round2/arm-A`, null, 'round 2, nothing'],
  ['r2 B', `${CMP}/round2/arm-B`, null, 'round 2, QA repo'],
  ['r2 C', `${CMP}/round2/arm-C`, null, 'round 2, the base'],
  ['r3 A', `${CMP}/round3/arm-A`, null, 'round 3, nothing'],
  ['r3 B', `${CMP}/round3/arm-B`, null, 'round 3, QA repo'],
  ['r3 C', `${CMP}/round3/arm-C`, null, 'round 3, the base'],
];

// WHEN EACH WRITTEN ENTRY CAME INTO EXISTENCE. This decides which entries may count as help that
// was already there when a run was recorded, so it is the honesty rule of the whole replay.
//
// NEITHER AVAILABLE SOURCE IS AUTHORITATIVE ALONE, and picking one silently is how this went
// wrong the first time.
//
//   The frontmatter `at:` is TYPED. Fifteen rows were typed by the author while reading an arm
//   report and dated to the minute that arm ran, so entries written on the 16th claimed the 15th.
//   One of them was the entire reported gain of a measurement. (Relabelled 2026-09-16; a
//   transcription now carries `from:` and its `at:` is when it was typed.)
//
//   Git says when a file appeared, which a writer cannot type -- but this corpus was created on
//   2026-09-14 and 77 entries went in on day one, having been written during runs that ran days
//   earlier. For those, the git date is far too LATE and would throw away genuine pre-existence.
//
// So: an entry added after the repository's first day is dated by git, because from that point on
// a new entry was committed near when it was written. An entry from the day-one import is dated by
// its EARLIEST evidence row -- earliest, not the first one in the file, which is what this used to
// read and which the review found wrong by construction.
const bornAt = new Map();
const gitBirths = new Map();
let repoDay = null;
try {
  const first = execFileSync('git', ['log', '--reverse', '--format=%aI', '--max-parents=0'], { cwd: base, encoding: 'utf8' }).trim().split(/[^0-9TZ:+.-]+/)[0];
  repoDay = first ? first.slice(0, 10) : null;
  const log = execFileSync('git', ['log', '--diff-filter=A', '--name-only', '--format=%aI', '--reverse'], { cwd: base, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  let when = null;
  for (const line of log.split(new RegExp(String.fromCharCode(91, 13, 10, 93) + String.fromCharCode(43)))) {
    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T/.test(line)) { when = line.trim(); continue; }
    const m = line.match(/(?:^|[/])(KB-[0-9A-F]{8})[.]md$/);
    if (m && when && !gitBirths.has(m[1])) gitBirths.set(m[1], when);
  }
} catch { /* not a git checkout: every entry falls back to its earliest evidence row */ }

let fromGit = 0;
for (const dir of [CAPTURED_DIR, FLOWS_DIR]) {
  const abs = join(base, dir);
  if (!existsSync(abs)) continue;
  for (const f of readdirSync(abs)) {
    if (!f.endsWith('.md')) continue;
    const id = f.replace('.md', '');
    const git = gitBirths.get(id);
    if (git && repoDay && git.slice(0, 10) > repoDay) { bornAt.set(id, git); fromGit += 1; continue; }
    const rows = [...readFileSync(join(abs, f), 'utf8').matchAll(/^ *at: (.*)$/gm)].map((x) => x[1].trim()).sort();
    bornAt.set(id, rows[0] ?? '9999');
  }
}
console.log(`birth dates for ${bornAt.size} written entries: ${fromGit} dated by git (added after ${repoDay}), ${bornAt.size - fromGit} by earliest evidence row (the day-one import)`);

const KB_CALL = /bin[\\/]kb\.mjs|\bkb\.mjs\b/;
const isKbCall = (call) => KB_CALL.test(String(call.target ?? ''));
const isSourceCall = (call) =>
  (call.tool === 'Bash' && /raw\.githubusercontent\.com/.test(String(call.target ?? ''))) ||
  /da5c9759/.test(String(call.tool ?? ''));

// What each arm went to source for, read off its source calls; and the pre-existing entry that
// answers that subject, if the base held one. `calls` names the source calls on that subject; an
// entry without `calls` covers every source call in the arm.
const ARITHMETIC = 'discount and total arithmetic in C# (CustomerOrderService, DiscountEntity, RewardExtensions, CartAggregate, BestReward, PaymentInType)';
const ACTIVE_COLUMN = 'what the Active column on /company/members reads (Members.vue, contact status field)';
const SIGN_IN = 'sign-in validation mechanism (PendingApproval, Locked, RequireConfirmedEmail, SignInManager)';
const SOURCE_SUBJECTS = [
  { arm: 'r2 A', subject: ARITHMETIC, answeredBy: null },
  { arm: 'r2 B', subject: ARITHMETIC, answeredBy: null },
  { arm: 'r2 C', subject: ARITHMETIC, answeredBy: null },
  { arm: 'r3 A', subject: ACTIVE_COLUMN, calls: [13, 14, 62, 94], answeredBy: 'KB-27B4CD10' },
  { arm: 'r3 A', subject: SIGN_IN, calls: [53, 61, 84], answeredBy: null },
  { arm: 'r3 B', subject: ACTIVE_COLUMN, calls: [15, 19, 20], answeredBy: 'KB-27B4CD10' },
  { arm: 'r3 B', subject: SIGN_IN, calls: [62], answeredBy: null },
  { arm: 'r3 C', subject: ACTIVE_COLUMN, calls: [56, 57], answeredBy: 'KB-27B4CD10',
    note: 'this arm had already asked the base at call 2 and been served KB-27B4CD10; the arrival would have duplicated its own question' },
  { arm: 'r3 C', subject: SIGN_IN, calls: [55, 70, 75, 76], answeredBy: null },
];

const index = buildArrivalIndex(base);
const rows = [];

for (const [label, dir, fixedFile, what] of RUNS) {
  const file = fixedFile ?? (existsSync(dir) ? readdirSync(dir).find((f) => /^tool-log-.*\.jsonl$/.test(f)) : null);
  if (!file || !existsSync(join(dir, file))) {
    rows.push({ label, what, missing: dir });
    continue;
  }
  const calls = readFileSync(join(dir, file), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const startedAt = calls[0]?.ts ?? '0000';

  const row = {
    label, what, calls: calls.length, kbCalls: 0,
    arrivals: 0, preArrivals: 0, firstArrival: null,
    sourceCalls: [], firstSource: null,
    events: [],
  };
  for (let i = 0; i < calls.length; i += 1) {
    const call = calls[i];
    const n = i + 1;
    if (isSourceCall(call)) {
      row.sourceCalls.push({ n, tool: call.tool, target: String(call.target ?? '') });
      if (row.firstSource === null) row.firstSource = n;
    }
    if (isKbCall(call)) { row.kbCalls += 1; continue; }
    const hits = arrivalsFor(textOf(call.target ?? ''), index);
    if (!hits.length) continue;
    row.arrivals += 1;
    const pre = hits.filter((h) => h.plane === 'derived-first' || (bornAt.get(h.id) ?? '9999') < startedAt);
    if (!pre.length) continue;
    row.preArrivals += 1;
    if (row.firstArrival === null) row.firstArrival = n;
    row.events.push({ n, ids: pre.map((h) => `${h.id}${h.plane === 'derived-first' ? '' : '*'}`), coordinate: pre[0].coordinate });
  }
  rows.push(row);
}

// --- the table ------------------------------------------------------------------------------------
console.log(`base ${base} -- ${index.size} coordinates; written entries with a birth date: ${bornAt.size}\n`);
console.log('run     calls  kb-calls  arrivals(pre)  arrival-call  source-calls  source-call       delta   work');
let withSource = 0;
let arrivalFirst = 0;
for (const r of rows) {
  if (r.missing) { console.log(`${r.label.padEnd(7)} (no tool log at ${r.missing})`); continue; }
  const delta = r.firstSource !== null && r.firstArrival !== null ? r.firstSource - r.firstArrival : null;
  if (r.firstSource !== null) {
    withSource += 1;
    if (delta !== null && delta > 0) arrivalFirst += 1;
  }
  const deltaText = r.firstSource === null ? 'no source' : r.firstArrival === null ? 'no arrival' : (delta > 0 ? `+${delta}` : String(delta));
  console.log(
    `${r.label.padEnd(7)} ${String(r.calls).padStart(5)}  ${String(r.kbCalls).padStart(8)}  ` +
    `${String(`${r.arrivals}(${r.preArrivals})`).padStart(13)}  ${String(r.firstArrival ?? '-').padStart(12)}  ` +
    `${String(r.sourceCalls.length).padStart(12)}  ${String(r.firstSource ?? '-').padStart(11)}  ${deltaText.padStart(10)}   ${r.what}`,
  );
}

console.log('');
console.log(`arms that went to source at all: ${withSource} of ${rows.filter((r) => !r.missing).length}`);
console.log(`of those, SOME pre-existing entry would have arrived before the first source call: ${arrivalFirst} of ${withSource} -- a fact about time, not about subject; read on`);

// --- the judged number ----------------------------------------------------------------------------
const byLabel = new Map(rows.filter((r) => !r.missing).map((r) => [r.label, r]));
const judged = SOURCE_SUBJECTS.map((j) => {
  const r = byLabel.get(j.arm);
  const calls = j.calls ?? r.sourceCalls.map((s) => s.n);
  const firstFetch = Math.min(...calls);
  const before = r.events.filter((e) => e.n < firstFetch);
  const sameSubject = j.answeredBy ? before.find((e) => e.ids.some((id) => id.replace('*', '') === j.answeredBy)) : null;
  return { ...j, firstFetch, before: before.length, sameSubject: sameSubject ? sameSubject.n : null };
});
const same = judged.filter((j) => j.sameSubject !== null);
const timeOnly = judged.filter((j) => j.sameSubject === null && j.before > 0);
console.log('');
console.log('source subjects, judged (see SOURCE_SUBJECTS in this script):');
for (const j of judged) {
  const verdict = j.sameSubject !== null
    ? `SAME SUBJECT arrived at call ${j.sameSubject}, ${j.firstFetch - j.sameSubject} calls before the fetch (${j.answeredBy})`
    : j.before > 0 ? `${j.before} arrival${j.before === 1 ? '' : 's'} before the fetch, none on this subject` : 'nothing arrived before the fetch';
  console.log(`  ${j.arm.padEnd(5)} fetch at call ${String(j.firstFetch).padStart(3)}  ${verdict}`);
  console.log(`        for: ${j.subject}${j.note ? `
        note: ${j.note}` : ''}`);
}
console.log('');
console.log(`same-subject entry would have arrived before the first fetch for it: ${same.length} of ${judged.length} source subjects, in ${new Set(same.map((j) => j.arm)).size} of ${withSource} arms`);
console.log(`first in time but about something else: ${timeOnly.length} of ${judged.length}`);
console.log(`distinct entries doing the same-subject work: ${new Set(same.map((j) => j.answeredBy)).size} (${[...new Set(same.map((j) => j.answeredBy))].join(', ')})`);
console.log(`of the same-subject cases, arms that had NOT already asked the base for it: ${same.filter((j) => !j.note).length} of ${same.length}`);

console.log('');
console.log('`arrivals(pre)`: calls on which the matcher fires, and in brackets the ones on an entry that existed');
console.log('before the run began. `arrival-call` and `source-call` are 1-based call indexes. `delta` = source - arrival;');
console.log('positive means the base would have been in front of the agent first. `kb-calls` are excluded from');
console.log('arrivals: naming a coordinate in `kb capture` is not touching it.');
console.log('Whether the entry that arrived answers what the source call went for is judged in SOURCE_SUBJECTS,');
console.log('by a person, and printed above. Run with --detail to see every source call beside every arrival and');
console.log('dispute a row.');

if (detail) {
  for (const r of rows) {
    if (r.missing || (!r.sourceCalls.length && !r.events.length)) continue;
    console.log(`\n=== ${r.label} -- ${r.what} (${r.calls} calls)`);
    if (r.events.length) {
      console.log('  pre-existing arrivals (* = written entry, otherwise derived):');
      for (const e of r.events) console.log(`    call ${String(e.n).padStart(4)}  ${e.coordinate}  ->  ${e.ids.join(', ')}`);
    } else {
      console.log('  pre-existing arrivals: none');
    }
    if (r.sourceCalls.length) {
      console.log('  source calls:');
      for (const s of r.sourceCalls) {
        const before = r.events.filter((e) => e.n < s.n).length;
        const tool = s.tool.replace(/^mcp__[^_]+__/, 'source-mcp:');
        console.log(`    call ${String(s.n).padStart(4)}  [${before} arrival${before === 1 ? '' : 's'} before]  ${tool}  ${s.target.slice(0, 110)}`);
      }
    }
  }
}
