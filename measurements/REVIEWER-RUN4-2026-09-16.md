# Round four ran. The result, and the confound you should attack first

Your four conditions were met and the run is in
`C:/_VIRTO/_comparison-logs/round4/arm-C-catalog` — tool log, kb journal, the arm's `REPORT.md`, and
`CLAUDE.md.as-handed`, the exact register it was given. Everything below reproduces:

```
node measurements/kb-run4-2026-09/score-opens.mjs \
  --log C:/_VIRTO/_comparison-logs/round4/arm-C-catalog \
  --catalog C:/_VIRTO/_comparison-logs/round4/arm-C-catalog/CLAUDE.md.as-handed
```

One arm, 357 tool calls, 42 minutes, on `/api/pricing` — chosen by `pick-task.mjs`, which reads the
contract and the 22 archived logs and never opens `captured/`.

---

## Attack this first: the metric was instructed

**The brief told the arm to cite.** It says an entry that is `confirmed` "may be acted on and cited
without re-verifying it. Cite it as `@kb(<id>)` and move on." Then I counted citations and called
them use. That is not the oracle error again — the task was not drawn from the corpus — but the
*metric* was named to the subject in advance, and you were right about the last one before I saw it.

What I would say against myself, and you should weigh it rather than take it:

* The instruction standardises how a use is *recorded*; it does not manufacture a use. An arm that
  read the list and found nothing in it would have cited nothing.
* Three of the eight are `confirm` rows in the kb journal, written by the tool, not prose.
* One of them is substantive rather than ritual: the arm's sharpest finding is built by
  **contradicting** `KB-AD1FA66B` — *"that holds for the promotion layer and not for the unit price
  underneath it"* — an entry it had not verified. A citation convention does not produce that.

If you think the citation count has to go, the number that survives is **3 confirms + 1 open**, and
it should be said that way.

## The result

The stopping rule sealed in `SEALED-RELEVANCE.md` — zero opens, or opens followed by re-establishing
everything anyway — did not fire.

| | |
|---|---|
| register entries used | **8 of 92** |
| cited as the reasoning for an answer | 7 |
| confirmed against what the arm saw | 3 |
| opened as a file | **1** |
| **used without ever being opened** | **7** |

Seven of eight from the one-line claim alone, with no query involved. That is the treatment, and it
is the thing three rounds of a search tool did not produce.

**Sealed prediction:** 5 of 8 predicted entries used; 3 used that were not predicted; 3 predicted and
missed. It predicted the register holds nothing about price lists — correct. It predicted **2–6
opens**, and the answer was 1 open and 8 uses: **the prediction named the wrong verb**, which is the
same mistake the scorer made below.

**Attention did not fall off.** Deepest row reached: 78 of 92, including the last section. The row
budget in `src/catalog-budget.mjs` is still a guess, but 92 is evidently not near the limit.

## The scorer would have reported a failure, and I caught it rather than you

Its first version counted **opens**, against the **live** corpus rather than the handed catalog. That
returned 2 opens — one of them an entry the arm had written itself minutes earlier — and 0 of the 8
predicted. Read that way this run is a dead mechanism.

Fixed: it scores against the archived handed artefact, ignores ids that were not in it, and counts
citation and confirmation alongside opening. **An instrument that counts only visits reports a
working mechanism as dead.** Recorded in the script's header rather than quietly corrected.

## Your conditions, one by one

1. **Oracle from outside the corpus, relevance sealed.** Done, and the prediction was half wrong in
   public. The task area was chosen mechanically; `SEALED-RELEVANCE.md` predates the run.
2. **Protocol changed for `confirmed` entries.** Done, and it is visible in the output: four entries
   were acted on without re-verification, three were verified, and the finding that matters came
   from contradicting one of the four.
3. **Position and section recorded.** Done — `kb show` was added so an open is an event rather than
   something parsed out of shell commands.
4. **Arrival hook off.** Off. Its three filters remain unbuilt, deliberately.

## What the run found on the platform, and on this project's tooling

Five new entries on ground the register did not cover. One of them is the arm **superseding itself**:
it claimed a cart line's price is fixed at mutation, went back to its own timeline, found the last
mutation wrote 111.11 while a later read served 399.99, and replaced the claim — keeping the
divergence established and marking the mechanism **not** established rather than guessing.

Two defects in my tooling, both found by the arm:

* **The brief typed the deployment key and typed it wrong** — `vcptcore-stable` against the pin's
  `vcptcore_stable`. The tool warned correctly that it could not stamp a version; `supersede` would
  not let the writer repair it. Fixed at the source: the brief now reads the key from
  `derived/pin.json`.
* **`derived/pin.json` is a patch behind the stand** — 3.1007.26 against 3.1007.27. So that row was
  left **unstamped** rather than given the pin's version: stamping a version the deployment is not
  running, to tidy a cosmetic gap, writes a wrong fact into the corpus.

## What this does not show, said before you say it

* **n = 1, one task, no control arm.** It cannot show a capability difference and was not built to.
  Call counts still cannot move for `single-observation` entries, by design.
* **8 uses is a floor**, and also a number from a single session with an instructed metric.
* **The task was set on ground the register does not cover.** That made the prediction falsifiable
  and it means this says nothing about performance on covered ground.

## What we would like from you

1. **The confound at the top.** Does the citation count stand, or is the result 3 confirms and 1 open?
2. **What the next run should hold constant.** The obvious second run is the same treatment on ground
   the register covers well — but that reintroduces exactly the commissioning you caught, unless the
   task still comes from outside. We do not see how to have both and would rather ask than invent.
3. **Executable refutations, now or not.** They were deferred until after this run on your advice.
   The run gives a reason to build them — four entries were acted on unverified, and what makes that
   safe is mechanical re-observation — and a reason to wait, which is that one session is thin
   evidence for building anything.
