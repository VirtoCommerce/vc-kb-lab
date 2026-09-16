// THE CONTRACT PLANE IS AN ADDRESS BOOK, NOT A SEARCH CORPUS. 2026-09-16.
//
// It is 88% of the corpus by count and 15% of it has ever been used, and its wide type tables are
// what "adjacent" answers were made of — a tax question answered with a discount row, a sign-in
// question with platform GraphiQL. Fourteen ranking rules were swept against that and every one
// either left the bad answers in or threw good ones out, because the failure is vocabulary and BM25
// cannot bridge vocabulary.
//
// The second independent review put the reason better than the utilisation number does: free-text
// search over the contract solves a problem the reader does not have. An agent asking what fields
// `CartTotalType` carries already knows the coordinate — introspection or one swagger fetch answers
// it authoritatively, and the derived entry is a cached copy. What the plane is uniquely good for is
// resolving, and every use of that is a keyed lookup.
//
// Nothing was deleted. The gate, `kb check`, anchor reachability and the source door read the plane
// exactly as before, and the last of those is pinned here too: it is the one consumer that would
// break silently, because a door only appears on a MISS and a MISS is easy to produce by accident.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildIndex } from '../src/index-build.mjs';
import { stringifyFrontmatter } from '../src/frontmatter.mjs';
import { ask } from '../src/resolve.mjs';
import { DERIVED_ENTRIES, CAPTURED_DIR, CAPTURED_INDEX } from '../src/planes.mjs';

function baseWith({ derived = [], written = [] }) {
  const dir = mkdtempSync(join(tmpdir(), 'kb-address-'));
  writeFileSync(join(dir, 'kb.json'), JSON.stringify({ namespace: 'KB', idWidth: 8 }));
  mkdirSync(join(dir, DERIVED_ENTRIES), { recursive: true });
  mkdirSync(join(dir, CAPTURED_DIR), { recursive: true });

  const write = (list, plane, dirName) => list.map(({ id, subject, coordinate, body, module: mod, version }) => {
    const path = `${dirName}/${id}.md`;
    const question = `What is the contract of ${subject}?`;
    writeFileSync(join(dir, path), `${stringifyFrontmatter({
      id,
      subject,
      plane,
      question,
      status: 'active',
      refutableBy: plane === 'derived-first' ? 'derivation' : 'observation',
      appliesTo: mod ? [{ module: mod, version }] : [],
      anchors: [{ coordinate: coordinate ?? subject }],
      evidence: [{ method: 'extraction', deployment: 'vcptcore_stable', pin: '0000000000000000' }],
    })}\n\n${body}\n`);
    return { id, subject, question, text: body, path };
  });

  const derivedDocs = write(derived, 'derived-first', DERIVED_ENTRIES);
  const writtenDocs = write(written, 'experiential', CAPTURED_DIR);
  writeFileSync(join(dir, 'derived-index.json'), `${JSON.stringify(buildIndex(derivedDocs), null, 2)}\n`);
  writeFileSync(join(dir, CAPTURED_INDEX), `${JSON.stringify(buildIndex(writtenDocs), null, 2)}\n`);
  return dir;
}
const drop = (dir) => rmSync(dir, { recursive: true, force: true });

const TAX_TABLE = {
  id: 'KB-D0000001',
  subject: 'rest-api-taxes',
  coordinate: 'GET /api/taxes',
  module: 'VirtoCommerce.Tax',
  version: '3.1000.0',
  body: 'Tax provider routes: evaluate, search, activate a tax provider for a store, tax calculation.',
};
const CART_TYPE = {
  id: 'KB-D0000002',
  subject: 'gql-type-carttotaltype',
  coordinate: 'CartTotalType',
  body: 'CartTotalType: subTotal, total, discountTotal, taxTotal on the cart.',
};

test('a contract table is no longer served to a question that merely shares its words', () => {
  const dir = baseWith({ derived: [TAX_TABLE] });
  const r = ask(dir, 'how is tax calculated on orders in this deployment', { limit: 3 });
  assert.equal(r.miss, true,
    'this question shares `tax` and `calculation` with the table and is not answered by it — '
    + 'the exact shape of the adjacent answer measured in kb-missdrift-2026-09');
  drop(dir);
});

test('and the same table is served at once when its coordinate is named', () => {
  const dir = baseWith({ derived: [TAX_TABLE] });
  const r = ask(dir, 'GET /api/taxes', { limit: 3 });
  assert.equal(r.miss, false);
  assert.equal(r.results[0].id, 'KB-D0000001');
  drop(dir);
});

// The failure the review warned about when it proposed coordinate lookup, and the reason the rule
// is written on the ASKER'S SPELLING rather than on the stored coordinate: `normalizeAnchor`
// lowercases everything on the way in, so the capital that makes a name a name is gone by then.
test('a bare compound type name resolves; a single capitalised word never does', () => {
  const dir = baseWith({
    derived: [CART_TYPE, { id: 'KB-D0000003', subject: 'gql-type-promotiontype', coordinate: 'Promotion', body: 'Promotion: id, name, isActive.' }],
  });
  assert.equal(ask(dir, 'what fields does CartTotalType carry', { limit: 3 }).results?.[0]?.id, 'KB-D0000002');
  assert.equal(ask(dir, 'does a Promotion apply to this cart', { limit: 3 }).miss, true,
    '`Promotion` is a type name and an ordinary English word; a question containing it is not a question about the type');
  drop(dir);
});

test('a written entry still wins the ranked list, because that list is now only written entries', () => {
  const dir = baseWith({
    derived: [TAX_TABLE],
    written: [{
      id: 'KB-E0000001',
      subject: 'tax is provider-driven and silently zero without an active provider',
      coordinate: 'GET /api/taxes',
      // Written out so it actually clears the three-term floor. A fixture too thin to be served is
      // not evidence about ranking — the trap the retrieval tests already carry a note about.
      body: 'How tax is calculated on orders in this deployment: it is not. No tax provider is '
        + 'active on this store, so every order carries taxTotal 0 and an empty taxDetails, and the '
        + 'zero is a configuration fact rather than a calculation result.',
    }],
  });
  const served = ask(dir, 'how is tax calculated on orders in this deployment', { limit: 3 }).results.map((x) => x.id);
  assert.deepEqual(served, ['KB-E0000001']);
  drop(dir);
});

// The plane left the ANSWERS. It did not leave the base, and this is the consumer that would go
// quiet without anybody noticing: a near-miss on a contract table is what names the owning module
// and the version installed here.
test('the contract plane still powers the source door on a MISS', () => {
  const dir = baseWith({ derived: [TAX_TABLE] });
  const r = ask(dir, 'how is tax calculated on customer orders in this deployment', { limit: 3 });
  assert.equal(r.miss, true);
  assert.ok(r.source.some((d) => d.module === 'VirtoCommerce.Tax' && d.version === '3.1000.0'),
    'taking the plane out of the near-miss pass as well would have removed the one thing it was '
    + 'measured to be good for, on the same day it stopped being an answer');
  drop(dir);
});
