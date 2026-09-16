# Second independent review — is the architecture of this knowledge base and its tools right?

**Written for a reviewer who has not seen this project.** The first review asked whether the base
made agents better; the answer was no, three times, and that page is still on disk unchanged
(`measurements/REVIEW-BRIEF.md`). **This one asks a different question: given that the outcome
measurements are null, is the thing built the right shape, and what should be built instead?**

Everything below is a measurement or is labelled as an opinion. Numbers that flatter the project are
marked as such. If the honest answer is that this architecture cannot work, say so.

---

## What you are reviewing

| | |
|---|---|
| the tool | `C:/_VIRTO/vc-kb-lab` — `src/` (19 modules), `bin/kb.mjs`, 232 tests |
| the corpus | `C:/_VIRTO/vc-knowledge` — 590 derived, 78 captured, 3 flows, 127 evidence rows |
| the measurements | `measurements/` — nine directories, each a README plus a runnable script |
| every archived run | `MEASUREMENT-archive/` (12 runs) and `C:/_VIRTO/_comparison-logs/` (10 arms) |

Both repositories are git. Everything in this brief reproduces from a script that is committed.

---

## The architecture, as built

**Three planes, two of them written by hand.**

* **derived-first** — the deployment's own contract (REST routes, GraphQL types) projected into
  entries by `kb extract`, regenerated and byte-compared by `kb check`. 590 entries, 3,418
  coordinates. Each REST entry carries `appliesTo: [{module, version}]` — the owning module and the
  version installed on the extracted deployment.
* **experiential** — what an agent learned by doing, written through `kb capture`. 78 active.
* **flow** — procedures, served only by `kb how`, never by `kb ask`. 3.

**Two doors that read.** `ask` searches facts; `how` searches procedures; they read disjoint
corpora. Retrieval is MiniSearch BM25 with a relevance floor. An uncovered question is supposed to
return an explicit MISS.

**One door that arrives.** `hooks/arrive.mjs` is a PostToolUse hook: it reads the coordinate an
agent just touched and hands back what the base holds about it, unasked.

**Gates.** `kb validate` checks entry shape, index/catalog agreement, anchor reachability, scope
axes, and — as of today — whether a written claim contradicts an operation the contract publishes.

---

## What changed since the first review, and what it cost

The first review returned four defects. All four were accepted; two of them corrected claims this
project had published. Since then, in one working day:

| | |
|---|---|
| `kb how` returned the least-bad of three flows for almost anything | fixed: a flow is served only when its **goal** accounts for a majority of the question. Measured on 88 real questions: false hits **17 → 0**, at a cost of 2 false misses |
| `ask` answered procedural questions with facts | fixed: `ask` refuses a question a flow's goal matches and names the verb that serves it |
| a MISS on a code question said nothing | fixed: it now names the owning module, the **installed** version and a fetchable URL |
| the corpus could not say a claim was read from code | fixed: `method: source`, with the version resolved from the derived plane rather than typed |
| the two planes were never compared | fixed: a written claim that the contract refutes is now a notice |
| the demand loop had two outcomes and needed three | fixed: `kb demand buried` records "the answer existed and retrieval did not serve it" |
| nothing turned the loop into work | new: `kb todo` sorts open questions by what closing each would cost |

Tests 173 → 232. The corpus grew 67 → 78 active entries, and its evidence rows went from
**98 observed / 0 from source** to **113 observed / 8 from source**.

---

## The measurements you should not take on trust

Each has a script. Run them; they are read-only and none touches a deployment.

### 1. 78% of the corpus has never been in front of anybody

`measurements/kb-utilization-2026-09/`. Counting the most generous way — ever served in any of 107
retrievals, **or** ever anchored on a coordinate touched in any of 4,223 logged tool calls:

| shape | total | used |
|---|---|---|
| `gql-type` | 303 | **11%** |
| `gql-mutations` | 101 | **15%** |
| `rest-api` | 94 | **29%** |
| **captured (agent-written)** | 78 | **69%** |
| **flow** | 3 | **100%** |

**The plane that is free to generate is the dead one.** 590 derived entries were projected in
minutes; 15% have ever been used. 81 were written by agents at a cost of twelve runs; 70% have.

### 2. The MISS contract stopped holding, and fourteen candidate rules could not restore it

`measurements/kb-missdrift-2026-09/`. The base's own demand log records eight questions it refused.
**It answers seven of them today, and six of those answers are adjacent rather than right** — a tax
question answered with a discount-row entry, a sign-in question with platform GraphiQL.

Fourteen candidates were swept across three axes — term count, term rarity, goal-field gating —
against four negatives, three positives and 34 held-out rows. **Every one either leaves the bad
answers in or throws the good ones out.** The clearest failure: a gate requiring the best hit to
share two goal terms refuses all four negatives *and* refuses the one question the corpus genuinely
answers, because a correct entry can be phrased entirely differently from the question it answers.

### 3. Arrival would have landed first on one subject in nine

