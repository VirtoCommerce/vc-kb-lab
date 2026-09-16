// The bar for the `ask` MISS contract, and where every row came from.
//
// THE ROWS ARE NOT MINE. Each one is a question the base itself recorded in `demand.jsonl` --
// eight of them with `miss: true`, meaning the base, at the time, judged that it had nothing. The
// only judgement added here is whether an entry that answers the question has been WRITTEN since,
// which is checkable by opening the corpus and is stated per row.
//
// That provenance is the point. A bar of negatives invented by the person changing the floor would
// be a bar built to be met. These are questions a working agent typed, and a contemporaneous
// refusal by the tool under test.

// A NEGATIVE IS A PROPERTY OF THE CORPUS, AND THE CORPUS CHANGES. "Nothing here answers this" was
// true when it was written and stopped being true ninety minutes later, when an entry was captured
// that answers the tax question exactly. Nobody re-validated, so every candidate in the sweep was
// docked a point for serving the right answer. The second independent review found it.
//
// Two things guard it now: this stamp, and `checkStale` below, which the sweep runs before it
// reports anything.
export const VALID_AT = {
  corpus: '5c1c744',
  when: '2026-09-16T11:16+04:00',
  note: 'the corpus commit these negatives were read against. A sweep run against a later corpus '
    + 'must re-validate them, which `checkStale` does.',
};

// RETIRED FROM THE BAR, kept visible because deleting it would hide why the table changed.
//
// It was a negative because no entry described tax calculation. On 2026-09-16 at 12:14 local,
// ninety minutes after this file was written, KB-1B18B821 was captured -- and its `question`
// field is this sentence VERBATIM, because `kb todo` tells a writer to word a capture exactly as
// the demand row it closes. So the row is not merely stale: it cannot be moved to SHOULD_SERVE
// either, because an entry whose question field was copied from the query would be scored a hit
// for the wrong reason, and any future measurement of "does matching on `question` help" would
// inherit that. The loop that produced it will produce more; see the review, finding 2.
export const RETIRED_NEGATIVES = [
  {
    q: 'how is tax calculated on orders in this deployment',
    retiredAt: '2026-09-16',
    because: 'answered by KB-1B18B821, captured 90 minutes after this bar was written, whose '
      + '`question` field is this query verbatim.',
  },
];

// Should be refused. Nothing in the corpus answers these, verified by reading what is served today.
export const SHOULD_MISS = [
  {
    q: 'sign in to the Admin platform UI',
    because: 'no entry describes signing in to Admin. Today this is answered with platform GraphiQL '
      + 'running anonymous, Login on behalf, and the account Status picker: three entries about '
      + 'other things, matching only `admin`, `platform` and `ui`.',
  },
  {
    q: 'create a percentage-off promotion in the Admin Marketing module',
    because: 'a PROCEDURE, and the flow plane answers it correctly (KB-EB228603). `ask` must refuse '
      + 'and point at `kb how`; today it serves the REST route table for /api/marketing/promotions '
      + 'plus two unrelated experiential entries.',
    flow: 'KB-EB228603',
  },
  {
    q: 'create a promotion with a coupon code',
    because: 'the same shape: the coupon flow KB-A54C919F answers it. `ask` serves route tables and '
      + 'cart facts instead.',
    flow: 'KB-A54C919F',
  },
];

// Should be answered, and with a named entry the corpus demonstrably holds. Two of the three are
// wrong TODAY, so this half of the bar is not a formality either.
export const SHOULD_SERVE = [
  {
    q: 'how does the platform decide which promotions combine best reward policy',
    want: 'KB-5ADBFB34',
    because: 'recorded as a MISS on 2026-09-13 and genuinely answered since: KB-5ADBFB34, "only the '
      + 'largest cart-subtotal promotion applies, whatever isExclusive says", written 2026-09-15. '
      + 'Correct today, and it must stay correct -- this row is what stops the floor being raised '
      + 'until everything refuses.',
  },
  {
    q: 'what does the storefront GraphQL API expose for applying and validating a coupon on a cart',
    want: 'KB-A5771702',
    alsoAcceptable: ['KB-89BDC099', 'KB-4C8D45CE'],
    because: 'the derived plane holds gql-mutations-addcoupon and gql-query-validatecoupon, which '
      + 'are exactly what the question asks for. Today all three slots go to experiential entries '
      + 'about where coupon money lives on a cart. WRONG TODAY.',
  },
  {
    q: 'what happens to an existing cart when a promotion is edited',
    want: 'KB-35A09C64',
    because: 'row M1 of the 2026-09-12 floor measurement, still open. KB-35A09C64 is "promotion '
      + 're-evaluation on cart read". Today the slots go to an unrelated checkout-confirmation '
      + 'entry, the promotion blade\'s save gate, and discount labels. WRONG TODAY.',
  },
];

// --- re-validation ----------------------------------------------------------------------------
//
// THE BAR CHECKS ITSELF BEFORE IT IS USED. A negative says "nothing in the corpus answers this",
// which is a claim about a corpus that changes every time anybody captures. This one went stale in
// ninety minutes and stayed stale for a day, and every candidate the sweep scored was docked for
// serving the right answer.
//
// The cheap, exact check: has anybody since written an entry whose `question` field IS the query?
// That is the shape `kb todo` manufactures, so it is both the likeliest way a negative dies and the
// one that most distorts a measurement.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function checkStale(base) {
  const dir = join(base, 'captured');
  if (!existsSync(dir)) return [];
  const byQuestion = new Map();
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const txt = readFileSync(join(dir, f), 'utf8');
    if (/^status: retired$/m.test(txt)) continue;
    const m = txt.match(/^question: (.*)$/m);
    if (m) byQuestion.set(norm(m[1]), f.replace('.md', ''));
  }
  return SHOULD_MISS
    .map((row) => ({ row, id: byQuestion.get(norm(row.q)) }))
    .filter((x) => x.id);
}

export function renderStale(stale) {
  if (!stale.length) return null;
  return [
    `BAR IS STALE: ${stale.length} negative(s) are now answered by an entry whose question field is the query.`,
    ...stale.map((s) => `  "${s.row.q}"  ->  ${s.id}`),
    `The bar was read against corpus ${VALID_AT.corpus} (${VALID_AT.when}). Every candidate below is`,
    'being docked for serving the right answer. Retire the row or re-word it before quoting this table.',
  ].join('\n');
}
