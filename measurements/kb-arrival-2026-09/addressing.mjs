#!/usr/bin/env node
/**
 * TWO QUESTIONS ABOUT ARRIVAL, neither of which had a committed script until the second review
 * pointed out that "33.7%" and "292 to 37" existed only in a letter and a code comment.
 *
 *   node measurements/kb-arrival-2026-09/addressing.mjs [--base <copy with its .git>] [--why]
 *
 * Read-only. Uses neither `ask` nor `how`, so it writes no demand row. Touches no deployment.
 *
 * 1. IS A TOPIC AN ADDRESS? A coordinate has to match exactly, which is why nine delivery addresses
 *    had to be applied by hand and bought nothing measurable. A topic would apply to all of them at
 *    once — and can also fire on everything, so the thing to measure is precision, not reach.
 *
 * 2. WHAT DO THE THREE PROPOSED FILTERS LEAVE? Written entries only, no VERB MISMATCH, once per
 *    coordinate per run.
 *
 *    The middle one is not the filter the review proposed and it is the one the data supports.
 *    "Half the events fire on a DELETE cleanup call" turns out not to be about cleanup at all:
 *    across every archived log only 22 targets mention `delete`. What actually happens is a
 *    matching defect — `forms()` in `arrive.mjs` returns a coordinate BOTH with and without its
 *    verb, so a plain read of `/api/members` matches the coordinate `DELETE /api/members` and the
 *    agent is handed the delete route table for a call that read. Filtering on the call being a
 *    delete would have removed almost nothing; filtering on the VERB disagreeing removes the class.
 *
 * Both replay the same 22 archived logs as `replay-logs.mjs` and share its birth rule, so an entry
 * counts only where it existed before the run being replayed.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CAPTURED_DIR, FLOWS_DIR } from '../../src/planes.mjs';
import { birthDates, describeBirths, BirthDatesRefused } from '../lib/birth.mjs';
import { arrivalIndex } from '../../src/coordinates.mjs';
import { arrivalsFor } from '../../src/arrive.mjs';
import { topicsOf } from '../../src/topics.mjs';

const argv = process.argv.slice(2);
const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : (process.env.KB_BASE ?? 'C:/_VIRTO/vc-knowledge');
const why = argv.includes('--why');

const LAB = fileURLToPath(new URL('../..', import.meta.url));
const CMP = 'C:/_VIRTO/_comparison-logs';

let births;
try {
  births = birthDates(base, { allowTypedDates: argv.includes('--trust-typed-dates') });
} catch (e) {
  if (e instanceof BirthDatesRefused) { console.error(e.message); process.exit(4); }
  throw e;
}
const { bornAt } = births;
console.log(describeBirths(births));

// Every written entry with its topics, for the topic arm of the experiment.
const written = [];
for (const dir of [CAPTURED_DIR, FLOWS_DIR]) {
  const abs = join(base, dir);
  if (!existsSync(abs)) continue;
  for (const f of readdirSync(abs)) {
    if (!f.endsWith('.md')) continue;
    const t = readFileSync(join(abs, f), 'utf8');
    if (/^status: retired$/m.test(t)) continue;
    const id = f.replace('.md', '');
    const subject = (t.match(/^subject: (.*)$/m) ?? ['', ''])[1];
    const question = (t.match(/^question: (.*)$/m) ?? ['', ''])[1];
    const coords = [...t.matchAll(/^ {2}- coordinate: (.*)$/gm)].map((m) => m[1].trim());
    written.push({ id, subject, topics: topicsOf(`${subject} ${question} ${coords.join(' ')}`) });
  }
}

const RUNS = [];
for (const d of readdirSync(join(LAB, 'MEASUREMENT-archive'))) {
  if (/^run-\d+/.test(d)) RUNS.push([d.slice(0, 6), join(LAB, 'MEASUREMENT-archive', d)]);
}
for (const [label, dir] of [
  ['r1 A', `${CMP}/arm-A`], ['r1 B', `${CMP}/arm-B`], ['r1 B2', `${CMP}/arm-B2`], ['r1 C', `${CMP}/arm-C`],
  ['r2 A', `${CMP}/round2/arm-A`], ['r2 B', `${CMP}/round2/arm-B`], ['r2 C', `${CMP}/round2/arm-C`],
  ['r3 A', `${CMP}/round3/arm-A`], ['r3 B', `${CMP}/round3/arm-B`], ['r3 C', `${CMP}/round3/arm-C`],
]) RUNS.push([label, dir]);

const index = arrivalIndex(base);
const KB_CALL = /bin[\\/]kb\.mjs|\bkb\.mjs\b/;

let calls = 0;
let coordEvents = 0; let topicEvents = 0;
const coordSeen = new Set(); const topicSeen = new Set();

// The three filters, counted cumulatively so each one's own cost is visible.
let all = 0; let writtenOnly = 0; let notDelete = 0; let oncePer = 0;
const detail = [];

for (const [label, dir] of RUNS) {
  if (!existsSync(dir)) continue;
  const f = readdirSync(dir).find((x) => x.startsWith('tool-log-') && x.endsWith('.jsonl'));
  if (!f) continue;
  const rows = readFileSync(join(dir, f), 'utf8').split(/\r?\n/).filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
  const startedAt = rows[0]?.ts ?? '0000';
  const alive = (id, plane) => plane === 'derived-first' || (bornAt.get(id) ?? '9999') < startedAt;
  const seenHere = new Set();

  for (const r of rows) {
    const target = String(r.target ?? '');
    if (!target || KB_CALL.test(target)) continue;
    calls += 1;

    const hits = arrivalsFor(target, index).filter((h) => alive(h.id, h.plane));
    if (hits.length) {
      coordEvents += 1;
      for (const h of hits) coordSeen.add(h.id);

      all += 1;
      const w = hits.filter((h) => h.plane !== 'derived-first');
      if (w.length) {
        writtenOnly += 1;
        // The VERB has to agree. `forms()` matches a coordinate with and without its method, so a
        // read of /api/members matches `DELETE /api/members` and the agent is handed the delete
        // route table for a call that read nothing.
        const agree = w.filter((h) => {
          const verb = (String(h.coordinate).match(/^([a-z]+) \//i) ?? [])[1];
          if (!verb) return true;
          return new RegExp(`(^|[^a-z])${verb}([^a-z]|$)`, 'i').test(target);
        });
        if (agree.length) {
          notDelete += 1;
          const key = `${label}|${agree[0].coordinate}`;
          if (!seenHere.has(key)) {
            seenHere.add(key);
            oncePer += 1;
            if (why) detail.push(`  ${label.padEnd(6)} ${agree[0].coordinate.slice(0, 44).padEnd(44)} ${agree[0].id}`);
          }
        }
      }
    }

    // TOPIC ARM. The target's own topic, and every written entry in it.
    const ts = topicsOf(target);
    if (!ts.length) continue;
    const topicHits = written.filter((e) => alive(e.id, 'experiential') && e.topics.some((t) => ts.includes(t)));
    if (topicHits.length) {
      topicEvents += 1;
      for (const e of topicHits.slice(0, 3)) topicSeen.add(e.id);
    }
  }
}

const pct = (n) => `${(n / calls * 100).toFixed(1)}%`;

console.log('');
console.log(`calls replayed, kb calls excluded: ${calls}`);
console.log('');
console.log('1. IS A TOPIC AN ADDRESS?');
console.log(`   by exact COORDINATE: fires on ${coordEvents} calls (${pct(coordEvents)}), ${coordSeen.size} distinct entries ever offered`);
console.log(`   by TOPIC           : fires on ${topicEvents} calls (${pct(topicEvents)}), ${topicSeen.size} distinct entries in the top 3`);
console.log('   A mechanism that fires on one call in three is wallpaper, and a reader turns it off in a');
console.log('   minute. The reach is real and the precision is not: topics organise a list somebody CHOOSES');
console.log('   from; a coordinate decides what is pushed at somebody who did not ask.');
console.log('');
console.log('2. WHAT THE THREE FILTERS LEAVE');
console.log(`   every arrival event                         ${all}`);
console.log(`   + offering at least one WRITTEN entry        ${writtenOnly}`);
console.log(`   + the coordinate's VERB agrees with the call ${notDelete}`);
console.log(`   + once per coordinate per run                ${oncePer}`);
if (why) for (const d of detail) console.log(d);
console.log('   What the hook mostly says today is the contract table for the route being called, and an');
console.log('   entry about a DELETE route to somebody who only read. Neither is worth an interruption.');
