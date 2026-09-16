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

// Should be refused. Nothing in the corpus answers these, verified by reading what is served today.
export const SHOULD_MISS = [
  {
    q: 'how is tax calculated on orders in this deployment',
    because: 'no entry describes tax calculation. Today this is answered with KB-D60012DB, which is '
      + 'about discountAmountWithTax on a discount row being zero -- adjacent, and not the question.',
  },
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
