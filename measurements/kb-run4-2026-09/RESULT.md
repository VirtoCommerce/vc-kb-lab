# Round four — the result

One arm, 357 tool calls, 42 minutes. The treatment was the written register in the session's context
instead of behind a query, and `kb ask` / `how` / `deliver` switched off.

Scored against `SEALED-RELEVANCE.md`, written before the arm started.

```
node measurements/kb-run4-2026-09/score-opens.mjs \
  --log C:/_VIRTO/_comparison-logs/round4/arm-C-catalog \
  --catalog C:/_VIRTO/_comparison-logs/round4/arm-C-catalog/CLAUDE.md.as-handed
```

---

## The stopping rule did not fire

> *The frame fails if the arm opens zero catalog entries, or opens them and re-establishes each one
> from scratch anyway.*

Neither happened.

| | |
|---|---|
| register entries used | **8 of 92** |
| cited in the report as the reasoning for an answer | 7 |
| confirmed against what the arm saw | 3 |
| opened as a file | **1** |
| **used without ever being opened** | **7** |

**Seven of the eight were used without opening anything.** The one-line claim in front of the reader
was enough. That is the treatment working, and it is the thing three rounds of a search tool never
produced.

Two of the citations are load-bearing rather than decorative:

> "The discount is computed on the price-list price and applied beside it, not into it… this
> reproduces `@kb(KB-F1542157)`, which I have now confirmed."
>
> "A reader of the cart contract would reasonably conclude that what the storefront shows is
> recomputed at read time… `@kb(KB-AD1FA66B)` describes the read path as recomputing *every figure
> the storefront shows*. **That holds for the promotion layer and not for the unit price underneath
> it.**"

The second is the arm's sharpest finding, and it is built by *contradicting* a register entry it did
not verify first. That is what the changed protocol was for.

## The sealed prediction was half right, which is the point of sealing it

| | |
|---|---|
| predicted and used | **5 of 8** — `KB-35A09C64`, `KB-F1542157`, `KB-F027283D`, `KB-AD1FA66B`, `KB-1B18B821` |
| used but not predicted | 3 — `KB-7E35E6BC`, `KB-5F7C8FC4`, `KB-6824BC2B` |
| predicted and missed | 3 — `KB-5ADBFB34`, `KB-D992AF44`, `KB-02238DE5` |

Predicted 2–6 opens; got 1 open and 8 uses. **The prediction was about the wrong verb** — see below.

Predicted the register holds nothing about price lists: **correct**, and the arm wrote five entries
to fill the gap.

## Attention did not fall off

Deepest row reached: **78 of 92**. Sections reached: promotions & discounts, orders & shipments,
stores & tax, and `unfiled` — which is the last section on the page.

The list was read to the bottom. The row budget in `src/catalog-budget.mjs` is still a guess, but it
is now a guess with evidence that 92 rows is not near the limit, rather than a guess with nothing.

## The scorer measured the wrong thing first, and that is a finding about the instrument

Its first version counted **opens** — `kb show`, or an entry's file being read. Against this log that
returned 2, one of which was an entry the arm had written itself minutes earlier, scored against the
*live* corpus rather than the catalog as handed. Read that way the run looks like a failure.

Both defects are fixed in the script: it scores against the handed artefact (archived beside the log
as `CLAUDE.md.as-handed`), it ignores ids that were not in it, and it counts citation and
confirmation alongside opening. **A catalog you can see is not a store you have to visit, and an
instrument that only counts visits will report a working mechanism as a dead one.**

## What the run found on the platform

Five new entries, all on ground the register did not cover:

| | |
|---|---|
| `KB-6D5E2CD1` | what makes a price list apply to a store, and what the storefront reads it through |
| `KB-ADFD93AB` | org-specific pricing runs through the organization's user groups, not `organizationId` |
| `KB-1834ABE5` | no Admin surface shows the price a given shopper would actually be charged |
| `KB-055845A3` | a cart line can serve a unit price that is in neither the configuration nor its own history |
| `KB-28579C5B` | *(superseded by the above, by the arm itself)* |

**The arm superseded its own entry mid-run.** It wrote a mechanism claim, went back to its own
timeline, found that the timeline refuted it, and replaced the claim with the narrower thing the
evidence supports — keeping the divergence as established and marking the mechanism as not. That is
the loop doing what no gate can: catching a claim its author had already written down.

## Two defects the run found in this project's own tooling

**1. The brief typed the deployment key, and typed it wrong.** It said `vcptcore-stable`; the pin and
all 137 existing evidence rows say `vcptcore_stable`. The tool behaved correctly — it warned that it
could not stamp a version onto an observation from a deployment it has no pin for — but the arm could
not repair it either, because `supersede` will not reuse a subject. One entry landed unstamped.
Fixed at the source: `make-brief.mjs` now reads the key out of `derived/pin.json`. The row's key is
corrected.

**2. `derived/pin.json` is a patch behind the deployment** — it says `3.1007.26`, the stand runs
`3.1007.27`. So the unstamped row was left unstamped rather than given the pin's version: stamping a
version the deployment is not running, to tidy a cosmetic gap, is writing a wrong fact into the
corpus. It needs `kb extract` against the stand, which is a separate action.

That is the eighth and ninth instrument defect found by a measured party rather than by this
project's author.

## What this does not show

* **n = 1, one task, no control arm.** It cannot show a capability difference, and it was not
  designed to; three rounds already established that call counts do not move, and the protocol that
  makes them not move is still in the brief for `single-observation` entries.
* **The 8 uses are a floor.** An entry that shaped the arm's thinking without being cited leaves no
  trace here.
* **The task was chosen on ground the register did not cover.** That was deliberate — it is what
  made the sealed prediction falsifiable — but it means this run says nothing about how the register
  performs on ground it covers well.
