# kb-retrieval-2026-09 — one entry per GraphQL type, measured before and after

Reproduce:

```
node measurements/kb-retrieval-2026-09/replay-questions.mjs           # compare against data/baseline.json
node measurements/kb-retrieval-2026-09/replay-questions.mjs --write   # take a new baseline (deliberate)
```

## Why a measurement came first

The retrieval configuration — the relevance floor, the decision not to boost fields, the decision
to keep the platform's own prose out of the index — was settled on numbers that no longer
reproduce. An independent review found three different fractions quoted for the same result and no
script anywhere that produces any of them; they were `_*.mjs`, and `_*.mjs` is gitignored.

So the plane was about to be restructured with no way to notice a regression. The only held-out
questions that exist are the nine a working agent asked while doing a real task
(`MEASUREMENT-archive/run-01-promotions/`), each with what the agent then did about the answer
already recorded at the point of use. That is the baseline, and it reproduced the run's served
lists exactly — including through three captured entries added since, none of which displaced
anything.

The bar was set **before** the change: the two `UNANSWERED` rows gain an entry that describes
`CartTotalType`, and none of the six `HELD` rows loses the entry that served it.

## What was changed

One entry per named GraphQL object and input-object type, anchored on the type and on every
`Type.field`. Root-field entries stop copying the referenced type's field table into their body and
name the type instead. 287 derived entries became 590.

Two defects with one cause, both properties of the corpus rather than of any run:

| | |
|---|---|
| omission | **89** types named in signatures and described nowhere. `CartTotalType` is reachable only as `CartType.cartTotals`, so the plane mentioned it and stopped |
| duplication | `CartType`'s field table copied into **40** entries; ~280 KB of repeats, and forty documents answering to the same terms |

And the coordinate shape: of the eight anchors run 01 chose for the facts it recorded, **six were
named by no derived entry at all**, nearly all of them `Type.field`. The cross-plane check was
blind to the commonest shape of coordinate the experiential plane uses.

## Result

| row | question | before → after | |
|---|---|---|---|
| 1 | how do I create a percentage-discount promotion | unchanged | |
| 2 | how does the cart show an applied discount | `Query.cart` → `gql-type-lineitemtype` | **worse** |
| 3, 4 | which mutation adds a product, and what input | unchanged | |
| 5 | `Mutations.addItem InputAddItemType` | unchanged | |
| 6 | which mutation changes a line item quantity | unchanged | |
| 7 | `InputChangeCartItemQuantityType fields` | mutation entry → **the type itself** | better |
| 8, 9 | what fields does `CartTotalType` have | `Query.cart` → **`gql-type-carttotaltype`** | the point of the change |

**Five unchanged, three better, one worse.**

### The first attempt was worse, and the measurement is why that is known

Removing the field tables from the body, the first cut also removed the referenced types' field
names from the **index**. Six of nine rows lost the entry that had answered them: `Query.cart`
stopped being findable for a question about cart discounts, because it no longer carried the names
of the fields on the type it returns.

The body and the index are not the same decision. A reader following a signature wants one hop
rather than a duplicate — that is the body. But *"which operation gives me the discount"* is
answered by the operation that **returns** a type carrying discounts — that is the index. Restoring
the field names to the index alone took the regression from six rows to one.

### The one that stayed worse

Row 2 asks how the cart shows an applied discount. Its top six are now **all type entries**; the
operation entry is pushed out entirely, and the type that would answer it (`gql-type-carttype`)
sits fifth, below `LineItemType`, `GraphqlSettingsType` and `OrderDiscountType` — which contain a
discount-shaped field and nothing that answers the question.

`LineItemType` is a particularly unhelpful first answer here: run 01's own recorded finding is that
a cart-level reward leaves every line item's `discounts` empty. The base would now point a reader
at exactly the place the discount is not.

The mechanism is general and not specific to this row: 303 short documents dense in field names
will crowd the top of any question containing a common field word. One row of nine shows it; the
shape is clear enough not to need nine more.

**It was not chased.** Tuning retrieval against nine rows is how the previous corpus's numbers came
to mean nothing, and there is no second set to check an adjustment against. It is recorded as a
measured risk and is the first thing the next run's questions should be read against.

## What this does not establish

Nine questions, one task shape, one agent, one deployment. It shows this change does not break what
worked and answers two questions that were unanswerable; it does not show retrieval is better in
general. The honest summary is that the base can now describe every type in its schema, and that
one question out of nine got a worse first answer for it.

