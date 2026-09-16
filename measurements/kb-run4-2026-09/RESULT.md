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

## Corrected 2026-09-16, after the second reviewer read the log

**The first version of this page published "8 used, 7 unopened, 1 open". The scorer was wrong in
both directions and the reviewer caught it, not me.** Tool-log call 307 is
`cd …/captured && cat KB-AD1FA66B.md; echo …; cat KB-35A09C64.md` — the open rule wanted
`captured/KB-xxxxxxxx.md` as one token, so two of three opens were invisible. And the report's
closing "Register work" table names every confirm, so counting an id anywhere in the report made
every confirmed entry a citation by construction: `KB-7E35E6BC` appears in that table and nowhere
else in the report, and was counted as reasoning.

Both rules are fixed in `score-opens.mjs` and the numbers below are its output. The headline that
survives is smaller and better attested.

## The stopping rule did not fire

> *The frame fails if the arm opens zero catalog entries, or opens them and re-establishes each one
> from scratch anyway.*

Neither happened.

| | first published | verified |
|---|---|---|
| register entries touched | 8 of 92 | **8 of 92** |
| cited in the body of the report | 7 | **6** |
| named only in the bookkeeping table | — | 1 |
| confirmed against what the arm saw | 3 | 3 recorded, **2** with an observation stated |
| opened as a file | 1 | **3** (a floor — 45 of 357 targets are cut at 200 chars) |
| cited without being opened | 7 | **4**, of which 2 are "context I did not re-verify" |
| **used substantively — changed what the arm did or wrote, with an observation beside it** | — | **4** |

**The result is 4 substantive uses, 3 opens, 2 observed confirms.** That is the number to quote. It
is smaller than the one first published and it is worth more, because every one of the four has an
observation next to it:

| | |
|---|---|
| `KB-F1542157` | reproduced and confirmed |
| `KB-35A09C64` | held, and confirmed at 5 observations |
| `KB-AD1FA66B` | contradicted — **after being opened and read in full** |
| `KB-6824BC2B` | opened at call 22 and acted on; platform GraphiQL appears in the surfaces read, with no citation at all |

The last of those is the one the scorer still cannot see as a use, and the honest reading of the
whole set is that **three of the four involved opening the entry.** The one-line claim carrying the
work on its own is `KB-F1542157`, and that is one event.

Two of the citations are load-bearing rather than decorative:

> "The discount is computed on the price-list price and applied beside it, not into it… this
> reproduces `@kb(KB-F1542157)`, which I have now confirmed."
>
> "A reader of the cart contract would reasonably conclude that what the storefront shows is
> recomputed at read time… `@kb(KB-AD1FA66B)` describes the read path as recomputing *every figure
> the storefront shows*. **That holds for the promotion layer and not for the unit price underneath
> it.**"

The second is the arm's sharpest finding, and it is built by *contradicting* a register entry — but
**the first version of this page said it was contradicted unverified, from the one-line claim, and
that is wrong.** Call 307 reads `KB-AD1FA66B` in full at 12:23:00; the section quoting its body
("recomputing every figure the storefront shows") was written after. The contradiction is real and
it is the best thing the register did this run. It is not evidence that a one-liner is enough.

### The changed protocol did not get its test

This is worse than the reviewer put it, and it follows from the handed catalog's own confirmation
counts:

| entry | confirmations as handed | what the protocol said | what the arm did |
|---|---|---|---|
| `KB-AD1FA66B` | 1 | a lead — verify it | opened and verified it. **Correct, and the old protocol** |
| `KB-F1542157` | 1 | a lead — verify it | reproduced and confirmed it. Correct |
| `KB-1B18B821` | 1 | a lead — verify it | cited "only as context, which I did not re-verify". **Protocol ignored** |
| `KB-F027283D` | 1 | a lead — verify it | cited "consistent with". **Protocol ignored** |
| `KB-5F7C8FC4` | 3 | may be acted on unverified | cited as context, nothing built on it |
| `KB-35A09C64` | 4 | may be acted on unverified | verified anyway |

**Exactly one entry the new protocol licensed was touched, and nothing was built on it.** The
change — *`confirmed` entries may be acted on and cited without re-verifying* — was the treatment's
second half, and this run did not exercise it. The two entries acted on without verification were
ones the protocol told the arm to verify. Round five has to be set where the register holds
multiply-confirmed entries on the task's ground, or this half stays untested.

## The sealed prediction was half right, which is the point of sealing it

| | |
|---|---|
| predicted and used | **5 of 8** — `KB-35A09C64`, `KB-F1542157`, `KB-F027283D`, `KB-AD1FA66B`, `KB-1B18B821` |
| used but not predicted | 3 — `KB-7E35E6BC`, `KB-5F7C8FC4`, `KB-6824BC2B` |
| predicted and missed | 3 — `KB-5ADBFB34`, `KB-D992AF44`, `KB-02238DE5` |

