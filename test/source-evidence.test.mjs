// `method: source` — a claim read out of code, and why it is not an observation.
//
// Every one of the 124 evidence rows in the live corpus said `method: observation`, because that
// was the only method the door could write. A corpus whose whole contract is that every claim is
// dated, placed and refutable could not say where a claim read from a C# file came from — so it
// either went in disguised as an observation or did not go in at all, and for two rounds it did not
// go in at all while all three arms of every round read source.
//
// The rule these tests hold: a source reading and an observation do not confirm each other. Source
// says what the code does; an observation says what this deployment did. They can agree while the
// deployment runs a different build, which is not hypothetical — two of round two's three arms read
// `dev` rather than the installed tag.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildIndex } from '../src/index-build.mjs';
import { stringifyFrontmatter, parseEntry } from '../src/frontmatter.mjs';
import { capture, confirm, evidenceKinds, CaptureRefused, loadEntry } from '../src/capture.mjs';
import { ask } from '../src/resolve.mjs';
import { validate } from '../src/validate.mjs';
import { DERIVED_ENTRIES } from '../src/planes.mjs';

// A base whose derived plane records one module as installed, which is where the version comes from.
function makeBase() {
  const dir = mkdtempSync(join(tmpdir(), 'kb-source-'));
  writeFileSync(join(dir, 'kb.json'), JSON.stringify({ namespace: 'KB', idWidth: 8 }));
  mkdirSync(join(dir, DERIVED_ENTRIES), { recursive: true });
  mkdirSync(join(dir, 'derived'), { recursive: true });
  writeFileSync(join(dir, 'derived', 'pin.json'), JSON.stringify({
    deployment: 'vcptcore_stable', pin: 'c2f9c438eba4cd95', platformVersion: '3.1007.26',
  }));
  const id = 'KB-D0000010';
  const subject = 'rest-api-order-customerorders';
  const question = 'Which endpoints does this deployment serve under /api/order/customerOrders?';
  const body = 'Order routes: search, get, update, delete customer orders.';
  const path = `${DERIVED_ENTRIES}/${id}.md`;
  writeFileSync(join(dir, path), `${stringifyFrontmatter({
    id,
    subject,
    plane: 'derived-first',
    question,
    status: 'active',
    refutableBy: 'derivation',
    appliesTo: [{ module: 'VirtoCommerce.Orders', version: '3.1000.4' }],
    anchors: [{ coordinate: 'DELETE /api/order/customerOrders' }],
    evidence: [{ method: 'extraction', deployment: 'vcptcore_stable', pin: 'c2f9c438eba4cd95' }],
  })}\n\n${body}\n`);
  writeFileSync(join(dir, 'derived-index.json'), `${JSON.stringify(buildIndex([{ id, subject, question, text: body, path }]), null, 2)}\n`);
  return dir;
}
const drop = (dir) => rmSync(dir, { recursive: true, force: true });

const CLAIM = {
  subject: 'no shipment handler exists in the Orders module',
  question: 'what code cancels an order shipment when the order is cancelled',
  claim: 'Nothing does. CancelPaymentOrderChangedEventHandler collects changedEntry.NewEntry.InPayments only.',
  refutableBy: 'observation',
  anchors: ['DELETE /api/order/customerOrders'],
  appliesTo: ['surface=rest'],
  at: '2026-09-16T00:00:00Z',
};
const SOURCE = 'VirtoCommerce.Orders:src/VirtoCommerce.OrdersModule.Data/Handlers/CancelPaymentOrderChangedEventHandler.cs';

// --- the row ---------------------------------------------------------------------------------------

