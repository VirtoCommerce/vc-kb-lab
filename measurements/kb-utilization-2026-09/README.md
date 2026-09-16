# kb-utilization-2026-09 — how much of this corpus has ever been in front of anybody

Reproduce:

```
node measurements/kb-utilization-2026-09/utilization.mjs
```

Read-only against the corpus and every archived log.

## The question

Three rounds asked whether the base makes an agent better. None asked the cheaper question: **of
the 671 entries in it, how many have ever reached an agent at all?** Any decision about what to
store has to start there, and it can be answered entirely from logs already on disk.

Two ways an entry can reach someone, both counted from real records rather than assumed:

* **served** — it appeared in the `served` array of an `ask`, `deliver` or `how` in some run's kb
  journal. **107 retrieval calls** across every run and arm that had a base.
* **arrived** — one of its coordinates appears in some tool call's target, so the arrival hook
  would have handed it over unasked. **4,223 calls** across all 22 archived tool logs.

Counting *either* is the most generous reading available: an entry counts as used if it was ever
served to anyone, or would ever have arrived in front of anyone, at any point in the project's
history.

## The result

| plane | total | ever served | ever arrived | used either way | never |
|---|---|---|---|---|---|
| derived | 590 | 77 | 24 | **87** | 503 |
| captured (agent-written) | 78 | 35 | 37 | **54** | 24 |
| flow | 3 | 3 | 3 | **3** | 0 |
| **all** | **671** | 115 | 64 | **144** | **527** |

**78.5% of the corpus has never been served to anyone and has never been anchored on a coordinate
anyone touched.**

## The number that says what to do about it

| shape | total | used | used |
|---|---|---|---|
| `gql-type` | 303 | 34 | **11%** |
| `gql-mutations` | 101 | 15 | **15%** |
| `gql-query` | 65 | 11 | **17%** |
| `rest-api` | 94 | 27 | **29%** |
| other derived | 25 | 0 | **0%** |
| **captured — written by an agent** | **78** | **54** | **69%** |
| **flow — written by an agent** | **3** | **3** | **100%** |

**The plane that is free to generate is the dead one. The plane that costs a run to write is the
live one.** 590 entries were projected from the deployment's own contract in minutes; 15% of them
have ever been used. 81 were written by agents doing real work, at a cost of twelve runs; 70% of
those have been used.

This inverts the intuition the corpus was grown on. The derived plane was expanded from 287 to 590
entries on 2026-09-12 to close an omission — 89 GraphQL types described nowhere — and the expansion
was correct on its own terms and measured at the time. What was never asked is whether the plane it
expanded gets read, and the answer is that nine in ten of its type tables never have been.

## Two cautions on the number, before anyone acts on it

1. **Absence of use is not absence of value.** A route table nobody asked for is not thereby wrong,
   and the derived plane's job includes being the thing the experiential plane can be checked
   against — which is how `FINDING-orders-are-deletable.md` was settled, by a derived entry nobody
   had ever been served. That use does not appear in either column here.
2. **Use is concentrated, not spread.** 68 of the 115 entries ever served were served exactly once.
   The load is carried by a dozen: `rest-api-order-customerorders` seven times, the order flow six,
   then a handful of order and cart type tables and four agent-written entries.

## What follows, stated as a recommendation rather than done

**Do not delete anything.** Deleting 503 entries before a demo, on a measurement a day old, is the
kind of act this project has a history of regretting; and a corpus that shrinks cannot be compared
with the three rounds already run against it.

What the number actually argues for:

* **Stop growing the derived plane by projection.** More type tables add volume at 11% utilization.
* **Give the derived plane the job it is uniquely able to do** — being the contract that a written
  claim can be checked against, and naming the module a code question belongs to. That is the
  source door, VCST-5975, and this measurement is an argument for it: the derived plane's value is
  not in being read, it is in being *resolvable*.
* **Grow the written planes.** They are used at four to six times the rate, and they are the only
  place mechanism has ever come from.
