// WHO WROTE A ROW — set by the tool, never typed.
//
// Found by the second independent review, 2026-09-16. Fifteen evidence rows in the live corpus
// carried `by: round2-arm-B` and the like, timestamped to the minute the arm had run. No arm ever
// ran a writing verb in any round; the author had typed the witness's name while reading the arm's
// report. Three entries reached `confirmed` on that, and the arrival replay read those rows as help
// that existed before the run — which is where "295 -> 316 arrivals" and "two calls gained" came
// from. Both are zero once the replay's own pre-existence filter is applied.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

import { sessionParty, transcriptionSource, partiesOf, ProvenanceRefused } from '../src/provenance.mjs';
import { capture, loadEntry } from '../src/capture.mjs';
import { buildIndex } from '../src/index-build.mjs';
import { DERIVED_ENTRIES } from '../src/planes.mjs';

function makeBase() {
  const dir = mkdtempSync(join(tmpdir(), 'kb-prov-'));
  writeFileSync(join(dir, 'kb.json'), JSON.stringify({ namespace: 'KB', idWidth: 8 }));
  mkdirSync(join(dir, DERIVED_ENTRIES), { recursive: true });
  mkdirSync(join(dir, 'derived'), { recursive: true });
  writeFileSync(join(dir, 'derived', 'pin.json'), JSON.stringify({ deployment: 'vcptcore_stable', pin: 'p', platformVersion: '3.1007.26' }));
  writeFileSync(join(dir, 'derived-index.json'), `${JSON.stringify(buildIndex([]), null, 2)}\n`);
  return dir;
}
const drop = (dir) => rmSync(dir, { recursive: true, force: true });

const FACT = {
  subject: 'only the largest cart-subtotal promotion applies',
  question: 'why did only one promotion apply when two were active',
  claim: 'CombinePolicy is BestReward on this deployment.',
  refutableBy: 'observation',
  anchors: ['GET /api/marketing/promotions'],
  appliesTo: ['surface=rest'],
  deployment: 'vcptcore_stable',
};

test('the tool stamps the writing session onto a row the writer did not author', () => {
  const dir = makeBase();
  const r = capture(dir, FACT);
  const row = loadEntry(dir, r.id).data.evidence[0];
  assert.match(row.by, /^session:/, 'a row says which session wrote it, and the writer did not choose it');
  drop(dir);
});

test('a transcription names an artefact that exists', () => {
  const dir = makeBase();
  const report = join(dir, 'report.md');
  writeFileSync(report, '# arm B\n\nOnly one promotion applied.\n');
  const r = capture(dir, { ...FACT, from: report });
  const row = loadEntry(dir, r.id).data.evidence[0];
  assert.equal(row.from, report.split(String.fromCharCode(92)).join('/'));
  assert.match(row.by, /^session:/, 'the transcriber is still recorded — the artefact is WHERE it was read, not WHO read it');
  drop(dir);
});

test('a transcription whose artefact does not exist is refused', () => {
  const dir = makeBase();
  assert.throws(
    () => capture(dir, { ...FACT, from: join(dir, 'no-such-report.md') }),
    (e) => e instanceof ProvenanceRefused && /does not exist/.test(e.message),
    'the point of naming the artefact is that somebody else can open it and disagree',
  );
  drop(dir);
});

// The rule that matters. Before this, `by` was a free string and 121 of 124 rows carried none, so
// the independence rule added days earlier could not bite on anything.
test('one party writing twice is one party; two artefacts are two', () => {
  const now = '2026-09-16T00:00:00Z';
  assert.equal(partiesOf([{ by: 'session:aaaa', at: now }, { by: 'session:aaaa', at: now }]), 1,
    'two rows typed in one session are one reading twice');
  assert.equal(partiesOf([
    { by: 'session:aaaa', from: 'logs/round2/arm-B/report.md' },
    { by: 'session:aaaa', from: 'logs/round2/arm-C/report.md' },
  ]), 2, 'one author transcribing two reports is two observations badly recorded, not one');
  assert.equal(partiesOf([
    { by: 'session:aaaa', from: 'logs/round2/arm-B/report.md' },
    { by: 'session:bbbb', from: 'logs/round2/arm-B/report.md' },
  ]), 1, 'two people reading the same report are still one observation');
});

// The 121 rows written before any of this existed must keep their levels, or the corpus re-grades
// itself the day the rule lands and every measurement taken against it stops comparing.
test('rows with neither field each count as their own party', () => {
  assert.equal(partiesOf([{ at: 'a' }, { at: 'b' }, { at: 'c' }]), 3);
  assert.equal(partiesOf([{ at: 'a' }, { by: 'session:aaaa' }, { by: 'session:aaaa' }]), 2);
});

test('a session id the writer cannot choose, and no id at all when there is none', () => {
  assert.equal(sessionParty({ CLAUDE_CODE_SESSION_ID: '09e39416-9083-43d4-b352-859c1de3f08a' }), 'session:09e39416');
  assert.equal(sessionParty({}), null, 'no identity is honest; an invented one is not');
});

test('transcriptionSource passes through nothing when nothing is claimed', () => {
  assert.equal(transcriptionSource(undefined), null);
  assert.equal(transcriptionSource(''), null);
});

// The door itself. A refusal that only lives in the library is a refusal an agent routes around.
test('the CLI refuses a typed author or a typed timestamp', () => {
  for (const flag of ['--by', '--at']) {
    let code = 0; let err = "";
    try {
      execFileSync(process.execPath, [join(process.cwd(), 'bin', 'kb.mjs'), 'capture', flag, 'x'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { code = e.status; err = String(e.stderr ?? ""); }
    assert.equal(code, 2, flag + " must be refused, not silently ignored");
    assert.match(err, /refused/);
    assert.match(err, /--from/, 'a refusal that does not name what to do instead is a wall');
  }
});

// Condition set by the second review when it accepted the artefact rule.
test('a session cannot vote twice by citing an artefact it produced', () => {
  const rows = [
    { by: 'session:aaaa' },
    { by: 'session:aaaa', from: 'logs/its-own-report.md' },
  ];
  assert.equal(partiesOf(rows), 1,
    '`from ?? by` counted this session once for the unaided row and again for its own report');

  // Unchanged where the session did NOT also write unaided: a transcriber citing two reports is
  // still two observations badly recorded, which is the whole point of the artefact rule.
  assert.equal(partiesOf([
    { by: 'session:aaaa', from: 'logs/round2/arm-B/report.md' },
    { by: 'session:aaaa', from: 'logs/round2/arm-C/report.md' },
  ]), 2);
});
