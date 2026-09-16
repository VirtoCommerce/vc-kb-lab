# kb-missdrift-2026-09 — the `ask` MISS contract has stopped holding, and half of it is not fixable by a threshold

Reproduce:

```
node measurements/kb-missdrift-2026-09/sweep.mjs --why
```

Read-only. `ask` is called through the module API, which writes nothing; the demand row is written
by the CLI and never happens here.

## The contract, and the evidence that it broke

`README.md` states it as a headline property: *an uncovered question returns an explicit MISS rather
than a plausible non-answer.* The independent review's **D4** said it drifts as the corpus grows,
and demonstrated it on `kb how`. The flow side was fixed the same day
(`measurements/kb-flowmiss-2026-09/`). This is the `ask` side.

**The base's own demand log records eight questions it refused. It answers seven of them today, and
six of those seven answers are adjacent rather than right.**

| question the base once refused | what it serves now | verdict |
|---|---|---|
| how is tax calculated on orders in this deployment | `KB-D60012DB` — discountAmountWithTax is always zero | wrong subject |
| sign in to the Admin platform UI | platform GraphiQL, Login on behalf, the Status picker | three entries about other things |
| create a percentage-off promotion in the Admin Marketing module | the REST route table + two unrelated entries | it is a **procedure** |
| create a promotion with a coupon code | the same route table + cart facts | it is a **procedure** |
| what does the storefront GraphQL API expose for applying and validating a coupon | three entries about where coupon money sits on a cart | the derived plane holds `gql-mutations-addcoupon`, unserved |
| what happens to an existing cart when a promotion is edited | checkout confirmation, blade save gate, discount labels | `KB-35A09C64` answers it, unserved |
| how does the platform decide which promotions combine | `KB-5ADBFB34` | **right** — genuinely learned on 2026-09-15 |

Six code-mechanism questions of the kind round two went to source for — *"which C# service assigns
discountTotal"*, *"which class validates a password sign-in"* — also all return answers. None
misses. That is why the source door, built the same day, almost never opens.

## Why the floor cannot hold the line by counting

The floor asks for `min(3, n)` exact content terms. As entries accumulate, more of them contain any
three given words, so the same question clears the same floor with worse candidates. **The floor
measures how many words matched and never which** — and in a corpus of 668 entries about one
platform, the common words are the medium rather than the subject. That is not a new idea here:
`FUNCTION_WORDS` already excludes `graphql`, `api` and `gql` by hand for exactly this reason.

## The sweep

Every candidate is the current floor **and** one extra condition, so none of them can serve anything
that is not served today; each can only refuse more. Three independent guards.

| candidate | refused of 4 | answered of 3 | anchors lost of 34 | off-topic | wanted |
|---|---|---|---|---|---|
| control — today | 0 | 1 | 0 | 0/7 | 1/10 |
| one matched term with df ≤ 1 | 4 | 1 | **32** | 0/7 | 0/10 |
| df ≤ 3 | 4 | 1 | **22** | 0/7 | 1/10 |
| df ≤ 5 | 3 | 1 | **16** | 0/7 | 1/10 |
| df ≤ 8 | 2 | 1 | **10** | 0/7 | 1/10 |
| df ≤ 20 | 0 | 1 | 7 | 0/7 | 0/10 |
| half the question's terms matched | 0 | 1 | 1 | 0/7 | 2/10 |
| **flow redirect** | **2** | **1** | **1** | **0/7** | **1/10** |
| df ≤ 5 + flow redirect | 4 | 1 | 16 | 0/7 | 1/10 |

**Rarity works and costs far too much.** Any threshold that refuses the negatives destroys the
retrieval the base is actually used for: `df ≤ 5` refuses three of four and loses sixteen of the
thirty-four entries real runs read and acted on. There is no setting where it pays.

**A raw-score threshold was measured and rejected without being swept.** The per-term BM25 score of
the four negatives is 25.2–40.3 and of the positives 30.2–61.3; a cut at 30 separates most of them.
It is not offered as a candidate because a BM25 score is not comparable across corpus versions — a
constant tuned to today's index is guaranteed to drift exactly as the contract it is meant to
protect has drifted, and this project has a standing rule against constants chosen for no reason the
data can see.

## What shipped

**The flow redirect, and nothing else.** If a flow's *goal* matches the question — by the same rule
`kb how` uses, unchanged — `ask` refuses and names the verb that serves it, instead of answering out
of the fact planes.

* refuses both procedural negatives;
* costs **one** of the 34 anchors, `r2.4`, which is itself a procedure, is marked `NOT-USED` by the
  run that asked it, and is answered correctly by `kb how`;
* leaves both blind graders' off-topic and wanted counts unchanged.

That row is **not** overridden away. `questions.mjs` now re-expects it as procedural, and the
harness checks both halves: `ask` must refuse **and** `kb how` must serve the named flow. If the
procedure ever goes missing, the row fails.

## What did not get fixed, stated plainly

**Two of the four negatives still get answered:** *"how is tax calculated on orders in this
deployment"* and *"sign in to the Admin platform UI"*. Nothing measured here refuses them at a price
worth paying. Two of the three positives are also still wrong — the coupon GraphQL entries and
`KB-35A09C64` remain buried under experiential entries with broader bodies.

So the honest position after this work: **the drift is real, half of it had a principled fix, and
the other half is a ranking problem that a term-count floor is the wrong instrument for.** What it
probably needs is a notion of what an entry *claims to answer* carrying more weight than what its
body happens to mention — the entry schema already has that field, `question`, and the goal rule
proves it discriminates for flows. Applying the same idea to facts was measured this morning and
costs 19 of 34 anchors at majority and 7 at `min(2)`, so it needs a shape nobody here has found yet.

That is written down rather than attempted, because a fourth thing tuned against these same
thirty-four rows would be tuning against the only held-out set this project has.
