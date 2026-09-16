# Sealed before round five runs

Written and committed **before either arm starts**, so it can be wrong in public. Round four's
sealed page got the verb wrong — it predicted 2–6 opens and the scorer said 1, which turned out to
be the scorer's regex and not the prediction's error — so this one predicts in the terms the scorer
now uses.

Neither arm may read this directory. The brief says so to arm C; arm A is told nothing about a
register at all.

## The headline this round is the protocol, not the count

Round four never tested the treatment's second half. Only one entry arm C touched was licensed, and
nothing rested on it. This round is set on ground with **7 licensed entries**, and each one arm C
meets is scored:

| verdict | what it means |
|---|---|
| `acted` | used it to answer something, did not re-verify — what the protocol now permits |
| `re-verified` | went and checked it anyway before relying on it |
| `contradicted` | observed the opposite and disputed it |
| `untouched` | never came up |

and separately whether it **held** against what the arm saw.

## The prediction

**The 7 licensed entries, and whether arm C uses each.** I am predicting `acted` or `re-verified`,
not merely "touched":

| entry | claim | predicted |
|---|---|---|
| `KB-4CCC2DD6` | what Cancel document on an order actually cancels | **used** — question 3 is about what takes precedence when something else applies |
| `KB-0C102D97` | cancelling an order cascades to the payment and never to the shipment | **used** — same path, and it is one of the two already attested |
| `KB-FF7E4D5B` | cart-subtotal percentage reward on a customer order | **used** — question 3 names promotions |
| `KB-4982C91F` | order discount amount rounding split | **used** — reachable from question 2, storefront vs Admin on one order |
| `KB-6AA0D7FB` | fixed rate shipping method option pricing | not used — shipping is not in any of the five questions |
| `KB-0DD47BD1` | the amount a payment is for is not the payment's total | not used — payments are adjacent, and question 2 is more likely to land on discounts |
| `KB-6E98AA17` | admin order operations tree staleness after cancel | not used — needs a cancel *and* a second look at the tree |

**So: 4 of 7 used, 3 untouched.**

**How many of the 4 are `acted` rather than `re-verified`:** I predict **2**. The protocol permits
acting on all of them, and round four's arm verified things it was licensed not to verify. An agent
that has just been told an entry is `attested: no` is likely to check it, which is the correct
instinct and will suppress this number.

**Opens:** 3–8. Higher than round four's 3, because the register now covers the ground.

**New entries written:** 1–3. Lower than round four's five, for the same reason.

**Arm A, the control.** It has no register. I predict it independently establishes **1–2** of the 7 —
most likely `KB-4CCC2DD6` or `KB-0C102D97`, because cancelling is the fastest way to answer question
3. Anything it establishes becomes a `from:` row and an attested confirmation by a party that never
read the register. **This number is commissioned by the ground** and is not evidence that the
register is useful; it is tier-two verification obtained cheaply.

**Question 1 is predicted to be answered "not applicable".** Orders are not assigned to a store the
way a price list is. The template warned this would happen on some namespace; this is that namespace.

## The stopping rule, before the result exists

> **The frame fails if arm C `acted` on zero licensed entries** — that is, if every licensed entry it
> met was either re-verified from scratch or ignored.

If that happens, the conclusion is that the licence to act on a confirmed entry is not taken by an
agent even when it is handed one on ground the register covers, and the protocol change is dead.
That gets written down in those words. The rule will not be adjusted after the number is known.

A weaker failure worth naming separately: if arm C `acted` on an entry and the entry **did not
hold**, that is the licence doing harm, and it outranks every other number on the page.

## What this run cannot show

* **The ground was chosen for coverage.** Rediscovery by arm A here is commissioned. Any sentence of
  the form "arm A rediscovered what arm C was given" is about the ground, not the register.
* **n = 1 per arm.** Two sessions, one task.
* **17 of 22 licensed entries carry no attested row**, 5 of the 7 here included. An arm acting on one
  is acting on agreement nobody described. That is the state of the corpus, and it is the number
  this run should move, not a defect in the run.
