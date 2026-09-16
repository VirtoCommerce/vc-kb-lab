# Update for the reviewer — your leading finding conceded, and two of your five questions answered with numbers

Sent after your review. Everything below reproduces from a committed script. Nothing ran against the
deployment. Read in this order; the first item is the one that changes what the rest is worth.

---

## 1. Provenance: conceded in full, and the data now says what you said

`ERRATUM-2-2026-09-16.md` is the written concession; this is the short version.

Verified independently before accepting it: `grep` of `by: round` across `captured/` against
`git log --diff-filter=A` per file. All fifteen files entered git on 14–16 September. No arm ever ran
a writing verb.

**Changed.** `--by` and `--at` are refused at the CLI; the tool sets both, `by` from the session
identity. `--from <path>` records the artefact a claim was read out of, and the path must exist.
`partiesOf` counts `from` ahead of `by`. The fifteen rows were relabelled by a committed migration
(`scripts/relabel-transcriptions-2026-09-16.mjs`, dry-run by default, refuses if a report it would
name is missing). 232 → 240 tests, three of them changed rather than made to pass: each had been
getting its second party for free.

**Both numbers you called are zero, and are retracted in the brief, the erratum and the code comment
that quoted one of them.**

| as published | honest |
|---|---|
| mining eleven entries moved arrivals by two calls | **0** — 244 before, 244 after |
| nine delivery addresses moved arrivals 295 → 316 | **0** — 244 → 244 |

**Where we did not follow you, and it is one line if you disagree.** You say the corpus may hold
"arm B's report says X" but not "arm B confirmed X", and treat the three `confirmed` entries as
resting on one party. After relabelling they rest on the **artefact**: three distinct reports, each
on disk, each openable. Your own text calls `KB-27B4CD10` rediscovered by two armless arms and
`KB-5ADBFB34` by three, and names that the only uncontaminated demand signal here — so we read the
rediscoveries as real and the recording as what was false. If you still disagree, `partiesOf` in
`src/provenance.mjs` is the one line.

## 2. Three instruments that had been reading the typed field

* **Birth dates** took the *first* `at:` in a file rather than the earliest, and trusted it. Neither
  source is authoritative alone — git cannot be typed, but this corpus was created 2026-09-14 with 77
  entries imported on day one, written during runs days earlier, so git is far too late for those.
  The rule now splits the cases and reports which source answered for how many. It lives in
  `measurements/lib/birth.mjs` because it was wrong once. Pre-existing arrivals: 244, reached
  independently of the relabelling.
* **The MISS bar** (your finding 2). The tax negative is retired, not moved to the positives: an
  entry whose `question` was copied from the query would score as a hit for the wrong reason, and
  `kb todo` guarantees more of them. The bar carries `VALID_AT` and re-validates itself through
  `checkStale` before the sweep prints. The header follows the bar instead of hardcoding `/4`. Read
  honestly, `df ≤ 1` refuses 3 of 3 and loses 32 of 34 anchors — your correction, and the conclusion
  is unchanged.
* **Utilization** (your finding 5). Build sessions excluded: 4,013 calls and 104 retrievals, which
  now agrees with the arrival replay's 4,013. Headline unmoved at 78.0%, as you predicted.

## 3. Rediscovery, built and measured — your proposed outcome measure is not null

`measurements/kb-rediscovery-2026-09/`. Your reasoning restated: a corpus that instructs
re-verification cannot save its reader calls, so three rounds measured a quantity the design forbids
from moving.

| population | events | distinct facts |
|---|---|---|
| **parties that never had the base** | **15** | **7** |
| parties that had the base | 34 | 22, of which **22 were served first** |

`KB-6AA0D7FB` — fixed-rate shipping prices per option through a store setting, and an unset setting
is free — was re-established by **four** separate parties across two rounds. All seven are
deployment-specific surprises; none is derivable from a schema.

**One correction to your reading.** You cite `KB-5ADBFB34` as rediscovered by three arms. It is
excluded: that entry was born after all three rounds and written out of their reports. Three parties
*discovered* it. That is evidence a fact is worth holding, not evidence that holding it paid, and
counting it would credit the base for what it learned from the party measuring it. `KB-0C102D97`,
`KB-132A40B3` and `KB-BF730613` go the same way. The birth filter removes the class mechanically.

The judgement of which report restates which fact is **data in the script** — party, entry, report
section, and what that section says — so a row is disputed by opening that section. The rest comes
from `from:` rows and from confirm calls in the runs' own journals.

Second row of that table is your finding 7, quantified: 22 times the base served a fact and the
party went and established it anyway.

## 4. Your question 3, answered against the archive: a topic is not an address

We tested grouping entries by subject and firing arrival on the topic rather than the exact
coordinate — the generic version of the hand-applied `arrivesAt` you called the wrong shape. Over
3,392 archived tool calls:

| addressing | fires on | distinct written entries surfaced |
|---|---|---|
| exact coordinate | 1.8% of calls | 13 |
| topic | **33.7% of calls** | 18 |

Nineteen times the interruptions for five more entries. **Anything that fires on one call in three is
wallpaper.** Arrival stays coordinate-keyed, with your three filters — written entries only, not on
a `DELETE`, once per coordinate per session — which take it from 292 events to **37**.

## 5. Your question 2, taken up: the catalog now has sections

The catalog goes into the prompt, as you proposed. Two things we learned building it:

* **The constraint is not the window.** 89 rows, 13.8 KB, ~3,400 tokens, 1.7% of a 200k window;
  there is room for a thousand rows in a tenth of it. What fails is the reading.
* **So the fix is sections, not a size limit.** `members & accounts 23 · promotions & discounts 19 ·
  orders & shipments 14 · catalog & products 11 · lists & sharing 5 · cart & checkout 3 ·
  stores & tax 2 · unfiled 1`. Within a section: disputed first, then by confirmations. **The whole
  catalog was sorted by id until today, and an id is a hash** — invisible while nobody reads the list
  in order, which is exactly what your proposal asks them to do.

Filing is derived, not declared, and **printed in the catalog**, so a wrong filing shows up in the
artefact. Both misfilings we have found so far were found that way, by reading the generated file for
a minute. One entry stays `unfiled` rather than getting an eighth topic invented for it.

There is a size threshold too (`src/catalog-budget.mjs`), labelled a guess where it is defined and
again where it is read, and due to be replaced: **the next run records the catalog position of every
entry the agent opens**, which measures where attention actually falls off for the cost of a run we
are spending anyway.

---

## What we would still like from you

1. **`partiesOf`** — item 1 above. The one place we read your finding differently.
2. **The run's design.** Arm C gets the sectioned catalog in its prompt and no `kb ask`, per your
   question 2; the question is whether it opens entries, and whether it rediscovers what was in the
   list. Executable refutations come after, not before, so the run is not spent on a mechanism built
   on a structure the run might reject. Tell us if that ordering is wrong.
3. **Anything in section 3** you would count differently. It is the only outcome measure this project
   has that is not null, which makes it the one most worth attacking.
