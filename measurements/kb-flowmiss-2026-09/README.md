# kb-flowmiss-2026-09 — the flow plane's MISS contract, scored on questions nobody wrote for it

Reproduce:

```
node measurements/kb-flowmiss-2026-09/replay-variants.mjs --why
```

Read-only. It reads a frozen question list and the flow index; it never calls `kb ask` or `kb how`,
so it appends nothing to `demand.jsonl`.

## What was wrong

Defect **D4** of the 2026-09-16 review: `kb how "cancel an order"` returned the order-placement
flow. With three flows in the plane, `how` returned the least-bad of three for almost anything,
because a flow's *steps* mention every noun of a journey and two words in a body clear a floor of
two.

The fix shipped the same morning: a flow is identified by its **goal**, so it is served by its goal
— a strict majority of the question's content terms must land in `subject` or `question`.

**That fix was measured on fourteen probes written by the person making it.** This page is the
check that should have come with it.

## The held-out set

`questions.json` — **88 distinct questions**, every one anybody has ever really asked this base,
taken from the corpus's own `demand.jsonl` at 278 rows. None was written for this measurement.

**It caught itself being contaminated, which is the reason it is frozen.** `kb ask` and `kb how`
WRITE a demand row. Probing a *copy* of the corpus — the standard safe practice here — appends to
that copy's log. Five questions written while making the change under test therefore appeared
inside the set that was supposed to be held out from it: the count went 88 → 93 and every variant's
score moved. The list is now frozen in a file, refreshed only by `--from-demand`.

## The bar

`bar.mjs`, written by hand **before any variant was run**: for each question that is about reaching
one of the three flows' goals, the expected answer is that flow; for a named set of fact questions
and procedures no flow covers, the expected answer is MISS. Three questions are marked
**borderline** and excluded from scoring, because I cannot honestly call them either way and a bar
written to be met is not a bar.

8 must hit · 18 must MISS · 3 borderline.

**The standing weakness applies and is stated rather than hidden:** the bar was written by the
person who shipped the rule it scores. What limits the damage is that it is committed as data, the
per-question output is printed by `--why`, and anyone who disagrees can edit a row and re-run.

## The result

| variant | false MISS | false HIT | correct of 26 | answers, of 88 |
|---|---|---|---|---|
| **V0** — no goal rule (before 2026-09-16) | 0 | **17** | 8 | 74 |
| **V1** — strict majority, exact match **(shipped)** | **2** | **0** | **23** | 9 |
| V2 — strict majority, prefix credit | 2 | 0 | 23 | 9 |
| V3 — at least 2 goal terms | 0 | 4 | 21 | 28 |
| V4 — at least 2, prefix credit | 0 | 4 | 21 | 29 |
| V5 — at least 2 and at least 40% | 1 | 2 | 22 | 12 |

**The shipped rule is the best of the six, and the defect it fixed was far larger than D4 reported.**
Before the change, the flow plane answered **74 of 88 real questions** — 17 of them from the bar's
must-MISS list, including "what fields does OrderShipmentType have", "sign in to the Admin platform
UI" and "what does validateCoupon return". Three flows were answering five questions in six.

## What it costs, named

Two **false MISSes**, both the same shape — a long question that names the goal and much else:

* *"place an order on the B2B storefront checkout and read the order totals"*
* *"place an order on the B2B storefront: add products to cart and complete checkout"*

Seven content terms, three of them in the goal; three is not a majority of seven. Prefix credit
(V2) does not recover them.

**Loosening is worse, measured.** V3/V4 recover both but buy four false HITs, including
*"cancel a customer order from the Admin"* — the exact failure D4 was raised for. V5 splits the
difference and is worse than V1 on both counts. The project's own trade applies: a MISS costs a
lookup, a confident wrong procedure costs the run.

**Not tuned further, deliberately.** The two false MISSes and the worst false HIT
(*"does the admin order screen show the same totals the storefront charged"*) name the same three
goal terms — `order`, `storefront`, and one of `place`/`admin`. Separating them needs a rule that
weights a goal's verb, which is a mechanism invented to fit two rows. This project has a convention
against constants chosen for no reason the data can see.

## What this does not establish

That the three flows are the right three, or that 9 answers out of 88 is the right number. It is
the right number *if* only nine of those questions are procedural, which is a judgement in
`bar.mjs`. What it does establish is the direction: the plane went from answering five questions in
six to answering the ones that name a goal, with no false HIT left on the bar.
