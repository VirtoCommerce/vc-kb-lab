# Second independent review — response

Reviewer: a fresh agent (Claude Fable 5.1) with read access to `C:/_VIRTO/vc-kb-lab`,
`C:/_VIRTO/vc-knowledge` and `C:/_VIRTO/_comparison-logs`. Nothing was run against the
deployment. Every `ask`/`how` probe went through the module API or against a copy of the corpus
(`demand.jsonl` md5 `af138c54…` before and after). The sealed predictions were not opened.

Every finding below is marked **verified** (I ran it or read it) or **suspected** (a reading I
could not test). Where a number on the brief did not reproduce, that is said first.

---

## The thing I would change first

**Stop feeding the instrument by hand.** Eleven confirmations and seven whole entries in the corpus
carry `by: roundN-arm-X` with timestamps like `2026-09-15T09:00:00.000Z` and
`2026-09-15T10:20:00.000Z`. No arm ran `kb confirm` or `kb capture` in any round (the commit
message of `vc-knowledge@f51276e` says so itself). Those rows were typed on 2026-09-16 by the
author, reading arm reports, and dated to when the arm ran. **Verified**: grep of `captured/*.md`
for `by:` rows whose `at:` ends in `:00:00.000Z`; `git show f51276e`.

That one practice corrupts three instruments at once:

1. **Trust.** `experientialTrust` in `src/resolve.mjs` counts distinct `by` values as independent
   parties. `KB-0C102D97`, `KB-5ADBFB34` and `KB-5F7C8FC4` are `confirmed` at 3–4 today on the
   strength of the author's transcription of what three arms wrote. That is one party, not three,
   and it is exactly the self-confirmation the rule was written to stop.
2. **The arrival replay's honesty rule.** `replay-logs.mjs` counts an entry as pre-existing if its
   first `at:` predates the run. `KB-5790A068` was created on 2026-09-16 from round two arm A's
   report and dated `2026-09-15T09:30`. Round two arm A started at `12:43Z`. The replay therefore
   shows `KB-5790A068*` arriving at arm A's call 62 and arm B's call 84, as help that existed before
   the run. It did not exist. **Verified**: `--detail` output; `head -1` of both tool logs.
3. **The brief's own numbers.** "Adding eleven good entries today moved the arrival rate by two
   calls" — I reran the replay against the corpus at `560bd4c` (before mining) and `5db0625`
   (after): pre-existing arrivals went 244 → 246. **Both of the two are `KB-5790A068`**, the
   backdated entry. Under the script's own rule, the honest number is zero.

The fix is one line of policy and one line of code: `by` is written by the tool from the session
identity (the tool log already carries `CLAUDE_CODE_HOST_SESSION_ID`), never typed; and a row
transcribed from a report says `by: <transcriber>`, `from: <report path>`, dated when it was typed.
The corpus can hold "arm B's report says X" — it must not hold "arm B confirmed X".

---

## What reproduced and what did not

| brief claim | reproduces? | what I ran |
|---|---|---|
| 78 active entries, 232 tests | yes | `kb stat`, `npm test` |
| utilization: 78.5%, "captured 78 / 69%" | **no** — 78.0% / 89 captured / 67% | `utilization.mjs` |
| utilization: 4,223 calls, 107 retrievals | **no in substance** — 210 calls and 3 retrievals are the author's own tool-building sessions (`MEASUREMENT-archive/build-session-*`) | `readdirSync` walk mirroring the script; see below |
| MISS sweep: "df ≤ 1 refuses 4", "gate ≥ 2 refuses all four negatives" | **no** — 3 and 3 | `sweep.mjs --why` on live base, on `560bd4c`, on `5db0625` |
| arrival: 3 of 9 subjects, one entry, 4,038 calls | subjects yes; calls 4,013 (the 25-call aborted arm was counted in the header, excluded in the loop) | `replay-logs.mjs` |
| arrival: "295 → 316" after `arrivesAt` | the raw count yes; **the pre-existing count is 246 → 246** | replay against `5db0625` vs live |
| retrieval baseline: 0 of 34 lost, 3 of 5 wanted served | yes | `replay-questions.mjs` |