---

# Part two — the crowding, chased on 23 rows

The section above ends by refusing to chase it: nine rows is not enough to tune retrieval against,
and tuning against too few rows is how the previous corpus's numbers came to mean nothing. Runs 02
and 03 have since added fourteen more questions, and run 02 hit the same defect independently and
diagnosed it in its own words:

> Resolver ranking issue, not a content gap: the entry existed and answered the question but lost
> to derived type tables for this phrasing.

So it is now a twice-observed defect on a set nobody assembled for the purpose.

## What the harness became

23 rows, each replayed **at the limit its own run used** — run 01 passed `--limit 2`, runs 02 and
03 took the default 3. Three rows carry a `want`: an entry id read out of that row's own `answer`
column, which is what the agent wrote down once it knew. They are the rows where the base held the
answer and did not serve it.

One row's anchor is overridden, and it was overridden *after it fired*. r2.5's first-ranked entry
was `gql-type-customerordertype`; the fix dropped it and the harness called that a regression. But
r2.5's recorded answer names `DiscountType`, `OrderDiscountType` and `OrderLineItemType` and never
`CustomerOrderType` — so that entry led the list without being the one the agent used, and "rank 1
is what the agent acted on" was simply wrong for that row. The override carries its reason into the
script's output rather than sitting in a comment.

## The two changes

**`bm25.d` from 0.5 to 0.** `d` is BM25+'s flat per-term floor: every query term a document
contains adds `idf * d`, however little the document is about that term. On a corpus where 303 of
590 derived entries are wide type tables — documents whose whole job is to be broad — that pays
breadth: a document matching five query terms weakly beats one matching two of them strongly, which
is the wrong way round for a question with a specific subject.

**`graphql`, `graph`, `ql`, `gql`, `api` joined the function words.** The derived plane *is* the
GraphQL schema and the REST contract, so those words appear in almost every entry and discriminate
nothing; the surface is a scope axis, not a search term. Left in they were worse than inert:
`gql-type-graphqlsettingstype` is the one entry with `graphql` in its *subject*, a short field, so a
rare-term-in-a-short-field score put it **first** for run 01's cart question — on the strength of
the only content term it matched at all. `graph` and `ql` are listed because the tokenizer splits
PascalCase, and excluding only the whole word leaves the halves doing the same useless work.

Both are single-line changes in `SEARCH_OPTIONS` and `FUNCTION_WORDS`. Nothing was rebuilt: these
are query-time settings, so the corpus on disk is untouched and `kb check` is unaffected.

## What was tried and rejected

A grid over subject boost × `b` × `d`, scored on all 23 rows.

| | |
|---|---|
| `b` → 0.85 or 1 | costs three rows the entry that served them |
| subject boost ×2 | fixes nothing the plain `d=0` does not |
| subject boost ×3 | fixes r1.2 **and** loses r3.2 — `gql-query-organizationorders`, the entry run 03 cited by id, falls out. A straight trade, not an improvement |
| subject ×3 + `d=0` | loses r1.3 and r1.4 as well: *"which mutation adds a product to the cart"* starts answering with `Query.cart` |

No setting served all three `want` rows. The one that came closest bought the third by selling a
different row, which is not a fix.

## Result

**0 of 23 rows lost what served them. 2 of 3 buried rows are now served.** Beyond the targeted
rows, five moved for the better without being aimed at:

| row | what changed |
|---|---|
| r2.9 | `KB-D4A064A5` — the entry run 02 read off disk by hand — is now served |
| r3.2 | `gql-query-organizationorders` rises from 3rd to 2nd, above `OrderShipmentType` |
| r1.2 | `gql-type-graphqlsettingstype` is gone from the list entirely |
| r1.6 | 2nd becomes `InputChangeCartItemQuantityType` instead of `changeCartItemPrice` |
| r2.1, r2.7 | an experiential entry enters each list, in both cases the one about the exact behaviour asked for |
| r2.5 | `CustomerOrderType` leaves a question about the cart |

## The row still buried, left open on purpose

**r1.2** — *"how does the storefront cart show an applied promotion discount in GraphQL?"* The
recorded answer is `CartType.discounts` and `CartType.discountTotal`, so the entry that should serve
it is `gql-type-carttype`. It ranks 5th, behind `LineItemType`, `OrderDiscountType` and
`DiscountType`.

