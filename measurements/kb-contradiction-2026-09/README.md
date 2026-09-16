# kb-contradiction-2026-09 — a gate that compares the two planes, and what it can and cannot see

Reproduce:

```
node measurements/kb-contradiction-2026-09/probe.mjs
```

Read-only. It runs the same implementation `kb validate` runs, not a copy.

## What this is for

`measurements/kb-comparison-2026-09/FINDING-orders-are-deletable.md` ends with a request:

> Three run briefs, twelve runs and a corpus all carried a limit that the platform's own contract
> denies. It survived because nobody asked the derived plane a question the experiential plane had
> already answered — and the derived plane is the one that cannot rot. That is an argument for a
> gate that cross-checks the planes, and it is worth more than the cleanup.

The claim was *"an order cannot be deleted on this platform — only cancelled."* The derived plane
had carried `DELETE /api/order/customerOrders`, operation `OrderModule_DeleteOrdersByIds`, since the
day it was first extracted. Twelve runs, three run briefs and a controlled comparison rode on the
false version.

## Anchors cannot do it, and that is the first thing to try

The flow carrying the claim is anchored on `/cart`, `/search` and `/account/orders` — **not** on the
delete route. A check that compared an entry's anchors against the derived plane finds nothing here.
The contradiction is between the entry's **prose** and a coordinate it never names.

So the check is over prose, and it looks for exactly one shape: **a claim that something cannot be
done, where the contract publishes an operation that does it.** That narrowness is what makes it
usable. A general consistency check between prose and a schema is a research problem; this is a grep
with a map.

## Measured

Two populations, because the live corpus cannot measure recall — it holds one known contradiction,
so a check that found it and nothing else would be indistinguishable from one hard-coded to that
sentence.

| | |
|---|---|
| **LIVE** — active written entries flagged | **1 of 70** |
| and the one it flags | `KB-AFB2D3C5`, the sentence above, citing `DELETE /api/order/customerOrders` |
| **PLANTED** — claims the contract refutes, caught | **3 of 3**, each citing the right operation |
| **PLANTED** — legitimate impossibility claims flagged | **0 of 2** |

The planted set is five sentences written for this measurement, three refutable and two not
("a shopper cannot rename their own organization", "the Active column cannot be sorted in the Admin
members grid" — real limits the REST contract says nothing about). It is small and it is mine, and
it lives in the probe rather than in the gate's tests so that the measurement and the regression
suite do not become the same thing.

## Three things it got wrong first, all caught by running it

1. **It cited a route that merely mentioned the object.** "A customer order cannot be updated"
   pointed at `PATCH /api/order/shipments/{id}`, because that route contains `order` too. A reader
   handed the wrong coordinate checks it, finds it irrelevant, and stops trusting the check.
   Candidates are now ranked: a whole path segment beats a substring, a shorter route beats a
   longer one.
2. **It only looked for the object on one side of the verb.** "An order cannot be deleted" puts it
   before; "You cannot delete a promotion" puts it after, and there the only word before `cannot`
   is `you`. Both are ordinary English, and a check that caught one of them would have looked like
   it worked.
3. **It complained twice about one entry.** An amendment quotes the claim it corrects —
   `KB-AFB2D3C5` carries both the false step and, below it, the correction that restates it — so a
   per-sentence notice makes every fix generate a permanent second complaint. One notice per entry
   and coordinate.

## It is a notice, never a failure

A claim the contract appears to refute is sometimes true anyway: an operation can be published and
permission-gated, or documented and broken. Whether the entry is wrong is a judgement, and a gate
that **failed** on it would be answered by deleting the sentence rather than by checking the
platform — the opposite of what this is for. The notice says so in its own text.

That also means this does not, by itself, fix anything. `KB-AFB2D3C5` has already been amended; the
notice still fires, because the original step's sentence is still in the body above the correction,
and a reader skimming the steps still meets the false claim first. Whether that is worth rewriting
the step is a judgement for whoever owns the flow.

## What it cannot see

Everything except this one shape. It has nothing to say about a claim that asserts something the
contract does not publish, about wrong field names, wrong types, wrong order of operations, or any
disagreement phrased positively. **It is one check, sized to one failure that really happened.**
Extending it is worth doing only when a second failure of a different shape has actually cost
something — this project's record on mechanisms built for imagined failures is not good, and the
review that produced this work said so.