While this review ran, `REVIEW-BRIEF-ARCHITECTURE.md`, `utilization.mjs` and the arrival README were
edited on disk and `ERRATUM-2026-09-16.md` appeared. The erratum's four items (retired entries split
out, 4,013 calls, the inventory line, the source door having had zero occasions) are right and are
not repeated as findings below. The erratum itself quotes "246 on entries that existed before their
run" as unchanged — which is the number that makes the `arrivesAt` gain zero (finding 1) — while
the brief still reports "295 → 316" as an improvement. The build-session ingestion, the hand-dated
confirmations and the tax negative are not in the erratum.

---

## Findings, in order of value

### 1. The `arrivesAt` change delivered nothing measurable, and the brief reports it as a gain — verified

`vc-knowledge@a36eef9` adds nine delivery addresses and reports "Arrivals over the 22 archived logs:
295 → 316". All 21 new arrivals are on entries born 2026-09-15 17:30 or later (the sign-in entries,
`KB-1B18B821`, `KB-BF730613`, …), so the replay's pre-existence filter removes every one of them:
**246 pre-existing arrivals before, 246 after.** The brief's headline measurement uses the filtered
number; the one change the author made the same afternoon is reported with the unfiltered one.
Opinion 3 in the brief ("we are not confident this is the right shape") is correct, and the data
already says so: nothing has been shown to arrive by delivery address that would not have arrived
anyway.

### 2. The MISS-drift bar went stale inside one working day, and the sweep now punishes the right answer — verified

`bar.mjs` lists *"how is tax calculated on orders in this deployment"* as a negative "because no
entry describes tax calculation". At `2026-09-16T08:13Z` (12:13 local, one minute before commit
`560bd4c`) the author captured `KB-1B18B821`, whose `question` field **is that sentence verbatim**.
The sweep's control row now serves `KB-1B18B821` first and the README (11:55 local) and the brief
(13:15 local) still say the question is "answered with a discount-row entry". Every candidate in
the table is now docked a point for serving the entry that answers the question.

Two things follow. First, a negative defined as "nothing in the corpus answers this" is a property
of the corpus, and the corpus changes with every capture; the bar has no re-validation step, so it
was wrong within two hours of being written. Second — more important — `kb todo` tells the writer
to word the capture's `question` **exactly** as the demand row, "or the row stays open"
(`src/todo.mjs`). That rule manufactures entries whose `question` field is a verbatim copy of a
logged query. Any future measurement of "does matching on the `question` field help" will score
those rows as hits **for the wrong reason**: the field was written to match the test. The tax entry
is the first instance; the loop guarantees more.

### 3. The MISS drift is not a derived-plane problem — verified

Opinion 1 says the derived plane's "wide type tables are what adjacent answers are made of". In the
sweep's own control output, the adjacent answers served for the four negatives are `KB-D60012DB`,
`KB-6824BC2B`, `KB-EF3CB7FB`, `KB-E17E4CEF`, `KB-5ADBFB34`, `KB-AD1FA66B`, `KB-35F20D97`,
`KB-E7790BF6` — **eight written entries and one derived** (`KB-C0B7076C`). I re-ran the same
questions against the written plane alone (`captured-index.json` only, same floor): the sign-in
question still returns the same three unrelated written entries; the tax question the same two.
Removing the derived plane from `ask` does not restore the MISS contract. The crowding measured in
`kb-retrieval-2026-09` (type tables burying `gql-type-carttype`) and the drift measured in
`kb-missdrift-2026-09` (written entries sharing nouns) are two different defects with two different
sources, and the brief has merged them into one argument against the derived plane.

### 4. Arrival, as replayed, is mostly noise the agent would learn to skip — verified

From `replay-logs.mjs --detail` over 246 pre-existing arrival events:

| | count |
|---|---|
| events fired on a `DELETE …` cleanup call | 122 (50%) |
| events offering only derived entries — the route table for the route being called | 92 (37%) |
| distinct entry-sets per run, summed | 99 of 246 |

In round three arm A, 11 of 14 events are the members/users delete routes during teardown; the one
event that mattered (`KB-27B4CD10` at `/company/members`, call 8) is one line among fourteen near-
identical blocks. The hook has no session memory by design ("nothing is remembered",
`src/arrive.mjs`), so `/cart` produces the same three entries every time it is visited — run 10
would have seen the promotion flow offered 20 times. And every block ends by telling the agent the
entry is "one observation until someone else confirms it", which is an instruction not to act on
it. A mechanism that repeats itself and disclaims itself will be tuned out within a run.