`measurements/kb-arrival-2026-09/`. Replayed over all 22 archived logs (4,038 calls), counting only
entries that existed before each run: six arms ever went to platform source, and on **3 of the 9
subjects they went for**, an entry that answers that subject would have arrived first — 5 and 6
calls before two arms that had no base at all. The other six were mechanism in C#, which the corpus
did not hold.

**Adding eleven good entries today moved the arrival rate by two calls in 4,038.** The mechanism
pays only for entries anchored on coordinates agents actually stand on, and the new entries are
anchored on what their claims are *about*. Of the 22 most-visited coordinates across every log, 14
have an entry and 8 do not; the largest gap is `/sign-in` at 20 visits, which is also the subject of
three of the four questions still open in the demand loop.

### 4. Filling the base is the only lever that has moved anything

The eleven entries mined out of the arm reports lead **5 of the 88 questions runs really asked**, and
every one of the 5 is a question they answer. They displaced exactly one answer, on a question
invented for a unit test. That ratio is better than any of the fourteen rules achieved.

---

## Where we think the architecture is wrong (opinion, labelled)

1. **The derived plane is a retrieval liability and an addressing asset.** It is 88% of the corpus
   by count, 15% used, and its wide type tables are what adjacent answers are made of. But it is
   also the only thing that cannot rot, and two of today's fixes — the source door and the
   cross-plane check — work *because* it exists. We think it should stop being indexed for retrieval
   and start being used only as an address book. We have not measured that.
2. **The fingerprint identifies a fact by (anchors, scope).** That refused a legitimate second entry
   today — two unrelated facts about the Admin order screen collided because both were anchored on
   the order route with the same scope. We worked around it by re-anchoring one. A workaround that
   moves a coordinate to dodge an identity rule is how a guess enters a corpus.
3. **Anchors served two masters** — "what this fact is about" and "where it should arrive" — and
   that is now split: `arrivesAt` is a delivery address, outside the fingerprint and outside the
   cross-plane index, retrofitted onto existing entries by `kb arrives`. Nine were applied and
   arrivals over the 22 archived logs went 295 → 316. **We are not confident this is the right
   shape**: it adds a field to a schema whose closedness is load-bearing, and the alternative — that
   arrival should not match coordinates at all — is question 3 below.
4. **Confirmation has no notion of independence beyond an author string.** We added one today after
   an entry confirmed itself: two files read minutes apart by one author had raised it to
   `confirmed`. The fix counts distinct `by` values, and 121 of 127 evidence rows carry no author at
   all, so the rule is nearly vacuous on existing data.

---

## Where we know this is weak

* **The same person builds the tool, writes the bars, runs the measurements and grades them.** That
  is the standing weakness and nothing today changed it. What limits the damage is that every bar is
  committed as data and every number has a script.
* **Two silent failures were found by losing work, not by a check.** `kb todo` reported "the demand
  loop is empty" for a base that did not exist, and exited 0. `kb capture` pointed at the same path
  *created* the base and reported success — three entries went to a phantom directory and were
  noticed an hour later because a count came up short. Reading verbs had obeyed the
  base-vs-coverage rule since the first week; nothing that wrote did.
* **A coverage probe written for this brief gave the wrong answer twice** before it was right, both
  times in the reassuring direction, because it normalised route parameters differently from the
  index. It was caught only by spot-checking a result that looked too bad to be true.
* **n = 1 per arm per round**, three rounds. The noise band on comparable work is 83–319 tool calls.
* **No run has ever been executed with the arrival hook enabled.** Every comparison measured
  unprompted recall of a tool, which is near zero for everything.

---

## What we would like from you

1. **Is the three-plane split right?** In particular: should the derived plane be in the retrieval
   index at all, given 15% utilisation and its role in adjacent answers?
2. **Is there a retrieval shape we have not tried?** Fourteen rules failed. We believe the missing
   idea is that what an entry *claims to answer* should outweigh what its body mentions, but every
   goal-field rule we measured destroyed good rows. Is the answer a different index, a different
   scoring model, or is retrieval the wrong frame entirely?
3. **Is arrival-by-coordinate the right mechanism**, or is the addressing problem — a fact belongs
   where it is *needed*, not where it is *about* — fatal to it?
4. **What tool is missing?** We have verbs for writing, reading, gating and planning. The loop that
   has never closed by itself is confirmation: 23 observations have been served and never confirmed
   or disputed by a second party.
5. **Should the corpus be pruned?** 527 entries have never been in front of anybody. We have not
   deleted anything, because deleting would break comparability with three rounds already measured
   against this corpus.

## What we are not asking

Not whether the code is good. Not whether to keep going. Not for encouragement. If the honest answer
is that a corpus of this shape cannot beat an agent with a browser and a source MCP, we would rather
hear it now than after a fourth round.

## Two hard rules while you look

1. **`kb ask` and `kb how` WRITE** — they append a demand row. To probe without changing anything,
   copy the corpus and pass `--base <copy>`, and pass a drive-letter path: exporting
   `MSYS_NO_PATHCONV=1` under Git Bash silently sends writes to a phantom directory, which is how
   three entries were lost today.
2. **Do not run anything against the deployment.** Every number here came from a live B2B stand that
   other people use.