The cause is visible in the term matches: `CartType` does not contain the word *promotion*, while
the three above it do, and `LineItemType` additionally matches *show* through `showPlacedPrice` — a
prefix hit on a verb. So the row turns on two things this fix does not touch: a vocabulary gap
between what a reader asks (*promotion*) and what the schema calls it (*discount*), and prefix
matching buying recall with precision.

Every lever that fixed this row broke another. It is left failing, visibly, in the harness output —
a row that says `WANT-MISSING` every time anyone runs it is worth more than a setting tuned until
the number looked right.

### And one the fix demonstrably does not touch

Worth stating because it was nearly written up as a success. The question that made the crowding
legible in the first place —

```
kb deliver "does the order discount carry a percent or only an amount"
```

— still returns `OrderShipmentType`, `OrderPaymentMethodType`, `OrderLineItemType`,
`CustomerOrderType`, and only then `OrderDiscountType`. The order shuffled; the head did not move.
That question is **not** one of the 23 rows: it was written by hand to illustrate the defect, and
it is not evidence of anything except itself. It is recorded here because `d=0` was chosen for what
it did to the 23 measured rows, and the hand-written illustration that prompted the work is
untouched by it. The mechanism it shows is real and still unfixed; what it is not is a result.

---

# Part three — the plan said two things, and one of them was already false

After run 05 and two blind re-grades, the agreed next step was, verbatim:

> Retrieval: give the experiential plane a guaranteed slot. Two defects, one cause — the derived
> plane takes every slot. … Fix: if the experiential plane has a hit clearing the floor, it gets a
> slot rather than competing for both; and raise the floor, which is currently one exact content
> term.

**Bar: the ten rows both graders marked `PARTLY` rise, and nothing else falls.**

Neither half of that survived contact with the corpus as it is now. What follows is what was
measured, in the order it was measured, including the two things that were built and then not
shipped.

## The bar was replaced first, and by the graders rather than by me

"The ten rows rise" cannot be evaluated without a third blind grade, and a fourth after the next
change. In practice it would have been evaluated by me, reading the new lists and deciding they
looked better — the exact self-grading the blind re-grade existed to remove.

What the graders left behind is narrower and mechanical. In their prose they named **entries**, by
name, in two directions, and only entries **both** passes support are counted:

| | |
|---|---|
| `offTopic` | served and should not have been — "unrelated", "off-topic", "the wrong surface". **7 across the ten rows.** |
| `missing` | answers the question, was not served, and **the corpus holds it**. **10 across the ten rows.** |

`grader-bar.mjs` runs it. Three rows have no `missing` at all — r01.1 (nothing describes the Admin
SPA promotion flow), r03.1 (no entry names a single role), r03.2 (nothing says what decides order
scope). Those are content gaps: retrieval cannot raise an entry that does not exist, and counting
them against a ranking change would mean tuning toward an unreachable target. They are printed with
`CONTENT GAP` and excluded from the second number, visibly.

## The guaranteed slot: the premise was true when the graders saw it, and is not true now

The graders read the lists **the runs were served**, rebuilt at each run's own commit. Those lists
predate `bm25.d = 0`. Measured against the base as it stands:

| | derived | experiential |
|---|---|---|
| corpus | 590 entries | 24 |
| slots taken across the 23 rows, then | 47 | 13 |
| slots taken now | 40 | 20 |

Four percent of the corpus takes a third of the slots, and leads the list in **8 of 23 rows**. The
plane that was to be given a guaranteed slot does not need one.

It needed the opposite, and r1.2 is the case. *"How does the storefront cart show an applied
promotion discount in GraphQL?"* was being served two experiential entries written by runs 04 and
05 — one about order-discount rounding, one about `UserType.lockedState`. Their evidence was `show`
and `discount`, and `show` and `storefront`. The entry that had served the row fell out of a
two-slot list to make room for them. **A reserved slot would have made that row permanent.**

## The floor: what it can do, and what it cannot

A floor is a filter. It removes candidates; it cannot promote one. So it can clear junk out of a
list, and it can reach a `missing` entry only indirectly, by removing everything above it.

Ten floors were scored on all four numbers; `diagnose.mjs` reproduces any row of it.