Two implementation facts, also verified:

* `hooks/arrive.mjs` calls `buildArrivalIndex(BASE)` on every invocation — 682 file reads per tool
  call. Measured: ~300 ms per call against a bare `node -e 0` of ~100 ms. The comment in
  `src/arrive.mjs` says the index is passed in precisely so this does not happen; the hook is a
  fresh process each time, so the intent is not met. Tolerable at 100–300 calls a run; not what the
  code claims.
* It fires on **writing** about a coordinate (it fired on my own shell command that contained
  route strings). An agent editing a report that mentions `/api/order/customerOrders` gets the order
  route table pushed at it.

### 5. The utilization denominator includes the author — verified

`utilization.mjs` walks every directory under `MEASUREMENT-archive/`, including
`build-session-c842f27b`, `-part2`, `-part3`: the author's sessions building the tool on
2026-09-10/11. That is 210 of the 4,223 replayed calls and 3 of the 107 retrievals. Excluding them
and the 11 retired entries: 4,013 calls, 104 retrievals, **78.1% never touched**, captured-active
73%. The headline barely moves; the principle does — "in front of anybody" currently includes the
person who wrote it.

### 6. "34 anchors real runs used" is weaker than stated — verified from the harness's own data

`questions.mjs` marks 6 rows `NOT-USED` and 3 `UNANSWERED`; 2 questions appear twice (r1.3/r1.4,
r1.8/r1.9) so a loss there counts double; the anchor is baseline rank 1, which the README itself
says was wrong on four rows. So "anchors lost / 34" measures **ranking stability against a
2026-09-14 snapshot**, not usefulness. The sweep rejects every rarity candidate on this metric ("df
≤ 5 loses sixteen of the thirty-four entries real runs read and acted on"); at least a quarter of
those sixteen were never acted on by anyone. The conclusion that no rule pays may still be right;
the metric it rests on cannot show it.

### 7. The trust protocol guarantees the null result on call counts — verified from round three

Round three arm C asked the base at call 2 and was served `KB-27B4CD10` first (kb-log
`734da64c`). It then spent six source-MCP calls and downloaded the deployed bundle to establish the
same fact. That is rational behaviour under the base's own protocol ("a lens, never ground truth…
verify in proportion to blast radius") and under the arrival hook's text. **A corpus that instructs
its reader to re-verify cannot save its reader calls.** The comparisons measured a quantity the
design forbids the base from moving. Until confirmation is real enough that the protocol can say
"act on `confirmed` entries without re-checking", call counts will stay null whatever the corpus
holds.

### 8. The demand log cannot tell an agent from its author — verified

`demand.jsonl` rows carry no `by`. 97 `ask` rows, 70 `dropped`; at least 10 drop reasons say
"probe", "smoke test", "not a run's question". Of the 88 questions in `kb-flowmiss-2026-09/
questions.json` — described as "every one anybody has ever really asked this base" — 9 were later
dropped as author smoke tests or probes, and 42 were asked on 2026-09-14, the day the flow plane
was built. The flow-goal rule was therefore scored partly on questions its author typed while
building it. The README caught five such rows and froze the file; it did not catch the earlier ones.

### 9. Identity by (anchors, scope) is the wrong shape for facts — suspected, agreed with the brief

`fingerprint()` in `src/capture.mjs` hashes coordinates and scope. `experientialNeighbours` in the
same codebase says "two entries sharing a coordinate are usually two honest facts about one place,
and that is the normal state of a working corpus". Both cannot be the design. The 19-pair
measurement showed wording cannot *separate* duplicates; it did not show location *can*. The gate
already shows neighbours before a write; make the collision advisory (like neighbours) and drop the
refusal. A refusal that writers route around by moving anchors is worse than a duplicate.

### 10. Smaller items — verified unless marked

* `bornAt` in `replay-logs.mjs` takes the **first** `at:` in the file, not the earliest; two
  entries (`KB-0C102D97`, `KB-5ADBFB34`) have a later row dated before the first. Harmless today;
  wrong by construction.
* The brief's "eleven entries lead 5 of the 88 questions" includes the tax row above, which leads
  because its question is the query.
* `test/kb.test.mjs:124` names the live corpus path. Suspected: a test bound to live data changes
  meaning with every capture. I did not trace what it asserts.
* `kb ask` on a bare word that is also a GraphQL type name (`Promotion`) would resolve by
  coordinate if coordinate lookup were added naively; structure must be required, as `arrive.mjs`
  already does. Noted because I hit it in the experiment below.

---

## The five questions

### 1. Should the derived plane be in the retrieval index?

**No, and the reason is not the one the brief gives.** Not because it makes adjacent answers
(finding 3 shows it mostly does not) but because free-text search over it solves a problem the
agent does not have. An agent that asks "what fields does `CartTotalType` have" already knows the
coordinate; introspection or one `GET /docs/*/swagger.json` answers it authoritatively and the
derived entry is a cached copy of that. What the derived plane is uniquely good for is exactly what
the brief says: **resolving** — module and installed version for a MISS, the cross-plane
contradiction check, anchor reachability. All three are keyed lookups by coordinate, none needs
BM25.

I measured the cheapest version of the alternative on the 34 held-out rows (script in my
scratchpad; numbers below are from it, against a copy of the live base):

| how the row's anchor would be reached | rows |
|---|---|
| anchor is a **derived** entry | 15 of 34 |
| reached by an **exact coordinate named in the question** (`CartTotalType`, `Mutations.addItem`, `OrderDiscountType`) | 8 |
| reached by BM25 over the **written plane only**, same floor | 18 |
| reached by either | **26 of 34** |

The 8 rows lost: r1.1 (procedural, and its anchor is a route table), r1.3/r1.4 (one question,
"which mutation adds a product" — vocabulary), r2.1 (`UNANSWERED` in its own run), r2.4 (a flow;
`how` serves it), r3.2, r3.3, r7.3 (type tables named by paraphrase). Every one is a contract fact
an agent can get from the contract. So: exact-coordinate lookup for the derived plane, and the
derived plane leaves the free-text index. Nothing is deleted.

### 2. Is there a retrieval shape you have not tried?

**The shape you have not tried is no retrieval.** The active written plane is 78 entries, 149 KB of
markdown; its catalog (`captured-catalog.md`, id + subject + confirmations + scope) is 13.8 KB,
roughly 3,500 tokens. That fits in a system prompt with room to spare. Hand the agent the catalog
of the written planes at session start and let it open entries by id. The "MISS contract" then
becomes the agent's judgement over a list it can read in full, which is the one judge that every
rule you swept could not replace (your own `kb todo` already concedes this: "no rule measured here
can make that judgement and a reader can make it in a second").

Fourteen rules failed because the failure is vocabulary (*promotion* vs *discount*, *edited* vs
*changing*) and BM25 cannot bridge vocabulary; a floor can only refuse. If the written plane ever
outgrows a context window (several hundred entries), the standard answer is an embedding index over
`subject` + `question` with a few paraphrased questions generated at capture time, not another term
rule. At 78 entries that is machinery for a problem you do not have.

One caution about the catalog-in-context approach: the QA-repository arm never opened its
repository. But that repository was files on disk, not text in context, and the catalog is a list of
78 one-line claims, not a tree to explore. The right next comparison is exactly this: arm C gets the
catalog in its prompt, no `kb ask`, and the question is whether it opens entries.

### 3. Is arrival-by-coordinate the right mechanism?

**Right idea, wrong scope, wrong delivery.** The judged number — 3 of 9 subjects, one entry — is
real and it came from a written entry anchored on a page URL. Derived entries should never arrive:
92 of 246 events offered the agent the route table for the route it was calling. Cleanup calls
should never trigger: 122 of 246 were `DELETE`s during teardown. And the hook needs a session
memory keyed on the host session id so a coordinate arrives once. With those three filters the
replay's 246 events collapse to a few dozen, most of them the ones that mattered.

On `arrivesAt`: the data says it has not helped yet (finding 1). The idea — a fact is needed where
you meet the symptom, not where it is about — is right; the schema field is the wrong place. It is
a **judgement about the reader**, and it belongs beside the entry as a delivery rule, not inside a
schema whose closedness you rely on. The nine addresses were also chosen by the author looking at
where arms went, which is the same person-in-the-loop that the rest of the design tries to avoid.

### 4. What tool is missing?

**Not a verb. Two things, neither of which is a tool in the sense you mean.**

First, **provenance the tool sets and the writer cannot** (the change I would make first). Until
`by` comes from the session, "23 served and never confirmed by a second party" cannot be
distinguished from "confirmed by the author under a second name", because that is what 11 rows
already are.

Second, **executable refutations**. Every entry carries `refutableBy: observation` and anchors,
but the refutation is prose. For entries scoped to `rest`, `graphql` or `storefront-xapi` — by my
count roughly two-thirds of the 78 — the refutation is a request and an expected shape: "`GET
/api/members/{id}` returns `passwordHash` non-null", "`Query.cart` requires `storeId`". Store the
probe with the entry and give `kb check --env` a second half that re-observes written claims the
way it already re-derives the contract. Confirmation stops being a social act nobody performs and
becomes a regression suite. UI observations stay prose and stay single-observation, honestly. This
is the one thing that could make finding 7 go away: an entry that has been mechanically re-observed
at the current pin is one the protocol can tell an agent to act on.

### 5. Should the corpus be pruned?

**Un-index, do not delete.** The comparability argument does not hold: the three rounds were null
on every capability measure, so there is no positive result to stay comparable with. Deleting is
still wrong, for the resolving reasons above. Stop growing the derived plane by projection, take it
out of `ask`, keep it as the address book the source door and the cross-plane gate already read.

---

## Is the frame wrong?

**As "a knowledge base for QA agents", yes.** A corpus cannot beat a browser plus a source MCP on
facts that are derivable from the contract or the code, because those are a fetch away and
authoritative, and every arm knows it. That is what three null rounds say and a fourth will say
again.

But look at where every demonstrated value event sits: the Active column reads contact status not
account state; `CombinePolicy` is `BestReward` so only one promotion applies whatever `isExclusive`
says; two endpoints disagree about whether a password hash is a secret; tax is zero because no
provider is active on this store. **None of those is in the contract or the code. Each is a fact
about this deployment that contradicts what the contract or the code would lead you to expect.**
Those are the facts that were independently rediscovered — `KB-27B4CD10` by two arms that had no
base, `KB-5ADBFB34` by three — which is the only demand signal in this project that is not
contaminated by its author.

So the right frame is smaller and sharper: **a register of this deployment's surprises, keyed by
where you meet them.** Dozens of entries, not hundreds. No retrieval; a catalog in context and
arrival on written entries only. Measured not by tool calls but by **rediscovery avoided**: how
many times did a later run re-establish a fact that was already written? That number is computable
today from the archive and the arm reports, and it is the one outcome measure this project has that
would move if the corpus worked.

Under that frame the derived plane is not a plane at all; it is infrastructure — the coordinate
system the register is keyed on, and the thing a written claim is checked against. Which is, read
carefully, what the brief's first opinion was reaching for.

---

## Corrections the brief still needs, beyond the erratum

* Measurement 1: state that 210 calls and 3 retrievals in the count are the author's build sessions,
  or exclude them (the edited `utilization.mjs` still walks `build-session-*`).
* Measurement 2: the tax negative is now answered correctly by `KB-1B18B821`; the table's "refuses 4"
  rows are 3; and `bar.mjs` must say which commit it was valid at.
* Measurement 3: replace "two calls in 4,013" with zero, and say why; delete or qualify "295 → 316"
  — the erratum's own "246 unchanged" is the number that settles it.
* The evidence-row provenance: say plainly that eleven `by: roundN-arm-X` rows are transcriptions
  typed on 2026-09-16, and stop counting them as independent parties.
* "Opinion 1": separate the crowding defect (derived, measured in `kb-retrieval`) from the drift
  defect (written, measured in `kb-missdrift`); the second is not an argument against the derived
  plane.
* The erratum's item 4 and finding 3 here are one finding: the door has no occasions because
  written entries sharing nouns answer everything, so un-indexing the derived plane will not open it
  either.

---

## On the erratum itself

Its last section asks to be told that an author correcting their own page hours after sending it is
the standing weakness in action. It is, but that is the less useful thing to say about it. The
useful thing is the **shape** of what it caught and what it missed.

All four items it found are arithmetic: a denominator that counted retired files, a call total that
predated a rewrite, a directory count, a script scoring a redirect as a miss. Those are the errors a
script rerun catches, and a rerun by anyone would have caught them; the author's re-derivation was
sufficient and independence added nothing.

Everything it missed is a judgement about whether a row should count at all: whether a transcribed
report is a confirmation, whether the author's build sessions are "anybody", whether an entry
written to close a demand row makes that row a valid negative, whether arrivals on entries born
after the run are a gain. Item 2 even re-derived the exact number — 246 pre-existing arrivals,
unchanged — and read it as reassurance that "everything computed from it is unchanged" rather than
as the number that zeroes the same afternoon's headline. Self-reproduction re-runs the script; it
does not re-ask the question the script encodes, because the same person wrote both.

So the honest verdict on the erratum: it was worth sending, it freed this review from four cheap
corrections, and it is evidence of exactly the limit it names — a party that can reproduce its own
arithmetic and cannot audit its own categories. The remedy is not more re-derivation. It is the
first change above: stop letting the author's hand into the data, so that the categories the
scripts encode are not the author's to set.

---
---

# Part two — reply to `REVIEWER-UPDATE-2026-09-16.md`

Same reviewer, same rules. Everything marked **verified** was run against the live base read-only
(scripts that use neither `ask` nor `how`) or against a fresh copy. Tests: 252 pass, not the 240 the
update says; more landed after it was written.

## The three things you asked for

### 1. `partiesOf` — accept, with two conditions and one inconsistency to fix

Accept the artefact rule. Three arms observing the same store on the same day are three
observations; one person copying them is a recording defect, not a party count. The three entries
may stay at `confirmed`. Two conditions:

* **`from` must name a section, not a file.** `RESTATED` in `rediscovery.mjs` cites `section 4`,
  `section 2`; the fifteen corpus rows cite `…/round2/arm-B/report.md` whole. The README's promise
  that "a row is disputed by opening that section" is kept by the script's table and not by the
  corpus. Write `from: <path>#<section>` and make `transcriptionSource` check the anchor exists.
  **Verified** by reading both.
* **A `from` whose artefact was produced by the writing session is not a second party.** Today
  `from ?? by` lets one session count twice: once for a row it typed unaided, once for its own
  report. Not present in the data now; one line to prevent.

The inconsistency: `src/coordinates.mjs` lines 66 and 123 still count independence as distinct
`by` plus anonymous rows. After relabelling, all fifteen rows carry `by: session:09e39416`, so the
arrival index ranks `KB-5F7C8FC4` as one party while `ask` reports three. Two notions of
independence in one base is the thing `partiesOf` was written to end. Import it there.
**Verified** by grep; the uncommitted `arrive.mjs` diff does not touch it.

### 2. Section 3, attacked — the fifteen events are the oracle reflected back

The README says the armless number is one "no design decision of this project can flatter". The
task design did. Every one of the fifteen events is an oracle item the author chose **because the
corpus held it**, and the oracles say so themselves:

| round | oracle line | entry counted as "rediscovered" |
|---|---|---|
| 2 | `ORACLE-EXPLAIN.md` coverage table: item 2 "shipping 0.00 — `KB-6AA0D7FB` states it exactly — **direct**" | `KB-6AA0D7FB` (r2 A, r2 B) |
| 2 | item 4 "shipment stays New — states it exactly — **direct**" | `KB-4CCC2DD6` (r2 A, r2 B) |
| 2 | item 5 "`paymentTotal` vs `sum` — `KB-0DD47BD1` states it exactly — **direct**" | `KB-0DD47BD1` (r2 A, r2 B) |
| 3 | `ORACLE-MEMBERS.md` items 5, 6, 7: invited user, Active column reports contact status, one field is not enough | `KB-4D082C89`, `KB-27B4CD10`, `KB-4B889114` (r3 A, r3 B) |
| 1 | `ORACLE.md` "verify 7 values", shipping cost and discount among them | `KB-6AA0D7FB` (r1 A, r1 B), `KB-4982C91F` (r1 B) |

Round two's oracle even opens with "Coverage, measured before writing the task" and maps each item
to the entry that answers it. An armless arm that answers the task establishes those facts by
construction. **Fifteen of fifteen are commissioned; incidental rediscoveries — facts an armless arm
established that were not asked of it — number zero in `RESTATED`.** Verified by reading the three
oracles against the table.

The measure's shape is still the right one. Its current value is not a demand signal; it is the
oracle's coverage table read back through the reports. Two changes:

* Split `RESTATED` into `commissioned` (an oracle item) and `incidental`, and headline the second.
* For the next run, draw the oracle from somewhere other than the corpus, or the number is
  manufactured again.

**The second population has the number worth quoting, and the update left it out.** 34 events, 22
served first — so **12 events where a run held the base, the base held the fact, never served it,
and the run established it and then confirmed it by id**: run 02 (1), run 05 (3), run 08 (2),
run 09 (4), run 10 (2). That is the count of "held and never offered", which is the retrieval and
arrival failure measured on parties that could have been helped. Verified from `--why`.

Also on this population: a `confirm` in a run's journal is counted as "paid to learn it again". A
confirm is the loop you have been asking runs to close. Counting it as waste means the better the
loop works, the worse this number looks. Keep the 12; drop the 22 from the waste column.

### 3. The birth rule fails silently on exactly the copy your own hard rule tells a reviewer to use

Against the live base: `15 dated by git (added after 2026-09-14), 77 by earliest evidence row`.
Against a copy made with `cp` or `git archive` — the two ways the prompt tells a reviewer to probe
without writing — `0 dated by git (added after null), 92 by earliest evidence row`. One
informational line, no refusal, and every entry falls back to the typed field the rule exists to
distrust. Today the relabelling makes the two runs agree (15 / 7, 34 / 22, 244); a day ago they
would not have. `describeBirths` should refuse, or print in capitals, when git is absent for a
corpus that has entries added after day one. **Verified** by running against both.

## Two things in the update that do not reproduce from a committed script

* **Section 4 has no script.** "1.8% of calls", "33.7%", "3,392 archived tool calls", "292 events
  to 37" appear in the update and in a comment at the top of `src/topics.mjs`, and nowhere else.
  `grep` over `measurements/` and `src/` finds no `.mjs` producing them; `kb-arrival-2026-09/` holds
  only `replay-logs.mjs` and its README, neither of which has a topic mode or the three filters.
  The uncommitted diffs in `arrive.mjs` and `resolve.mjs` are the coordinate-lookup change, not
  this. Until the script is committed, 37 is a number with nothing behind it, and this project has
  written down what happens to those. **Verified.**
* The update's table row "parties that had the base | 34 | 22, of which 22 were served first"
  reads as though the 22 distinct facts were all served first. They are two different 22s: 22
  distinct facts, and 22 of 34 events served first. Say which.

## On the uncommitted `resolve.mjs` change

The shape is the one I asked for and I have no objection to it. Three notes before it lands:

* The new comment repeats "its wide type tables are what adjacent answers were made of — a tax
  question answered with a discount row, a sign-in question with platform GraphiQL". Finding 3 of
  part one showed those adjacent answers were eight written entries and one derived one. Do not
  carry the conflation into the code that outlives the brief.
* The retrieval harness will report **7 of 34 anchors LOST**: r1.1, r1.3, r1.4, r2.1, r3.2, r3.3,
  r7.3 — derived anchors the question does not name by coordinate. That is the trade measured in
  part one, not a regression. Re-baseline once with `--write` and record the reason in the commit;
  do not override seven rows one at a time.
* `derivedByCoordinate` reads every derived entry on each coordinate-naming `ask`. Fine for a CLI.
  Do not let the hook grow the same call.

## The run's design — the ordering is right, four conditions

Catalog in the prompt, no `kb ask`, refutations afterwards: agree. Conditions, or the run measures
what the last three measured:

1. **The oracle is not drawn from the corpus** (section 2 above). Choose the task first, then seal a
   list of the catalog entries you believe relevant to it, before the arm runs. Score opens as
   relevant-opened, irrelevant-opened, relevant-missed. That replaces a post-hoc `RESTATED` table,
   which is the same person judging after reading the report.
2. **Arm C's protocol text changes for `confirmed` entries**: they may be acted on and cited without
   re-verification; `single-observation` entries are verified. Without this, finding 7 of part one
   repeats and the run cannot show acting. Measure per opened entry: acted on, or re-established.
3. Record the catalog **position and section** of every open, as planned; the section is what the
   sections were built to test.
4. **Arrival hook off** in this arm. One treatment per run.

Executable refutations after the run, not before: agree, for the reason you give.

## Sections and the budget

No objections. Disputed first within a section is right. The budget is labelled a guess where it
is defined and where it is read, which is the correct way to hold a number nobody has measured. The
one entry left `unfiled` rather than given an eighth topic is the honest choice.
