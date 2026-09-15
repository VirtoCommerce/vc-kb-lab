# The comparison — four runs, and the number does not say what we wanted

All four arms have run. The quantitative result is **negative**. The qualitative one is not, and it
is the one the base was built for.

## The numbers

Only the three uncapped runs are comparable.

| arm | context | logged calls | wall clock |
|---|---|---|---|
| **C** | the base, nothing else | **194** | 20 min |
| **A** | nothing at all | **211** | 20 min |
| **B2** | the full QA repository | **232** | 19 min |

| excluded | | | |
|---|---|---|---|
| B | QA repository, told "150 tool calls" | 149 | 13 min |

### The ordering is not the one anybody predicted

**The arm with the full QA repository was the most expensive. The arm with nothing at all beat it by
9%.** If accumulated project context helps an agent do this task, arm B2 should have finished ahead
of arm A. It finished 21 calls behind.

And the base's margin over *nothing* is **8%** — smaller than its margin over the repository.

### Therefore the call count says nothing

Three runs spanning **194 to 232** is a 19% band. Twelve earlier runs on this same deployment, doing
comparable work, spanned **83 to 319**. Three single samples inside a band a quarter the width of the
known noise are indistinguishable from each other.

**P4** — arm C finishes in at least 25% fewer calls — is **falsified**. So is the weaker reading:
there is no ordering here that survives the noise.

**The cap was worth about 83 calls.** The same arm-type that finished at 149 under a stated budget
took 232 when told to work until done. That is the one solid quantitative fact the comparison
produced, and it is a fact about measurement, not about knowledge.

## What survives, and it is the whole claim

`discounts[0].discountAmountWithTax` reads 0 while `discountAmount` holds the real figure.
**All four arms met it independently, on four different orders.**

| arm | context | what it concluded |
|---|---|---|
| B | QA repository | "Candidate defect, not confirmed — I couldn't establish whether 0 is intended" |
| B2 | QA repository | "I can't test this under a non-zero rate — there's no tax provider on this store" |
| A | nothing | "Unknown: whether that pair is intentional or a data-population defect — these three surfaces can't settle it, so I'm not guessing" |
| **C** | **the base** | served `KB-A646D086`, written **2026-09-10** by a different run, stating the behaviour and warning that reading the field as the discount reports no discount at all |

**Three arms said "I cannot settle this". One did not have to.** The difference was one tool call
against an entry somebody else wrote five days earlier.

Discovery was universal — every arm, with or without context, found the anomaly. **Resolution was
not.** That is what a knowledge base is for, and it is the only thing in this comparison that no
caveat touches: it does not depend on call counts, on sample size, on which products an arm chose, or
on the residue it met.

## What the base did NOT do

**It did not make an agent more careful.** Arms A, B2 and C all read the promotions surface before
building a cart, all found `test promo` ($50 off at subtotal ≥ $500, active, non-exclusive), and all
sized their carts to stay under the threshold. Two of the three had no base. Arm A went further than
arm C and picked a rate — 23% — that no promotion on the store uses, so its discount is attributable
by amount alone; arm B2 did the same with 17%.

Only arm B, the first and the capped one, missed it. **The contrast was between arm B and everybody
else, not between the base and its absence.** `FINDING-second-promotion.md` originally read it the
other way and is corrected.

**It did not cover everything asked of it.** Arm C asked seven questions: five hits, two MISSes.
`how is tax calculated on orders in this deployment` — MISS. `sign in to the Admin platform UI` —
MISS, and the corpus has no procedure for the thing every arm does first.

**And a MISS did not stop the arm.** Refused on tax, arm C asked the derived plane which endpoints
exist under `/api/tax`, read the store's tax providers itself, and established that other stores on
this deployment DO have tax (Electronics 10%, TestStorePostman 15%) — so the zero is store-specific.
A better answer than the corpus holds, produced by an arm the corpus had just refused.

## The four orders — not the same experiment

| arm | order | subtotal | rate | discount | total |
|---|---|---|---|---|---|
| B | CO260915-00001 | 1612.97 | 15% | 241.95 | 1371.02 |
| C | CO260915-00002 | 263.75 | 12% | 31.65 | 232.10 |
| B2 | CO260915-00003 | 445.97 | 17% | 75.81 | 370.16 |
| A | CO260915-00004 | 612.40 | 23% | 140.85 | 471.55 |

Free product choice was kept so that nobody could pick products to suit the base. The cost is that
the four arms did four different jobs, with subtotals spanning six-fold.

## Deployment state

Four orders, all **Cancelled**. Four shipments left `New`, as every run since 07 has left one. Four
new promotions, all **disabled, not deleted**. **Eight pre-existing active promotions unchanged
across every arm** — the one condition that could have moved an arm's arithmetic, and it never
varied. Carts empty.

## What goes on the demo page

1. **The `discountAmountWithTax` story**, four arms in their own words. It is the claim; it is
   documented by parties that never met; nothing here weakens it.
2. **The call counts, and the statement that they show nothing** — 194 / 211 / 232 inside a known
   83–319 band, with the QA repository slowest. A demo that hid this would not survive the first
   person who asked for the raw numbers.
3. **Five hits and two MISSes**, both MISSes named.
4. **What the base did not cause**, because two arms without one did the careful thing anyway.

## What would make the number mean something

Three to five runs per condition, not one. That is six to fifteen sessions and it is a separate
piece of work — proposed after the demo, now that there is a reason to want it. Today's answer to
"is the base faster" is **unknown, and measured to be unknown**, which is worth more than a 16%
that would not have survived arm A.