| floor | off-topic served | wanted served | rows losing what served them |
|---|---|---|---|
| one term (before) | 2 of 7 | 3 of 10 | 1 |
| at least 2 terms | 2 of 7 | 3 of 10 | 2 |
| **at least 3 terms (shipped)** | **1 of 7** | **3 of 10** | **0**, after the two anchor overrides below |
| coverage ≥ ⅓ | 1 of 7 | 3 of 10 | 3, including `gql-query-organizationorders` |
| coverage ≥ ½ | 1 of 7 | 2 of 10 | 2, and one row served nothing at all |
| 2 terms, or one term rare across the corpus | 2 of 7 | 3 of 10 | 1 |

**No floor moved `wanted` at all.** That is not a tuning failure, it is arithmetic: a filter cannot
reorder.

## Two levers that can reorder, both rejected

**Field boosts.** A grid over subject boost × a de-weight on the prose `question` field × three
floors — 60 settings. The best `wanted` any of them reached was **4 of 10**, and every setting that
reached it cost between two and five rows the entry that served them, and dropped the buried-row
count from 2 of 3 to 1 of 3. A straight trade, which is what the narrower grid in Part two found.
The current setting — no boost — is on the frontier: nothing beats it on every axis.

**One more slot.** Serving `limit + 1` raises `wanted` from 3 to 5 and cannot lose anything, since a
longer list is a superset. It also raises off-topic entries served from 2 to 4, and adds 20 entry
bodies across 23 questions. Two of the ten wanted entries, bought one-for-one with junk and paid for
on every question any agent ever asks. Not shipped. The two it would buy are worth naming: r2.5
gains `gql-type-carttype`, the entry both graders said the asker was left to go and find; r3.3 gains
`gql-mutations-inviteuser`, the fourth mutation of a four-part question asked at a limit of three.
**r3.3 is not a ranking defect at all** — four things were asked for and three slots exist.

## What shipped

One line. `min(3, number of content terms in the question)` instead of one term.

`min` and not a flat 3 because a query is sometimes one term: `InputAddItemType` is a whole
question, and a floor that demanded three of it would answer nothing. A query cannot be asked for
evidence it does not contain.

Five of 23 rows change, and no row loses an entry it was using:

| row | what changed |
|---|---|
| r1.2 | the two run-04/05 entries above go; `gql-type-lineitemtype` returns, with the cart promotion re-evaluation entry beside it |
| r1.1 | `rest-api-search`, whose evidence was `virto` and `commerce`, gives way to an entry about a percentage reward |
| r2.4 | `createOrderFromCart` — the entry both graders called unrelated on r01.1 — leaves |
| r2.10 | three entries whose whole evidence was the word `cart` leave; the one matching every content term stands alone |
| r3.2 | the Admin REST order table both graders called the wrong surface leaves, and `gql-query-organizationorders` — the entry run 03 cited by id — leads |

Off-topic entries the graders named: **2 of 7 → 1 of 7.** Wanted entries served: **3 of 10,
unchanged.** Buried rows: **2 of 3, unchanged.**

### Two anchors overridden, and who overrode them

The replay's rule is that rank 1 is what the agent read and acted on, so its disappearance is a
regression. That rule was already wrong once (r2.5, Part two). It is wrong twice more here, and the
override now records **who** made it rather than only why:

* **r3.2** — overridden to `KB-6FE58084`, *by both blind graders, independently*. Rank 1 was
  `rest-api-order-customerorders`; pass 1 called it "off-topic" and pass 2 "the Admin REST order
  API, the wrong surface". Neither could see the other's answer or mine.
* **r2.10** — overridden to `KB-35A09C64`, *by the author of this change*. Said plainly, because it
  is the weaker of the two. The row is `NOT-USED`: the run asked and did nothing with the answer, so
  rank 1 records nothing anybody acted on.

## What is still true and was not touched

**r1.2 is still `WANT-MISSING`.** `gql-type-carttype` is the recorded answer and is still not
served. The cause is the one Part two named — the reader asks *promotion*, the schema says
*discount* — and no floor reaches a vocabulary gap.

**The hand-written demo question has still not moved.** `kb deliver "does the order discount carry a
percent or only an amount"` still answers `OrderShipmentType` first. The list is shorter; the head is
where it was.

**Nothing was rebuilt.** The floor is a query-time setting, so the corpus on disk is untouched and
`kb check` is unaffected.

## What this measurement cannot settle