test('a source-backed capture records the module, the INSTALLED version and the path', () => {
  const dir = makeBase();
  const r = capture(dir, { ...CLAIM, source: SOURCE });
  const { data } = loadEntry(dir, r.id);
  const row = data.evidence[0];
  assert.equal(row.method, 'source');
  assert.equal(row.module, 'VirtoCommerce.Orders');
  assert.equal(row.version, '3.1000.4', 'resolved from the derived plane, never typed by the writer');
  assert.match(row.path, /CancelPaymentOrderChangedEventHandler\.cs$/);
  assert.match(row.url, /vc-module-order\/3\.1000\.4\//, 'the url is the installed tag, not a branch');
  assert.equal(row.deployment, undefined, 'a file at a tag was not read off a deployment');
  drop(dir);
});

test('`--source` replaces `--deployment`, and one of the two is still required', () => {
  const dir = makeBase();
  // Neither: refused, and the refusal names what is missing.
  assert.throws(() => capture(dir, CLAIM), (e) => e instanceof CaptureRefused && /deployment/.test(e.message));
  // Source alone: accepted.
  assert.ok(capture(dir, { ...CLAIM, source: SOURCE }).id);
  drop(dir);
});

test('a module this base does not record as installed is refused, not stamped with a guess', () => {
  const dir = makeBase();
  assert.throws(
    () => capture(dir, { ...CLAIM, source: 'Acme.Invented:src/Thing.cs' }),
    (e) => e instanceof CaptureRefused && /does not record/.test(e.message) && /installed/.test(e.message),
  );
  drop(dir);
});

test('a `--source` without a path is refused with the shape it wanted', () => {
  const dir = makeBase();
  for (const bad of ['VirtoCommerce.Orders', 'VirtoCommerce.Orders:', ':src/Thing.cs']) {
    assert.throws(() => capture(dir, { ...CLAIM, source: bad }), (e) => e instanceof CaptureRefused && /<Module\.Id>:<path/.test(e.message));
  }
  drop(dir);
});

// --- the rule --------------------------------------------------------------------------------------

test('evidenceKinds counts the two kinds apart and never sums them', () => {
  assert.deepEqual(
    evidenceKinds({ evidence: [{ method: 'source' }, { method: 'observation' }, { method: 'observation' }, { method: 'observation', contradicts: true }] }),
    { observation: 2, source: 1, disputes: 1 },
  );
  assert.deepEqual(evidenceKinds({}), { observation: 0, source: 0, disputes: 0 });
});

test('an observation does not confirm a source reading', () => {
  const dir = makeBase();
  const r = capture(dir, { ...CLAIM, source: SOURCE });
  confirm(dir, r.id, { deployment: 'vcptcore_stable', at: '2026-09-16T01:00:00Z' });

  const served = ask(dir, 'what code cancels an order shipment when the order is cancelled', { limit: 3 });
  const trust = served.results[0].trust;
  assert.equal(trust.kinds.source, 1);
  assert.equal(trust.kinds.observation, 1);
  assert.equal(trust.level, 'single-observation',
    'one of each is agreement between two different kinds of evidence, and is not confirmation');
  assert.ok(trust.reasons.some((x) => /NOT counted as confirmation/.test(x)), 'and the served answer says so');
  drop(dir);
});

test('a second reading of the SAME kind does confirm', () => {
  const dir = makeBase();
  const r = capture(dir, { ...CLAIM, source: SOURCE });
  confirm(dir, r.id, { deployment: 'vcptcore_stable', at: '2026-09-16T01:00:00Z' });
  confirm(dir, r.id, { deployment: 'vcptcore_stable', at: '2026-09-16T02:00:00Z' });
  const trust = ask(dir, 'what code cancels an order shipment when the order is cancelled', { limit: 3 }).results[0].trust;
  assert.equal(trust.kinds.observation, 2);
  assert.equal(trust.level, 'confirmed');
  drop(dir);
});

test('provenance names the channel, not a missing deployment stamp', () => {
  const dir = makeBase();
  capture(dir, { ...CLAIM, source: SOURCE });
  const served = ask(dir, 'what code cancels an order shipment when the order is cancelled', { limit: 3 });
  assert.match(served.results[0].provenance, /read from source @ VirtoCommerce\.Orders:3\.1000\.4/);
  assert.doesNotMatch(served.results[0].provenance, /\?@\?|undefined/, 'a different kind of evidence must not read as a broken stamp');
  drop(dir);
});

// --- the gate --------------------------------------------------------------------------------------

test('the gate refuses a source row that does not say which code', () => {
  const dir = makeBase();
  const r = capture(dir, { ...CLAIM, source: SOURCE });
  const file = join(dir, 'captured', `${r.id}.md`);
  // The line goes entirely, newline included: leaving a blank one is caught earlier, by the
  // frontmatter parser, and would pass this test for the wrong reason.
  const raw = readFileSync(file, 'utf8');
  writeFileSync(file, raw.replace(/^ *path: .*\r?\n/m, ''));
  assert.ok(validate(dir).problems.some((p) => /names no path/.test(p)), validate(dir).problems.join('; '));
  drop(dir);
});

test('the gate flags a source row citing a version this base does not run', () => {
  const dir = makeBase();
  const r = capture(dir, { ...CLAIM, source: SOURCE });
  const file = join(dir, 'captured', `${r.id}.md`);
  writeFileSync(file, readFileSync(file, 'utf8').replace('version: 3.1000.4', 'version: 3.1009.0'));
  const { data } = parseEntry(readFileSync(file, 'utf8'), 'captured');
  assert.equal(data.evidence[0].version, '3.1009.0');
  assert.ok(
    validate(dir).problems.some((p) => /records 3\.1000\.4 as installed/.test(p)),
    'a hand-edited tag, or one that survived a re-extract, is exactly the drift `dev` caused in round two',
  );
  drop(dir);
});
