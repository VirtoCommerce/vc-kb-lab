# The comparison — three runs, and what they actually show

All arms have run. **Arm A was not run**: it measures an agent with no context at all, which nobody
disputes, and a second arm B was worth more.

## The numbers

| arm | context | logged calls | wall clock | budget told to the arm |
|---|---|---|---|---|
| **B** | QA repository | **149** | 13 min | "150 tool calls" — and it rationed to 149 |
| **C** | the base, nothing else | **194** | 20 min | none |
| **B2** | QA repository | **232** | 19 min | none |

**Compare only the two uncapped runs.** Arm C finished in **194 calls against arm B2's 232 — 16%
fewer**, on the same task, same deployment, same day.

**The cap was worth about 83 calls.** The same arm-type that finished at 149 under a stated budget
took 232 when told to work until done. That is the measure of how much a nearly-binding cap
compresses a run, and it is why arm B's first number cannot be compared with arm C's.

### The prediction was wrong, and by how much

**P4** said arm C would finish in **at least 25% fewer** calls. It finished in 16% fewer. **Falsified
as stated**, and recorded as falsified rather than reworded. The direction was right; the size was
not.

## What n = 3 does and does not buy

Two runs of the same arm-type, 149 and 232, are **not a spread** — one was capped. So **the variance
of an uncapped arm B is still unmeasured**, and a 16% difference between two single runs is an
observation, not a result. Twelve earlier runs on this deployment ranged from 83 to 319 calls. A
16% gap sits comfortably inside that kind of noise.

**This is the honest ceiling of the whole exercise and it goes on the demo page in the same type
size as the 16%.**

## What the base actually did, checked rather than assumed

### It answered something two arms could not

`discounts[0].discountAmountWithTax` reads 0 while `discountAmount` holds the real figure. **All
three arms met this independently**, on three different orders:

| arm | what it said |
|---|---|
| B | "Candidate defect, not confirmed — I couldn't establish whether 0 is intended" |
| B2 | "I can't test this under a non-zero rate — there's no tax provider on this store" |
| C | served `KB-A646D086`, written 2026-09-10 by a different run, which states the behaviour and warns that reading the field as the discount reports no discount at all |

Discovery was universal. **Resolution was not.** Two arms with the full QA repository met the same
thing and both stopped at "I cannot settle this"; the arm with the base had it answered in one call,
five days after somebody else wrote it down. That is the product claim, and it survives every caveat
on this page because it has nothing to do with speed.

### It did NOT cause the thing I was about to credit it with

Arm C read the promotions API before building its cart, found `test promo` (active, $50 off at
subtotal ≥ $500, non-exclusive), and sized its cart under the threshold so its own discount would be
cleanly attributable. I wrote that up as a difference in thoroughness and said explicitly that
whether the base caused it was not something one run could show.

**Arm B2 did exactly the same thing, with no base.** It kept its cart at $445.97 for the same stated
reason, and went further — it picked 17%, a rate no other promotion on the store uses, so the
discount would be attributable by rate as well as by id.

So `FINDING-second-promotion.md` overstated the contrast, and this page corrects it: **checking the
promotions surface before trusting it is something a capable agent does anyway.** Arm B missed it;
two later arms did not; only one of those two had a base.

## What each arm asked the base

Arm C: **seven questions, five hits, two MISSes**, recorded by the door rather than by the arm.

The MISSes matter more than the hits. `how is tax calculated on orders in this deployment` — MISS.
`sign in to the Admin platform UI` — MISS, and the corpus has no procedure for the thing every arm
does first.

**And the tax MISS did not stop it.** Refused, arm C asked the derived plane which endpoints exist
under `/api/tax`, then read the store's tax providers itself and established that other stores on
the same deployment DO have tax (Electronics 10%, TestStorePostman 15%), so the zero is
store-specific. A better answer than the corpus holds, from an arm the corpus had just refused.

## The three orders

| arm | order | subtotal | discount | total | rate |
|---|---|---|---|---|---|
| B | CO260915-00001 | 1612.97 | 241.95 | 1371.02 | 15% |
| C | CO260915-00002 | 263.75 | 31.65 | 232.10 | 12% |
| B2 | CO260915-00003 | 445.97 | 75.81 | 370.16 | 17% |

**They are not the same experiment.** Arm B shopped above the $500 threshold and got no $50; the
other two deliberately stayed below it. Arm B's order was six times arm C's. Whatever the call
counts say, the three arms did not do equally hard arithmetic.

## Deployment state

Three orders, all **Cancelled**. Three shipments left `New`, as every run since 07 has left one.
Three new promotions, all **disabled, not deleted**. Eight pre-existing active promotions unchanged;
the five earlier `KB-LAB` promotions untouched. Carts empty.

## What goes on the demo page

1. **The `discountAmountWithTax` story**, end to end, with all three arms' own words. It is the
   claim, it is documented by parties that never met, and no caveat on this page touches it.
2. **194 against 232 — 16%**, with the sample size stated beside it and the 149 explained.
3. **Five hits and two MISSes**, both MISSes named.
4. **The second-promotion correction**, because a demo that only survives when the audience does not
   read the working notes is not worth giving.
