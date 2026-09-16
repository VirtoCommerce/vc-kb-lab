# Sealed before the arm runs — which catalog entries I predict are relevant

**Written after `TASK.md` and before any arm starts.** Run condition 1 of the second review: the
post-hoc `RESTATED` table in `kb-rediscovery-2026-09` is the same person judging relevance after
reading the report, and it produced fifteen events that turned out to be commissioned by the oracle.
This page is the replacement. It is a **prediction**, and it is allowed to be wrong; being wrong in
public is the point.

Scoring afterwards, by `score-opens.mjs`, with no judgement left to make:

| | |
|---|---|
| **relevant-opened** | the arm opened an entry on this list |
| **irrelevant-opened** | the arm opened one that is not |
| **relevant-missed** | an entry on this list the arm never opened |

---

## The prediction

The task is set on `/api/pricing`, which no run has walked and which the written corpus has no entry
about. So the honest prediction is mostly **negative**: the catalog holds nothing about price lists,
assignments or price evaluation, and the arm will find the register does not cover its ground.

What I do expect to be relevant, and why:

| entry | why I think the task will reach it |
|---|---|
| `KB-5ADBFB34` only the largest cart-subtotal promotion applies | question 3 asks what a promotion does to a displayed price; this is the deployment's actual combination rule |
| `KB-35A09C64` promotion re-evaluation on cart read | question 3 — whether the discount is recomputed or stored |
| `KB-D992AF44` order discount row is a snapshot, not a live reference | question 3 — whether a discount changes the price or sits beside it |
| `KB-AD1FA66B` where a cart's money lives, and which copy goes stale | question 2 — two surfaces disagreeing about a number is exactly this shape |
| `KB-F027283D` the discount label a shopper sees is free text | question 2 — what the storefront displays is not what the engine computed |
| `KB-F1542157` an order-level discount is not allocated to the line items | question 3 — where the money is taken off |
| `KB-1B18B821` tax is provider-driven and silently zero | question 2 — the other component of a displayed total on this stand |
| `KB-02238DE5` storefront org-role gating granularity | question 4 — the only entry touching organization-specific behaviour |

**Eight entries of 78.** Everything else in the catalog I predict the arm should NOT open for this
task, and opening many of them is a result too: it would mean the sections are inviting the wrong
reading.

## What I predict the arm will do

Stated so it can be wrong:

* It opens **between 2 and 6** entries. Fewer than 2 means the catalog is not read; more than 12
  means it is being browsed rather than used.
* At least one open is from the **promotions & discounts** section, because that is where questions
  2 and 3 point.
* It finds **no entry about price lists** and says so — and if the loop works, it writes one.
* Question 5 produces at least one deployment-specific surprise that the corpus does not hold.

## The stopping rule, stated in advance

> **The run counts as a failure of the frame if the arm opens zero catalog entries, or opens them
> and re-establishes each one from scratch anyway.**

If that is what happens, the conclusion is that a corpus of this shape does not beat an agent with a
browser and a source MCP, and this page will say so without softening.