Every number above is 23 questions from three runs on one deployment, scored against two graders who
read the lists the runs were served rather than the lists served today. The floor is defensible
because its five row changes can each be read and argued about by name — not because 3 beat 2 on a
score.

---

# Part four — the written plane is winning, and that is the thing to watch

Run 07 put six more rows on the board and one of them regressed a row from run 02. The four rows
below are the same shape seen four times, by four different runs, and only the first was ever fixed:

| row | asked by | what displaced what |
|---|---|---|
| r1.2 | run 01 | two run-04/05 entries took both slots; `gql-type-lineitemtype` fell out. **Fixed by the floor.** |
| r6.1 | run 06 | an entry about deleting a member led, above `createWishlist`. **Self-healed** once run 06 wrote its own. |
| r7.6 | run 07 | both slots went to entries the run had written an hour earlier; `OrderConfigurationItemType` was in the corpus the whole time and had to be opened by hand. **A `want`, unmet.** |
| r2.5 | run 02 | `gql-type-orderlineitemtype` displaced by `KB-AB35BCDC`, written this week. **`LOST`.** |

## It is not a scale problem, which is what I assumed

The two planes are searched as separate MiniSearch indexes with separate corpus statistics, so the
obvious theory was that their scores are not comparable and merging them by raw score is a category
error. Measured over the 30 rows where both planes have a hit above the floor:

```
mean best-experiential score  323.5
mean best-derived score       344.8
```

They are on the same scale. What is disproportionate is the win rate: **39 experiential documents
against 590 derived, leading in 12 of those 30 rows.** Four percent of the corpus takes forty
percent of the head slots, and every run adds roughly eight more documents to the four percent.

## Four mechanisms, and why none shipped

Scored on all 34 rows. The absolute numbers below come from a reimplementation of the pipeline and
do not match `replay-questions.mjs` exactly; the comparison between rows is what they are for.

| | rows losing their anchor | buried rows served | off-topic | grader-wanted |
|---|---|---|---|---|
| control | 1 (r2.5) | 3/5 | 0/7 | 2/10 |
| normalise each plane to its own top | 1 (r3.4) | **4/5** | 0/7 | **3/10** |
| experiential capped at one slot | 1 (r3.4) | 4/5 | 1/7 | 2/10 |
| experiential capped at limit−1 | **0** | 3/5 | 0/7 | 1/10 |

Every one of them buys something and sells something else. Worse, every one is a constant nobody
can derive — "cap at one", "normalise to the top" — and this file already carries three rounds of
that, each rejected for the same reason.

**And r2.5's `LOST` may not be a loss at all.** What now leads it are three entries about where a
cart-level reward lands and what a line item stops carrying — written by the runs that measured
exactly the thing the row asks. That would be the fourth time the "rank 1 is what the agent acted
on" heuristic is wrong on a row, after r2.5 itself, r3.2 and r2.10. Tuning against it would be
tuning against the instrument.

## So what is actually recorded

The **trend**, because it is monotone and nobody has been watching it:

| | derived | experiential | experiential share of head slots |
|---|---|---|---|
| before run 04 | 590 | 12 | — |
| after run 06 | 590 | 33 | — |
| after run 07 | 590 | **39** | **12 of 30 rows** |

If it holds, the derived plane becomes unreachable for any question phrased in ordinary storefront
words, and it will happen without a single change to the code. The next run's rows say whether it
holds. That is a cheaper thing to be right about than a knob chosen today from four candidates that
disagree.

## The baseline was re-taken here, deliberately

`data/baseline.json` dated from 2026-09-11 and the corpus has grown twice since — runs 06 and 07
added seventeen entries between them. Every one of those commits produced `MOVED` and `LOST` rows
that are the corpus changing rather than retrieval changing, which is exactly the noise that makes a
regression detector stop being read.

The r2.5 regression is written down above **before** the baseline that hides it was taken. That
order is the whole point: a baseline re-taken without recording what it swallows is a baseline that
launders a regression.

### The harness will print REGRESSION until a run settles r2.5

r2.5's anchor is an explicit override, not a baseline rank, so re-taking the baseline does not
silence it and was never going to. It will say `LOST` on every run of this harness from now on.

That is deliberate and it is the r1.2 precedent: a row that reports failure every time anyone looks
is worth more than a row adjusted until the summary line reads clean. What would settle it is not a
decision here — it is a run asking that question again and recording which of the two answers it
actually used: the three observations now serving it, or the type table run 02 read.