Predicted 2–6 opens; got **3**, which is inside the predicted band. The first version of this page
said 1 open and called the prediction "about the wrong verb". That was the scorer's regex, not the
prediction's error — **the sealed prediction was right about the verb and right about the count**,
and the page it fed was wrong. `KB-1B18B821` and `KB-F027283D` count as "predicted and used" here on
a definition of use — cited as unverified context — that the prediction did not have in mind, so
5 of 8 should be read as 3 of 8 substantive.

Predicted the register holds nothing about price lists: **correct**, and the arm wrote five entries
to fill the gap.

## Attention did not fall off

Deepest row reached: **78 of 92**. Sections reached: promotions & discounts, orders & shipments,
stores & tax, and `unfiled` — which is the last section on the page.

The list was read to the bottom. The row budget in `src/catalog-budget.mjs` is still a guess, but it
is now a guess with evidence that 92 rows is not near the limit, rather than a guess with nothing.

## The scorer was wrong three times, in both directions, and that is the finding about the instrument

**First version — too harsh.** It counted **opens** only, against the **live** corpus rather than the
catalog as handed. That returned 2 opens, one of them an entry the arm had written itself minutes
earlier, and 0 of the 8 predicted. Read that way the run is a dead mechanism. Caught by this
project's author.

**Second version — too kind, twice.** Scoring against the handed artefact and counting citation and
confirmation alongside opening, it then (a) required `captured/KB-xxxxxxxx.md` as a single token, so
a `cd` into the directory followed by two `cat`s hid two of three opens, and (b) counted an id
anywhere in `REPORT.md`, so the report's own bookkeeping table turned every confirm into a citation.
Published as "8 used, 7 unopened". Caught by the reviewer.

**Third version — the one above.** An open is any `KB-xxxxxxxx.md` in a tool call, or a `kb show`. A
citation is prose; a table row is listed and does not count. And the script now refuses to name a
result at all: whether a citation *changed* anything is a judgement about prose, and an entry cited
"only as context, which I did not re-verify" scored identically to one an observation was built
against.

**The lesson is not "count uses, not visits". It is that a measurement whose rule is a regex over
shell commands will be wrong in whichever direction its author is hoping.** Two of the three errors
flattered the treatment; one buried it. Only the reviewer's reading of the raw log settled it.

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

**2. `derived/pin.json` is a patch behind the deployment, and seven rows this run wrote say so
wrongly.** The pin says `3.1007.26`; the arm observed and reported `3.1007.27`. **Every stamped row
this run produced — `KB-055845A3`, `KB-1834ABE5`, `KB-28579C5B`, `KB-ADFD93AB`, and the confirms on
`KB-35A09C64`, `KB-F1542157`, `KB-7E35E6BC` — carries `platformVersion: 3.1007.26`, a version the
deployment was not running.** The first version of this page reported this as one cosmetic row left
unstamped by choice. It was not a choice and it was not one row: `KB-6D5E2CD1` is unstamped because
of the hyphen key, and the other seven are stamped wrong.

This is [pin the source, not the value] failing at its own door. The stamp copies a file nobody
re-extracted after the stand moved, and nothing in the run noticed — the arm noticed, in prose, and
the tool stamped anyway. `kb check --env` exists and was not in the pre-flight. Either the stamp
reads the live version at capture time, or `kb check` is a gate before every run and a red check
stops it.

That is the eighth and ninth instrument defect found by a measured party rather than by this
project's author, and the tenth is the scorer above.

## What this does not show

* **n = 1, one task, no control arm.** It cannot show a capability difference, and it was not
  designed to; three rounds already established that call counts do not move, and the protocol that
  makes them not move is still in the brief for `single-observation` entries.
* **The 4 substantive uses are a floor in one direction and a judgement in the other.** An entry
  that shaped the arm's thinking without being cited leaves no trace (`KB-6824BC2B` nearly did not);
  and "substantive" was decided by reading prose, not by a rule.
* **The task was chosen on ground the register did not cover.** That was deliberate — it is what
  made the sealed prediction falsifiable — but it means this run says nothing about how the register
  performs on ground it covers well, and it is why the changed protocol got no test.
* **Writing is still end-loaded.** All twelve kb-journal rows sit between 12:26:24 and 12:29:30, in
  calls 339–351 of 357, in a run that started at 11:49. The register was read at call 22 and call
  307; nothing was written until the report was being assembled. The treatment changed how the
  corpus is *read*. It did not touch the shape `src/demand.mjs` complains about in its header.
