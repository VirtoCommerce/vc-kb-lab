# Deep architecture review — vc-kb-lab / vc-knowledge, and the path to a shippable plugin

Reviewer: a fresh agent (Claude Fable 5.1), 2026-09-16, with read access to `C:/_VIRTO/vc-kb-lab`,
`C:/_VIRTO/vc-knowledge`, `C:/_VIRTO/vc-mcp-testing-module` and `C:/_VIRTO/_comparison-logs`.
Nothing ran against the deployment. Every `ask` / `deliver` / `how` probe and every writing verb ran
against a `git clone` of the corpus in the session scratchpad (`kbcopy/`); the live `demand.jsonl` was
not touched by this pass (md5 `9594b4d0…` before and after). Reads of the live base were `kb validate`,
`kb stat`, `kb refute`, `kb demand` on the copy, plus the measurement scripts named below.

Every number here names the script or file it came from. Three re-runs were **declined by the owner
mid-session** and are therefore quoted from the second reviewer's reproduction, not mine:
`kb-rediscovery-2026-09/rediscovery.mjs`, `kb-sourcedoor-2026-09/replay-misses.mjs`,
`kb-arrival-2026-09/addressing.mjs`, `kb-run4-2026-09/score-opens.mjs`, `kb-run5-2026-09/score-protocol.mjs`.
Everything else that carries a number was run.

This file is **untracked**. Commit it, move it, or delete it — the owner's call.

> **Premise corrected the same evening.** The first version of this page assumed that
> `plugins/vc-fix/knowledge/` (1.2 MB) stays where it is and treated the register as a second base
> beside it. The owner's statement is that this knowledge is being **removed from the plugin and from
> the project**, that it should move into the knowledge base in the right form, and that the base is
> to be taken from the Virto repository (`https://github.com/VirtoCommerce/vc-knowledge.git`, which is
> already the local clone's `origin`). §1 goal 4, §3 "Decision", §5 step 3 and stream B, §6 and §7
> are rewritten on that premise. The inventory and overlap numbers in §3 are unchanged — they are
> what makes the migration plan concrete.
>
> **Decisions the owner took the same evening**, answering the questions this review raised:
>
> 1. The plugin's own operating instructions (`execution/*`, `diagnostics/*`, `shared-instructions`,
>    `browser-quirks`, `storefront-selectors`, `architecture/*`, `graphql-test-cases-runner`) **stay
>    with the skills** that use them; they do not enter the base.
> 2. **Migration first, then the demo** (stream B before stream A in §5).
> 3. The base is connected by **`/project-init`**: find an existing checkout or clone one, record it
>    in `project-profile.json`, show it in the readiness table; the plugin's own hook only pulls.
> 4. Virto's agents **push to `main`**; CI runs `kb validate` and rebuilds the generated indexes and
>    catalogs, so concurrent pushes do not conflict on generated files. Pull requests only for
>    migrations.
> 5. ECL's generic chapters are **not touched** by this migration.
> 6. BL ids **stay in the subject**, with a `kb show BL-…` alias by subject prefix.
> 7. **The plugin copy is canonical** after the re-port; the lab keeps `measurements/` and the
>    archives and imports the tool from the plugin.
> 8. (From the first round of answers, unchanged) the third pile is skill material, not base content.

---

## 0. What was read and run

| | |
|---|---|
| tool | all 30 `src/*.mjs` (6,425 lines by `wc -l`), `bin/kb.mjs` (972 lines, **21** command words counted from its `cmd ===` branches — the README says "six verbs", `PORT.md` says 17), `hooks/arrive.mjs`, 26 test files. `npm test`: **269 pass, 0 fail** (README still says "72 tests") |
| corpus | `kb.json`, README, both catalogs, all 3 flows, **26 captured entries in full** across all seven sections plus the retired `KB-A646D086` and `KB-C51ACC81`; a frontmatter census over all 100 files (script inline in this session, numbers in §1) |
| measurement record | `REVIEW-BRIEF-ARCHITECTURE.md`, all five parts of `REVIEW-ARCHITECTURE-RESPONSE.md`, both errata, `ATTRIBUTION-2026-09-16.md`, `REVIEWER-RUN5-PREP-2026-09-16.md`, `RESULT.md` (round 1, with retraction), `RESULT-EXPLAIN.md` (round 2), `RESULT-MEMBERS.md` (round 3, with corrections), `kb-run4-2026-09/RESULT.md`, `kb-run5-2026-09/{RESULT,CONDITIONS,TASK,SEALED-RELEVANCE,QUESTION-TEMPLATE,RUNNING,BRIEF-arm-C-catalog}.md`, `VERDICTS.json`, the READMEs of utilization, arrival, missdrift, retrieval (all four parts), sourcedoor, rediscovery, `ADDRESS-BOOK-COST.md` |
| raw logs | round 5 arm A and arm C `REPORT.md`, arm C `kb-log-26f59771.jsonl` joined to `tool-log-26f59771.jsonl` by timestamp; arm A `tool-log-32ad7748.jsonl` grepped for contamination |
| re-run by me | `kb-utilization-2026-09/utilization.mjs`, `kb-arrival-2026-09/replay-logs.mjs`, `kb-missdrift-2026-09/sweep.mjs --base <copy>`, `kb-retrieval-2026-09/replay-questions.mjs --base <copy>`; `kb validate|stat|refute|demand|ask|deliver` on the copy; `hooks/arrive.mjs` timed against the copy on three payloads |
| integration target | `vc-mcp-testing-module/CLAUDE.md`, `INDEX.md`, `.claude-plugin/marketplace.json`, `plugins/vc-kb/PORT.md` + a `diff -rq` of lab vs port + the port's own test run, `plugins/vc-fix/.claude-plugin/plugin.json`, `hooks/hooks.json`, `agents/qa-backend-expert.md`, `skills/vc-docs/SKILL.md`, `knowledge/README.md`, the header and structure of `knowledge/oracles/business-logic.md`, `vc-bug-catalog.md`, `architecture/vc-module-architecture.md`, a grep of every `knowledge/` reference from agents/skills/commands, and the root repo's `.claude/skills/qa-review-oracles/SKILL.md` (the oracle-triangulation process) |
| overlap | a second pass classified all 88 active entries and 3 flows against the 34 `vc-fix/knowledge` files, twice (overlap verdict, fact class), and every fourth `BL-*` invariant the other way — `REVIEW-PLUGIN-PATH-2026-09-16-overlap.md`; six verdicts spot-checked by me |
| domain | VirtoOZ `PlatformDeveloperGuide` on module versioning / `module.manifest` / per-store tax and shipping configuration; the round-5 arm C report as a field record of what is store-scoped vs platform-scoped on this stand |
| external practice | 31 primary pages fetched (list in Appendix C; per-source notes in `REVIEW-PLUGIN-PATH-2026-09-16-sources.md`), including the Karpathy gist raw text, Anthropic's Contextual Retrieval and Agent Skills pages, the Claude Code hooks/plugins/memory references, four post-May-2026 papers and three practitioner reports |

---

## 1. Verdict on the frame — the five goals, one by one

The five goals in the brief are not one goal. Three of them the evidence says this architecture
cannot meet as stated; two it can, with named changes. Saying which is which is the most useful
thing this review can do before a demo.

### Goal 1 — agents work faster: **not achievable as a claim, and the design forbids it**

Measured four times, null four times:

| round | numbers | source |
|---|---|---|
| 1 | 194 / 211 / 232 calls, inside a known 83–319 band | `kb-comparison-2026-09/RESULT.md` |
| 2 | 102 / 150 / 104 calls; score 7.5 / 7.5 / 8.0 with the half point traced to a tool asymmetry | `RESULT-EXPLAIN.md` |
| 3 | 84 / 97 / 100 calls; 7.0 / 7.0 / 7.0 | `RESULT-MEMBERS.md` |
| 5 | 200 (register) vs 282 (control), and the page itself says "not a result": arm A built promotions and placed an order, arm C found two existing orders | `kb-run5-2026-09/RESULT.md` |

The structural reason is the second reviewer's finding 7 and it still holds after round five: the
protocol tells the reader to verify, and in round five the reader **re-verified 7 licensed entries
and acted on 2** (`VERDICTS.json`). A register whose own licence is declined seven times out of nine
cannot save calls. The only quantity that *could* show a saving is "rediscovery avoided", and its one
uncontaminated value (`kb-rediscovery-2026-09/README.md`: **12 events "held and never offered"** across
runs 02–10) is a count of retrieval failures, not a saving. Do not put speed on the demo page.

### Goal 2 — agents stumble less over traps: **achievable, with three named changes**

This is what the corpus actually holds. The 26 entries read in full are trap-shaped almost without
exception: the storefront Active column reads contact status not account state (`KB-27B4CD10`); an
empty Tax-providers widget is a UI defect, not a configuration fact (`KB-5F7C8FC4`); the scoped
discount totals are never written for a cart-subtotal reward (`KB-B9C8ECD3`); Admin timestamps are
rendered in the *operator's profile* timezone (`KB-8C3E463D`); `paymentMethodCode` does not exist and
its shipment sibling does (`KB-EC76F588`). Each of these would cost an agent that meets it cold
somewhere between a wrong report and an hour.

And the evidence that handing them over works is real, small, and mostly from round five:

* 2 licensed entries acted on without re-verification, **both held**; 13 more verified, **all held**;
  1 disputed on its mechanism and the correction captured the same session (`VERDICTS.json`,
  arm C `REPORT.md` "Register bookkeeping").
* Replayed over 22 archived logs, on the one subject the corpus held, `KB-27B4CD10` would have been
  in front of two arms that had no base **5 and 6 calls before** they went to source for it
  (`replay-logs.mjs`, re-run: 3 of 9 subjects, 1 entry).
* Round two: an arm holding `KB-A646D086` designed a cross-store control and refuted its mechanism
  while keeping its advice (`RESULT-EXPLAIN.md`). No armless arm can produce that observation.

The three changes, each verified as missing:

1. **Delivery.** In rounds one to five the base was either behind a query nobody typed (rounds 1–3:
   2–13 consultations per run, all in the opening minutes) or in the prompt as a 94-row list
   (rounds 4–5: 8 and 13 entries touched). The arrival hook has **never run in an arm**
   (`CONDITIONS.md`, both rounds). §5 ships catalog-at-session-start plus a filtered hook.
2. **Licence you can trust.** 27 licensed entries today, of which 13 attested after round five
   (`RESULT.md`: 5 of 22 → 13 of 27). 87 of 96 stamped evidence rows carry `3.1007.26` while the
   stand runs `.27` (census below; arm C report line 5). The licence text says "act without
   re-verifying"; the corpus does not yet deserve that on most rows.
3. **A measure that moves.** "Rediscovery avoided" needs an oracle not drawn from the corpus. Round
   five's frozen `QUESTION-TEMPLATE.md` is the first honest instrument; keep it and run it on ground
   picked blind (the owner's own three-conditions note in `REVIEWER-RUN5-PREP` is right that only two
   hold at once — accept covered ground and say so).

### Goal 3 — agents spend fewer tokens: **not achievable in the MVP; it is a cost, not a saving**

The register costs tokens before it saves any: the round-five brief is 23,666 bytes with the catalog
(`BRIEF-arm-C-catalog.md`; `CONDITIONS.md` estimates ~5,900 tokens for 94 rows); every arrival hook
injection is up to 10,000 characters (Claude Code hooks reference, Appendix C); every `confirm --note` and `capture` is a
tool call. Nothing measured shows a saving on the other side of the ledger. Round four's "zero source
calls for the first time" is one run on a configuration task. Say nothing about tokens on the demo
page except the cost.

### Goal 4 — agents know the project's business ideas and rules: **achievable, by importing the rules in the right form, and only as claims until an artefact backs them**

The corpus holds **no rules today**. The frontmatter census over the 88 active entries:
`refutableBy: observation` 87, `anchor` 1, `practice` 0 — and `kb capture --help` tells writers not to
reach for `practice` because nothing can ever refute it. The rules exist elsewhere and are leaving:
`plugins/vc-fix/knowledge/oracles/business-logic.md`, 389 KB, **216** `### BL-*` headings, each with
Rule / Verify / Violation signal / Agents and, for 127 of them, a Source anchor. The schema already
names the plane they belong on — `normative`, in `kb.json` and in `validate.mjs`'s closed vocabulary —
and it has held zero entries since the day it was written. Goal 4 is met by filling it: one rule per
file, the BL id kept in the subject, the Source line as an anchor, the Verify step as the body's
refutation recipe, and the audit dates as `from:` rows pointing at an artefact on disk. What the
import must not do is mint 216 `confirmed` entries out of prose: only one BL-AUDIT report exists in
the repository (`reports/knowledge/BL-AUDIT-2026-09-08.md`), so most rules arrive as one-party claims
and earn their confirmations the same way every other entry does. §3 gives the mapping.

### Goal 5 — agents know the flow for reaching a concrete goal: **achievable in narrow form**

Three flows exist and are the most-used shape in the corpus: 100% ever served or arrived
(`utilization.mjs`), `KB-AFB2D3C5` served 6 times (the most of any entry), 5 confirmations and 6
amendments including one that corrects a false "cannot be deleted" that rode through twelve runs.
`kb how` serves a flow only when its goal accounts for a majority of the question; the brief reports
false hits 17 → 0 on 88 questions (`kb-flowmiss-2026-09/`, not re-run by me).

Two things stop this being more than narrow. There are three flows, and they grow only when someone
types `kb capture --flow`. And the consumer verb cannot reach them: **`kb deliver` on a procedural
question returns a bare `KB MISS`** while `kb ask` on the same question returns MISS *plus* the flow id
— verified on the copy this session (`src/deliver.mjs` renders a fixed reason string and drops
`res.procedural`, `res.note` and `res.source`). Defect D2 below.

---

## 2. Defects, ranked by what they cost

Each row: what is wrong, how it was verified, what it costs, the fix, an hour estimate. The eleven
instrument defects the measured parties already found and the owner already fixed (provenance,
`partiesOf`, `--note`, the scorer regexes, the row-vs-party column) are not repeated.

### D1. The port is stale, has a failing test, and still accepts typed provenance — **blocks shipping**

* **Verified:** `diff -rq vc-kb-lab/src vc-mcp-testing-module/plugins/vc-kb/src` — every shared file
  differs and seven modules are absent from the port: `provenance.mjs`, `refute.mjs`, `todo.mjs`,
  `topics.mjs`, `catalog-budget.mjs`, `source-door.mjs`, `contradiction.mjs`. The port's `bin/kb.mjs`
  line 107 still maps `'--by'` and `'--at'`. `node --test plugins/vc-kb/test/*.test.mjs`: **171 tests,
  170 pass, 1 fail** (`PORT.md` says 171 assertions, plural "pass").
* **Cost:** the port would ship the exact defect the second reviewer called "the thing I would change
  first" — a writer typing its own witnesses — plus none of the catalog sections, the attested column
  or tier-one refutation the last three days built. `PORT.md`'s "590 derived, 74 written" is two days
  stale.
* **Fix:** re-copy `src/`, `bin/`, `hooks/`, `test/`, `vendor/` from the lab; run the 269; add a
  one-line sync check in the consumer's CI (`diff -rq` against a pinned lab commit, or make the plugin
  the only copy and the lab a consumer of it — the owner's commit `739b9df` chose the opposite, "the
  lab stays whole, and its copy of the tool is meant to go stale", which is backwards today).
  **2 h.**

### D2. `deliver` drops the flow pointer and the source door on a MISS

* **Verified:** on the copy, `kb ask "how do I create a percentage discount promotion"` → MISS with
  `@kb(KB-EB228603)` named twice; `kb deliver` on the identical string → `KB MISS: the base holds no
  entry matching a content term of this question`. Root cause: `src/deliver.mjs` lines 19–33 build the
  MISS block from a constant and never read `res.procedural`, `res.note`, `res.source`.
* **Cost:** the hook's own text tells agents to run `kb deliver`; an agent that obeys on a how-question
  is told the base is empty while it holds the exact procedure. The demand log then records a MISS
  against a covered question (the uncommitted rows in the live `demand.jsonl` show this shape twice).
* **Fix:** render the three fields in the MISS branch; one test. **1 h.**

### D3. Writing is end-loaded, still — the loop closes from memory

* **Verified:** joining round five arm C's 31 kb-journal rows to its 200 tool calls by timestamp puts
  **every one of them at calls 171–196**; entries were *read* at calls 3, 95, 150 and 190. Round four
  was the same shape (calls 339–351 of 357, `kb-run4-2026-09/RESULT.md`). Run 03 was the same shape
  (`src/demand.mjs` header). Three briefs, two treatments, one shape.
* **Cost:** captures are reconstruction at report time. Anything the arm learned and then superseded
  mid-run is never written; the arm's own `KB-28579C5B → KB-055845A3` self-supersede in round four
  shows what is lost when it is not caught. The demand loop cannot help because nothing is asked
  mid-run either.
* **Fix:** stop fighting it and structure it. Compound-engineering's `/ce-compound` and Claude Code's
  own auto-memory both write at the end of the work; what makes it acceptable is a *structured* step.
  Ship a `Stop` hook that, when this session's journal shows reads and no writes, returns
  `decision: "block"` once with a reason listing the entries read and the demand rows open, so the
  agent writes before it stops (hooks reference: Stop hooks may block once; guard with a per-session
  marker in `${CLAUDE_PLUGIN_DATA}`). **2–3 h.** The mid-run half is a research problem; do not
  promise it.

### D4. The arrival hook is noise-shaped and costs 180 ms a call

* **Verified this session, against the copy:** `node -e 0` 80–84 ms; `hooks/arrive.mjs` on a
  `/company/members` navigation 254–286 ms (five runs each). On a `curl -X DELETE
  …/api/order/customerOrders` payload it offers **the derived route table for the route being
  deleted** — the reviewer's 122-of-246 "cleanup" and 92-of-246 "derived only" classes, reproduced on
  one payload each. On an unrelated `Read` it is silent (correct). And it fired **on this review's own
  Bash command** because the command text contained route strings — the lab's `.claude/settings.json`
  wires it for every session in that directory, and the injected block arrived as a system reminder
  next to my tool result.
* **Cost:** a hook that repeats itself and disclaims itself gets tuned out inside a run (reviewer
  finding 4); one that runs 180 ms on every tool call gets turned off by the first person who notices.
* **Fix:** four filters and a cache. (a) Written and flow entries only — never a derived route table.
  (b) Skip when the touched coordinate arrives with a `DELETE` verb or a cleanup-shaped tool call.
  (c) Once per coordinate per session: a small JSON keyed on `session_id` under
  `${CLAUDE_PLUGIN_DATA}`. (d) In `hooks.json`, a `matcher` limited to navigation and HTTP tools
  (`mcp__playwright-.*__browser_navigate|Bash|WebFetch`) so edits of report pages do not fire it.
  Cache: `kb reindex` already rebuilds artifacts; have it also write a `coordinates.json` the hook
  loads instead of parsing 690 files per call. Set an explicit `timeout` (default is 600 s, not 60).
  **4 h.**

### D5. Every stamped row since round four says a version the stand was not running

* **Verified:** census over active entries: 87 evidence rows `platformVersion: 3.1007.26`, 9 rows
  `3.1007.27` (those passed `--platform-version` by hand); `derived/pin.json` says `.26`; arm C's round-five
  report, line 5: the deployment reports `.27` "and the deployment is right". `kb refute` on the copy:
  27 licensed, holds 21, unprojected 6, baseline taken 14:26Z against the `.26` plane.
* **Cost:** "pin the source, not the value" failing at its own door, for the fourth round running; the
  attested rows the demo will lean on carry a wrong version.
* **Fix:** one authorized session: `kb extract --env vcptcore_stable`, then `kb refute` **before**
  `kb refute --baseline` (the reviewer's ordering, so the patch's drops read as ROTTED), then commit.
  Add a staleness notice to `stampOf`: if `pin.json` is older than N days, print it beside the stamp.
  **1.5 h + 0.5 h.**

### D6. The identity rule refuses legitimate second facts, and writers route around it by moving anchors

* **Verified by reading, not by reproduction:** `capture()` in `src/capture.mjs` throws
  `CaptureRefused` on a fingerprint collision (normalized anchors + scope). The brief's own opinion 2
  records the workaround: "two unrelated facts about the Admin order screen collided … we worked
  around it by re-anchoring one". `KB-4982C91F`'s body carries an "Anchor corrected" note for the same
  reason. The second reviewer (finding 9) asked for the collision to become advisory; it did not.
* **Cost:** a guess enters the corpus every time a writer moves an anchor to dodge the rule; the
  `experientialNeighbours` display already does the advisory job.
* **Fix:** keep the refusal only when the *claim texts* are near-identical (the door already computes
  nothing about wording — so instead: allow `--distinct "<why this is a different fact>"` which writes
  the reason into the evidence row and lets the write through). **1.5 h.**

### D7. The derived plane's `/api/platform` projection is incomplete and the validator says otherwise

* **Verified:** `kb validate` on the copy prints 39 notices; `KB-8C3E463D`'s anchor
  `GET /api/platform/profiles/currentuser` is reported as "names nothing, in a namespace this base
  projects in full" — arm C's report shows the route is served (200) and is where the operator
  timezone lives. `KB-5790A068` (`/api/platform/changelog/…`) has the same shape.
* **Cost:** the address book misses real routes on the namespace every run walks most
  (`pick-namespace.mjs`: 47 mentions, 89 routes); the notice text asserts a completeness that is false.
* **Fix:** extract the platform module's swagger fully, or soften the notice to "no derived entry names
  it". **1 h**, rides on D5's session.

### D8. Fourteen probe rows sit uncommitted in the live demand log

* **Verified:** `git -C C:/_VIRTO/vc-knowledge diff demand.jsonl` — 14 added lines dated 18:03–18:18Z,
  from the prior review pass: "cancel an order", "place an order", "how do I get an admin bearer token"
  (×2), "how do I create a percentage discount promotion" (×2), "airspeed velocity of an unladen
  swallow" (dropped). `kb demand` on the copy lists 8 open questions, 5 of them these.
* **Cost:** the demand loop is the only coverage signal the base produces on its own, and it now says
  someone needs to know how to place an order.
* **Fix:** `git -C C:/_VIRTO/vc-knowledge checkout -- demand.jsonl` — the owner's call, it is their
  working tree. **0.1 h.** And the lesson is already in the source (`bin/kb.mjs`, the comment above
  `noteLoop`): probing the live base writes.

### D9. The retrieval harness has printed REGRESSION on every run since the address-book change

* **Verified:** `replay-questions.mjs --base <copy>` → "rows whose first-ranked entry disappeared: 2 of
  34 … REGRESSION"; `ADDRESS-BOOK-COST.md` explains the seven rows and refuses to re-baseline.
* **Cost:** a gate that is always red is not read. The reviewer asked for one deliberate `--write` with
  the reason in the commit.
* **Fix:** do that, or retire the free-text harness from the plugin path (see §4). **0.5 h.**

### D10. Three numbers on the tool's own pages do not reproduce

* README: "72 tests" (269), "The six verbs" (21 commands). `PORT.md`: "74 written" (88 active + 12
  retired), "171 assertions" (170 pass). `src/index-build.mjs`: "Measured over 15 contract questions …
  top-3 12/15 for every one of them" — no committed script produces that figure; the committed grid is
  `kb-retrieval-2026-09/README.md` part three (60 settings over 34 rows). The project's own rule is
  "run the script that prints them". **0.5 h**, and it is the reviewer's first act otherwise.

### D11. The `question`-field closing rule manufactures verbatim copies

* `src/todo.mjs` and `closeQuestions` in `src/demand.mjs` close a row only on exact normalized
  wording, so the planner tells writers to word the `question` field as the logged query. The second
  reviewer's finding 2 showed the first casualty (`KB-1B18B821`). Under the catalog frame the field is
  read by a person, not matched by BM25, so the harm shrinks — but the rule still trains writers to
  copy queries. Close rows by id instead (`kb capture --closes <key>`). **1 h**, optional.

---

## 3. The integration decision — one base or two

Method: a second pass read all 88 active entries and 3 flows in full, grepped each one's
coordinates across the 34 `vc-fix/knowledge` files and read the surrounding section, and classified
every row twice — overlap verdict and fact class. The full table is
`REVIEW-PLUGIN-PATH-2026-09-16-overlap.md` beside this file. Six of its verdicts were spot-checked by
me against the cited lines (`e-commerce-edge-cases-library.md:66,70`, `products.md:21,37`,
`api-auth.md:87` vs `graphiql-interaction.md:32`, `business-logic.md:563-566` and `:647-649`, the
basename grep for unreferenced files); all six held.

### What is actually on each side

| | `vc-fix/knowledge/` | `vc-knowledge/captured/` + `flows/` |
|---|---|---|
| size | 1.2 MB, 34 files; `business-logic.md` alone 389 KB | 184 KB active (88 entries), median entry 2 KB; 3 flows |
| unit | a **rule**: `BL-<DOMAIN>-<NNN>` with Rule / Verify / Violation signal / Agents, optional Source + `Amended:` date; a **pattern**: `VC-<AREA>-<NNN>` with Pattern / Detection probe / Cross-ref | an **observation**: subject, question, claim, anchors, scope axes, `evidence[]` rows with `method`, `deployment`, `platformVersion`, tool-set `by`, `from`, `note`, `contradicts` |
| scope | platform-universal by intent (`applicability_rationale`: "most BLs are platform-level invariants"; "some encode vcst-specific assumptions") | one deployment, `vcptcore_stable`, 148 of 148 observation rows |
| who writes | humans and the `qa-review-oracles` triangulation in the **root** repo (`.claude/skills/qa-review-oracles/`, `scripts/knowledge/lint-bl.ts`, `rank-oracles.ts`) — **none of which ships in `vc-fix`** (`plugins/vc-fix/scripts/` holds two verify scripts and a `lib/`) | agents, through a door that refuses missing inputs, typed witnesses, joined scopes and local paths |
| lifecycle | `Amended:` stamps and a "CONFIRMED 3/3" triangulation note on audited entries; no dispute path; no per-deployment scoping; staleness is a manual audit that the plugin cannot run | confirm / dispute / supersede / retire / amend / reanchor, `partiesOf`, `attested`, tier-one rot detection |
| self-consistency | the file header says **169** BLs; four agent files say **"17 domains, 108 rules"**; `grep -c '^### BL-'` says **216** | `kb validate` rebuilds index and catalog and byte-compares; a count that drifts fails the gate |
| consumption | `business-logic.md` cited from 16 files in agents/skills/commands, `vc-bug-catalog.md` from 11 — **by file name**: 23 of 216 `BL-*` ids are cited anywhere, none from domains 12–24, and **zero** `VC-*` or `ECL-*` ids. One knowledge file is cited from nowhere (`execution/live-discovery.md`), plus the two READMEs | 8 of 92 catalog rows touched in round four, 13 of 94 in round five |

### The overlap, quantified

91 rows (88 active entries + 3 flows), from `REVIEW-PLUGIN-PATH-2026-09-16-overlap.md`:

| verdict | count | share | what it means |
|---|---|---|---|
| DUPLICATE — `vc-fix` states the same mechanism | **2** | 2% | `KB-5ADBFB34` (= `BL-CART-003` "Known behavior", same source file) and `KB-6824BC2B` (= `graphiql-interaction.md`) |
| RELATED — same coordinate, a different or more general fact | **56** | 62% | the rule is in `vc-fix`, the dated observation is in the register |
| ABSENT — nothing in `vc-fix` touches it | **33** | 36% | whole coordinate families: `/api/carts` REST, the Admin profile clock, order-blade deep links, `PricelistAssignment`, `SharingSettingType`, `OrderLineItemType`, `passwordHash` redaction, promotion change-tracking |

**Shipping a duplicate is not the risk. Two entries in 91 are duplicates.** The risk is the opposite
one, and it is concrete: **13 of the 56 RELATED rows are contradictions** between the shipped
knowledge and the register on the same coordinate. Three of them verified line by line this session:

* `e-commerce-edge-cases-library.md` §1.3 row 5 (amended 2026-08-27, `[OBSERVED]`, triangulated):
  coupon codes match **case-insensitively** server-side. `KB-35F20D97` and flow `KB-A54C919F`, observed
  2026-09-14 on `vcptcore_stable`: matching is **case-sensitive and untrimmed**. Both carry a live
  observation. One is wrong, or the storefront builds differ — and neither file can say which,
  because `vc-fix` has no `appliesTo` and the register has no cross-link.
* `domain/products.md:21,37`: `productType` takes `Physical`, `Digital`, `Configurable`,
  `BillOfMaterials`. `KB-3113CBC1` (2 confirmations, 1 dispute on another clause): `productType` is
  `Physical`/`Digital`/`null` and configurability is a separate entity.
* `business-logic.md:563-566` `BL-B2B-005`: a Buyer sees "Orders, Lists but NOT Members".
  `KB-02238DE5`: an employee loads `/company/members` read-only; the role removes controls, not routes.

Seven of the thirteen are the B2B membership model: `vc-fix` documents the per-organization
`OrganizationMembership` status (`BL-B2B-008/012/013`, VCST-5028) while every register observation on
this stand saw `contact.status` and the global lockout being written. That is most likely a module-mix
difference, which is exactly the class of fact the register scopes and the rulebook cannot. And
`vc-fix` disagrees with itself on one coordinate: `api-auth.md:87` says GraphiQL "uses session cookies
from Admin SPA login"; `graphiql-interaction.md:32` says queries there "execute as Anonymous".

The register has its own duplication, inside itself: `KB-27B4CD10` / `KB-4B889114` / `KB-82111688`
are one fact three times (the Active column), and `KB-B9C8ECD3` / `KB-F1542157` / `KB-FF7E4D5B` are one
fact three times (the cart-subtotal reward sits at order level). `kb consolidate` groups them by
coordinate and has never been applied.

### What kind of fact belongs where — the domain question

The second pass also classed every row by the kind of fact it is, and sampled every fourth `BL-*`
invariant (54 of 216) the same way:

| fact class | register (91) | BL sample (54) | where it belongs |
|---|---|---|---|
| **platform-universal at a module version**, invisible from the contract (the cancel cascade, the Active column, the two clocks) | **59** | 29 | the register — keyed by the module version stamp, not by the deployment. These hold on any stand running the same `vc-module-order 3.1000.4`, which is the argument for Virto owning the base and for the stamp being right (D5) |
| **derivable from the contract** (a field or route that is or is not there) | 12 | 1 | a pointer at most: the swagger is one fetch away and `refute` tier one can re-derive an absence on every extract. Lowest-value class in the register |
| **derivable from source** (mechanism read from code at the installed tag) | 6 | 24 | both: `BL` states the rule with a file anchor; the register records it with `method: source` at the installed version. The `source door` exists for this class |
| **deployment / store specific** (no active tax provider on B2B-store, unpriced Fixed Rate options, `BestReward` here, the membership model) | 10 | **0** | only the register can hold these — and today it scopes them by `surface=` and `principal=`, never by `store=`. Add the axis |
| procedure | 3 | — | flows, with confirm/amend |
| the agent's own tooling | 1 | — | the door's help text says not to record these; `KB-6824BC2B` is the exception and it is the one duplicate with `vc-fix` |

The VirtoOZ developer guide confirms the grain: modules are SemVer'd and declared with dependencies
and a `platformVersion` in `module.manifest`; a deployment installs its own set with
`vc-build install -module <module> -version <version>`; tax providers and shipping methods are enabled,
prioritised and configured **per store**. Round five's arm C found `Marketing.Promotion.CombinePolicy`
to be a platform-wide setting on this stand (`objectId: null`, absent from B2B-store's 55 store
settings) while `vc-bug-catalog.md` `VC-PROMO-002` calls it store-wide — a fourteenth disagreement, and
one only a store-scoped observation can settle.

So the reviewer's frame needs one word changed: not "a register of *this deployment's* surprises" but
**a register of surprises keyed by module version, with a store axis for the tenth that are truly
local**. Two thirds of what it holds would be true on the next deployment running the same modules;
that is the case for the corpus being Virto's, shipped as a clone, and not a per-customer artefact.

The one place in `vc-fix` where the kinds coincide with the register is `vc-bug-catalog.md`:
"Pattern → Detection probe → Cross-ref", with cross-refs to private memory slugs
(`reference_additem_async_settle in MEMORY`) that the consumer's own `CLAUDE.md` calls dangling for
every other reader (522 such citations across 131 slugs). That file is a register of surprises written
in prose with no provenance and, per the id grep, never cited by entry id. It is the part of
`vc-fix/knowledge` that `vc-knowledge` is the successor to.

### Decision — one base, and how the 1.2 MB gets into it in the right form

`vc-fix/knowledge/` is leaving the plugin and the project. That makes `vc-knowledge` the only base,
and the question is not whether to merge but **what to move, what to delete, and in what shape**.

**Step one: sort the 34 files into three piles by what each is about.**

| pile | files | destination |
|---|---|---|
| **knowledge about the platform** | `oracles/business-logic.md` (216 rules), `oracles/vc-bug-catalog.md` (55 patterns, each with Pattern / Detection probe / Cross-ref), `oracles/e-commerce-edge-cases-library.md` — its 182 `[OBSERVED]` rows and chapter 14, `oracles/critical-ui-scope.md`, `domain/{products,store-settings,catalog,sitemap}.md` (the observed halves), `api/{api-auth,platform-patterns,graphiql-interaction,order-creation-matrix}.md`, `automation/storefront-config-flags.md` | **the base**, one fact per file, on the plane its kind dictates |
| **copies of what the derived plane regenerates** | `api/graphql-schema.md` (a 38 KB introspection snapshot), the xAPI field tables inside `domain/products.md`, the settings list inside `domain/store-settings.md` | **not moved — deleted.** The derived plane is their right form; `kb check` byte-compares it against the deployment, which a pasted snapshot can never be |
| **the plugin's own operating instructions** | `execution/*` (tracker-ops, azure-html-format, plugin-root, module-suite-map, frontend-local-verify, debugging-signals, performance-thresholds, live-discovery), `diagnostics/*`, `agents/*/shared-instructions.md`, `automation/{browser-quirks,storefront-selectors}.md`, `architecture/*`, `api/graphql-test-cases-runner.md` | **not knowledge about Virto Commerce**: they say how the plugin's agents operate. They belong beside the skills that use them, as Agent Skills level-3 files, or they go with the plugin refactor. **Owner to confirm** (§7 Q1) |

**Step two: the right form is the base's existing shape, plus the one plane it names and has never used.**

| a BL invariant today | becomes | why this and not something else |
|---|---|---|
| `### BL-CART-003: Coupon + sale interaction [P0-revenue]` | `plane: normative`, `subject: BL-CART-003 coupon + sale interaction` | the BL id stays in the subject so `grep`, `kb show` (with a two-line alias by subject prefix) and the 23 citations in agent prompts still resolve; the `KB-` id is minted from the subject as for every other entry |
| **Rule**, **Violation signal** | the body | the claim and its failure shape, as written |
| **Verify** | a `## Verify` section in the body | the refutation recipe. It is what the second reviewer called an executable refutation, in prose for now; promoting it to a `probe:` field is a later schema decision |
| **Source** (`vc-module-marketing BestRewardPromotionPolicy.cs`) | `--source VirtoCommerce.Marketing:src/…/BestRewardPromotionPolicy.cs` | `sourceRef` resolves the tag this deployment runs and refuses a module the base does not record as installed. That refusal is right: a rule about a module this stand does not run is imported with the anchor as a coordinate and no `method: source` row, and `validate` reports it as uncovered |
| severity tag | first line of the body, and a column in the rules catalog | **not** a scope axis: scope decides identity, and "the same rule at P0 and at P1" is one rule |
| **Agents** | dropped | plugin routing, not knowledge |
| **Amended** / **Promoted** (`2026-07-22 … BL-AUDIT-2026-07-22; CONFIRMED 3/3`) | an evidence row with `from:` naming the artefact that was read | **the only honest shape**, and the second reviewer's rule. One audit report exists on disk (`reports/knowledge/BL-AUDIT-2026-09-08.md`); the July and August audits named in 63 `Amended:` lines are prose only. Rows for those name the file itself at its commit, one artefact, one party. **No imported rule is born `confirmed`.** "3/3" in prose is a claim about evidence, not evidence |
| `refutableBy` | `observation` | the Verify step is what would fail |
| identity | the rule id and its scope, like a flow's goal — **not** anchors | two rules routinely share a coordinate; the anchor rule would refuse the second, which is D6 at 216× |
| store | `rules/` beside `captured/` and `flows/`, own index and catalog | the flow plane was added exactly this way (`planes.mjs` `WRITTEN_STORES`), and `normative` is already in `validate.mjs`'s `PLANES` |
| catalog | sectioned by **BL domain**, not by the regex topics | the domain is the author's own filing and the section key `topics.mjs` had to guess at |

`vc-bug-catalog.md`'s 55 patterns become `experiential` entries: Pattern → claim, Detection probe →
body, Cross-ref → `from:` when it names a file on disk. A cross-ref to a private memory slug names
nothing anyone else can open, so that row's `from:` is the catalog file at its commit. The
deployment-bound ones (`VC-CAT-001` catalog GUIDs, the 2026-05-15 restore) get `appliesTo
deployment=vcst` — the axis the register has never used and the one that keeps a stand's data out of
another stand's answers. ECL's 182 `[OBSERVED]` rows and chapter 14 go the same way (B3, pending the
owner's confirmation in §7); ECL's generic chapters are QA heuristics about e-commerce in general,
not facts about Virto, and by the owner's decision they are **not touched** by this migration.

**Step three: an importer, not a typist.** The skeletons are mechanical — `grep -c` finds Rule 215,
Verify 215, Violation signal 216, Source 127, Amended 63, Promoted 86 in the BL file and 55 × Pattern /
Detection probe / Cross-ref in the catalog — so a committed migration script in the lab's existing
style (`scripts/relabel-transcriptions-2026-09-16.mjs` is the model: dated, `--dry-run`, header
explaining the counts) writes every entry **through `capture()`**, so every refusal the door has
fires on the import too. Three things it routes to a human queue instead of writing:

1. a coordinate collision with an existing register entry (`experientialNeighbours`) — the **13
   contradictions** above land here, which is the lifecycle doing on day one what the shipped file
   could never do;
2. a `--source` module the base does not record as installed;
3. a Verify step that names no coordinate at all.

Roughly 216 + 55 + 180 ≈ 450 entries; the mechanical part is hours of runtime, the queue is the
human work, and a sample of twenty is read by a person before the run is committed.

**Step four: what agents lose and get back.** Today the shipped agents cite 23 BL ids from their
Layer-1 tables and read the 389 KB file by path. After the import: the session-start injection
carries the surprises catalog plus a **one-line-per-domain index of the rules** (24 lines), a domain's
rules are read on demand with `kb rules <domain>`, and a cited `BL-*` id resolves through the subject
alias. That is `bl:extract` reborn inside the plugin, with provenance, and it is the Agent Skills
three-level model applied to rules: index always, domain on trigger, rule on demand.

**Decision: one base.** Knowledge about the platform migrates into `vc-knowledge` on the plane its
kind dictates — rules to `normative`, patterns and observations to `experiential` with `from:` rows,
procedures to `flow`; contract copies are deleted in favour of the derived plane; plugin mechanics
do not migrate. Nothing is imported as `confirmed`. And every plugin install obtains the base from
`https://github.com/VirtoCommerce/vc-knowledge.git` — never from inside the plugin (§5 step 3).

---

## 4. Architecture recommendation

### 4.1 What the field says, and where this project already stands

The design is not novel and that is good news: it is the design every practitioner has converged on
for a store of this size, with more provenance than any of them. Sources are fetched pages, dates as
published, URLs in §8.

| principle | who says it | vc-kb today |
|---|---|---|
| A folder of agent-maintained markdown, an **index read first, then drill in**; "avoids the need for embedding-based RAG infrastructure" at "~100 sources, ~hundreds of pages" | Karpathy, *LLM Wiki* gist, 2026-04-04 | matches: `captured/*.md` + `captured-catalog.md`; the catalog-in-context of rounds 4–5 **is** `index.md` |
| Three layers: immutable raw sources, LLM-written wiki, a schema file (CLAUDE.md/AGENTS.md) | same | matches: derived plane + arm reports = raw; `captured/` + `flows/` = wiki; `kb.json` + `capture --help` + the brief = schema |
| Three operations: ingest, query, **lint** (contradictions, stale claims, orphans, missing links) | same | half: `validate` + `contradiction.mjs` lint one shape; there is no orphan/inbound-link lint because there are no typed links between entries (`@kb(id)` appears in bodies of `KB-3113CBC1`, `KB-AD1FA66B`, flows — unindexed, unvalidated except in flows) |
| Index ceiling "100–200 pages" before the index "becomes too long for the LLM to read in one pass"; add supersession, confidence, audit trail | *LLM Wiki v2* (rohitg00 gist) and *The Schema Is the Product* (cozypet) | 88 rows is under the ceiling; supersede/retire/attested already exist — the register is ahead of the derivatives here |
| Hot inlined, **warm listed, cold omitted**; injected at session start via a generated AGENTS.md; `[[id]]` cross-links resolved by grep | axiomhq/agent-memory README | the catalog is all-warm (one line each); no hot tier; injection was by a hand-generated CLAUDE.md in the arena — a plugin needs a `SessionStart` hook for it |
| Index loaded every session, capped at **200 lines / 25 KB**, measured by the harness after each write; topic files read on demand; tool-written `modified` timestamp | Claude Code *How Claude remembers your project* (live docs) | `catalog-budget.mjs` guessed 150 rows / 25 KB — the same number Anthropic ships; `at` and `by` are tool-set already |
| "If your knowledge base is smaller than 200,000 tokens … just include the entire knowledge base in the prompt" | Anthropic, *Contextual Retrieval*, 2024-09-19 | 184 KB active ≈ 45k tokens: a quarter of the threshold. Embeddings are not a question this corpus asks |
| Level 1 metadata ~100 tokens always loaded; Level 2 body under 5k tokens on trigger; Level 3 on demand; after compaction skills are re-attached keeping 5,000 tokens each within 25,000 | Anthropic *Agent Skills* (blog 2025-10-16; live docs) | the catalog should stay under 5k tokens to survive re-attachment whole; the round-five brief at ~5,900 does not |
| "no agent we measure converts organization itself into better answers"; organization pays in **search cost** (halved) and in distilled guidance for weaker agents (+10 points) | Zhou et al., *Filesystem-Based Memory for LLM Agents*, arXiv 2607.26637, 2026-07-29 | supports sections-for-reading over ranking-for-relevance; and it is a warning: do not expect the catalog to raise answer quality, expect it to cut the cost of finding |
| A lint that the agent performs by re-reading fails past ~185 pages; "hand them to a program" — 10 orphans and 9 unindexed pages found on first run | de Assis, *Three Months of my LLM-wiki*, 2026-07-19 | `validate` is that program already; the missing check is inbound links |
| Over-formalised instruction sets produce "Index Sickness"; cutting instruction volume ~75% fixed it | Zhang & Song, arXiv 2606.19121, 2026-06-17 | a warning for this project specifically: `CAPTURE_HELP` is 5.6 KB, the round-five brief is 23 KB, and every refusal is a paragraph. The skill body in §5 is budgeted at 500 lines for this reason |
| Invalidate, never delete: a contradicted fact keeps its history with a closed validity window | Zep/Graphiti, arXiv 2501.13956, 2025-01-20 | matches exactly: retire keeps the file, supersede points forward, dispute appends |
| "A highly-retrieved memory becomes confidently wrong" when the world moves; systems "treat change as replacement rather than evolution" | Mem0, *State of AI Agent Memory 2026*, 2026-09 | the case for tier-two refutation on the licensed set, and for D5 |
| "Keep the wrong stuff in": failed attempts left in context improve recovery | Manus, 2025-07-18 | matches: disputed entries listed first in every section; `KB-D24EDC70` records where the looking stopped |
| Agentic search over an index beat RAG "by a lot" for Claude Code; exact match beats semantic similarity on identifiers | Cherny (quoted in vadim.blog, 2026-03-03); CORE-Bench arXiv 2606.11864 | matches: coordinate lookup, `kb show <id>`, grep over `captured/` |
| Skills are "procedural knowledge with explicit applicability conditions"; "curated skills improve agent success while self-generated skills may degrade performance" | *SoK: Agentic Skills*, arXiv 2602.20867, 2026-02-24 | flows are skills with provenance; the confirm/amend lifecycle is the curation the SoK says self-generated skills need — keep it, do not turn flows into plain SKILL.md files |
| Write the learning at the end of the loop where the next run reads it: "Run one teaches it. Run two remembers." | EveryInc compound-engineering plugin README | legitimises D3's structured end-of-run write, and names the check: does run two find it |
| Hybrid strategy: small always-loaded context plus just-in-time retrieval by lightweight identifiers | Anthropic, *Effective context engineering*, 2025-09-29 | the catalog is the always-loaded half; `kb show` and the file path are the identifiers |

Where the project is **ahead** of every source: tool-set provenance with independence counting, a
refusal door, an attested column, and a rot tier keyed on a machine-extracted contract. Where it is
**behind**: no typed cross-links and no orphan lint; no hot tier; an instruction surface several times
larger than the Anthropic size guidance; and the reader-side machinery (BM25, floors, three verbs)
that the field says a corpus this size does not need and that fourteen swept rules could not make
reliable.

### 4.2 The recommendation

**Change the reading side outright; keep the writing side whole.**

Reading: the plugin's agent-facing surface is (a) the written catalog injected at session start,
(b) the file itself opened by id, (c) arrival of written entries when the agent stands on a
coordinate. No free-text query verb reaches an agent. This is the LLM-Wiki shape and it is what rounds
four and five already tested. `ask`, `how`, `deliver` stay in `bin/kb.mjs` for operators and for the
planner, and leave the skill text.

Writing: unchanged. `capture`, `confirm --note`, `dispute`, `supersede`, `amend`, `reanchor`,
`refute` — the door and its refusals are the project's one asset no external source has.

What to **throw away** for the MVP (un-index, do not delete):

| thrown away | why |
|---|---|
| the derived plane from the plugin's retrieval and arrival paths | decision §3.2 of the brief; 11–29% utilization by shape (`utilization.mjs`); 92 of 246 replayed arrivals were route tables (reviewer finding 4). It stays as the coordinate system for `validate`, `refute` and `unreachableAnchors` |
| BM25 `ask`/`how`/`deliver` as an agent surface | fourteen rules, vocabulary failure (`kb-missdrift-2026-09/`); the field's 200k-token rule; the harness prints REGRESSION permanently (D9) |
| `arrivesAt` as an investment | 244 → 244 pre-existing arrivals after nine addresses (`ERRATUM-2-2026-09-16.md`); freeze the field, spend nothing on it |
| the exact-wording demand-row closing | D11 |
| the 23 KB brief as the way the protocol reaches an agent | Agent Skills size guidance; Zhang & Song; a SKILL.md body under 500 lines and a catalog under 5k tokens replace it |
| `kb todo`'s CHECK pile from anything user-facing | it inherits the drift it plans around (`src/todo.mjs` header) |

What to **keep and finish**: catalog sections and the two trust columns; provenance; `refute` tier one,
plus tier two on the 13 request-reachable licensed entries when a deployment session is authorized;
flows as the procedural plane; the contradiction lint, plus an inbound-link lint over `@kb(id)`.

The more radical option was considered and rejected: folding the register into
`vc-fix/knowledge/` as one more prose file and dropping the tool. It loses per-row provenance, the
refusal door, and every gate — which is to say it loses the only things three null rounds did not
touch.

---

## 5. A 30-hour MVP plan

> **B1 is done, 2026-09-17.** The `normative` plane exists: `src/rules.mjs` (the id grammar, the
> domain key, the catalog order), `WRITTEN_STORES.normative` → `rules/`, a `fingerprint` branch that
> identifies a rule by its id, `kb capture --rule`, `kb rules [<domain>]`, `kb show BL-CART-003` by
> the author's id, gate checks and a rules catalog that rebuilds and byte-compares. **282 tests pass**
> (269 before, 13 new in `test/rules.test.mjs`). The live corpus rebuilds byte-identically and
> `kb validate` is green on it — 590 derived, 100 captured, 3 flows, 0 rules, 39 notices, unchanged.
>
> Three decisions made while building it, each written into the code where it applies:
>
> * **A transcribed rule does not vote.** `partiesOf` counts a `from` artefact as a party, which is
>   right for an arm's report and wrong for a page of rules: nobody watched anything by writing one.
>   The first row of a rule captured with `--from` and no `--deployment` is kept in full and marked
>   `attested: false` with a `whyNot`, so the rule reads **0 parties** and no import can arrive one
>   confirmation short of the licence to act unverified. `attestedOf` was tightened to match; no live
>   entry changes.
> * **A rule answers no question and needs no scope.** Both are exempt at the door and at the gate,
>   with the argument at `NORMATIVE_EXEMPT`. Requiring either would make an importer invent 216
>   values nobody observed.
> * **An observation does not supersede a rule.** Where a written neighbour is a rule, the door now
>   says so and points at `kb dispute`: both sides stay, and the disagreement is the finding.
>
> One latent defect fixed on the way: `kb reindex` wrote an index and a catalog for a store with no
> entries, and `kb validate` then failed on the verb's own output ("rules-index.json exists while
> rules/ holds no rules"). Latent for the flow store since the day it shipped, live the moment a
> third store existed. `rebuildCapturedArtifacts` now skips an empty store rather than writing a
> claim about nothing.

Two streams. **Stream A** ships the plugin and the loop demo (decision §3.1). **Stream B** moves the
shipped knowledge into the base in the form §3 gives. Each step names its files, an hour estimate and
the check that says it worked. The two streams together are about 40 hours; 30 hours buys all of
stream A minus its cuts plus the first two steps of stream B, and the arithmetic is at the end.

| # | step | files | h | check |
|---|---|---|---|---|
| 0 | Housekeeping | `vc-knowledge/demand.jsonl` (discard the 14 probe rows — owner's call), `vc-kb-lab/README.md` (replace "72 tests" / "six verbs" with the commands that print them), `plugins/vc-kb/PORT.md` | 1 | `kb demand` shows 3 open questions, all real; `grep -c '72 tests' README.md` = 0 |
| 1 | Re-port the tool, and make the plugin canonical | copy `src/`, `bin/`, `hooks/`, `test/`, `vendor/` lab → `plugins/vc-kb/`; then the lab's `measurements/**/*.mjs` and `scripts/*.mjs` import the tool through one path constant (`measurements/lib/tool.mjs` → `../../vc-mcp-testing-module/plugins/vc-kb/src/…`), and the lab's `src/`, `bin/`, `hooks/`, `test/` are removed with a README line saying where the tool lives now. `PORT.md` rewritten | 2.5 | `node --test plugins/vc-kb/test/*.test.mjs` → 269 pass; `grep -c "'--by'" plugins/vc-kb/bin/kb.mjs` = 0 outside the refusal; `node measurements/kb-utilization-2026-09/utilization.mjs` still runs from the lab |
| 2 | Plugin manifest and marketplace entry | `plugins/vc-kb/.claude-plugin/plugin.json` (`name: vc-kb`, `version: 0.1.0`, `description`, `author`), `.claude-plugin/marketplace.json` (third entry), `plugins/vc-kb/hooks/hooks.json` (empty `hooks` until step 5) | 1.5 | `claude plugin validate plugins/vc-kb` passes; `claude --plugin-dir plugins/vc-kb` lists `/vc-kb:register` once step 6 exists |
| 3 | **The base, connected by `/project-init`** (owner's decision 3) | In `vc-fix`'s `skills/project-init/`: a new `locate-knowledge-base.mjs` that takes the first of `KB_BASE`, a `vc-knowledge` checkout beside the project or any ancestor (the lab's own layout, so Virto machines get their existing clone), else `git clone --depth 1 https://github.com/VirtoCommerce/vc-knowledge.git <project>/.vc-knowledge`; `lib/gitignore.mjs` adds `.vc-knowledge/`; `gen-profile.mjs` gains `--knowledge-base-path` / `--knowledge-base-repo` and `PROFILE_DEFAULTS` gains `knowledgeBase: { repo, path, ref: "main" }`, so `reconcile-profile.mjs --check` adds the field to old profiles and asks; `verify-access.mjs` adds a readiness row `knowledge base: <path> @ <sha> · N active entries · M flows`. In `vc-kb`: `src/base.mjs` reads `project-profile.json` from `cwd` or an ancestor as a candidate between `KB_BASE` and the sibling walk; `hooks/session-base.mjs` (SessionStart) does only `git pull --ff-only` with a 10 s timeout on the profile's path and says in the injected context whether it pulled. The plugin **never carries** the corpus (decision §3.4). Additive to `vc-fix` (one new script, one new profile field), so `vc-perf`'s `>=0.7.0` dependency is unaffected | 3 | `/project-init` on a fresh project writes `knowledgeBase` into the profile and the readiness table shows the row; `kb stat` run from the project with no `KB_BASE` finds the base; `/project-init --check` on a profile without the field adds it; offline, the hook says "not pulled, HEAD <sha> from <date>" and `kb` still works; with no checkout and no network, `kb` exits 2 with the not-found message — never an empty catalog |
| 4 | SessionStart hook: the catalog in context | new `hooks/session-catalog.mjs`: reads `captured-catalog.md` + `flows-catalog.md`, prepends the protocol paragraph now in `make-brief.mjs` (extract it into `src/protocol.mjs` so brief and hook cannot drift), emits `hookSpecificOutput.additionalContext`; refuses to emit past the catalog budget and says so | 3 | a new session in the consumer repo shows the catalog under `/context`; `kb show <id>` of a row works; the emitted text is under 10,000 chars and ~5k tokens (`catalog-budget.mjs`) |
| 5 | Arrival hook, filtered and cached | `src/arrive.mjs` (written+flow only; skip `DELETE`; per-session seen-set in `${CLAUDE_PLUGIN_DATA}/arrivals-<session_id>.json`), `capture.mjs`/`reindex` (write `coordinates.json`), `hooks/hooks.json` (`matcher` on navigation/HTTP tools, explicit `timeout: 5`) | 4 | replay: `replay-logs.mjs` with the filters still shows `KB-27B4CD10` at r3 A call 8 and r3 B call 9, and zero derived-only events; timing on the copy under 120 ms; the hook fires once per coordinate per session (run the same payload twice) |
| 6 | The skill | `plugins/vc-kb/skills/register/SKILL.md` (< 500 lines, third-person `description` with trigger words): the protocol; when to open an entry; `confirmed` may be acted on, `single-observation` verified, `disputed` read first; mechanism not instance; `capture --help`; the end-of-run compound step ("before writing the report: what did you learn that the register does not hold; what did you rely on — confirm it with `--note`") | 3 | dry run on the copy: a session given a small task opens one entry by id, confirms it with a note, captures one new fact; the journal shows the four rows |
| 7 | Stop hook: write before you stop | `hooks/stop-nudge.mjs`: read this session's kb journal (or `demand.jsonl` `use` rows for `session_id`); if entries were read and nothing written, `decision: "block"` once with the list; marker in `${CLAUDE_PLUGIN_DATA}` so it fires once | 2.5 | a test session that opens one entry and stops is nudged once and not twice |
| 8 | Fix `deliver`'s MISS block (D2) | `src/deliver.mjs` + a test in `test/retrieval.test.mjs` | 1 | `kb deliver "how do I create a percentage discount promotion"` names `KB-EB228603` |
| 9 | Fresh extract, rot check, baseline (D5, D7) | one authorized session: `kb extract --env vcptcore_stable`; `kb refute`; then `kb refute --baseline`; commit `vc-knowledge` | 2 | `pin.json` says `.27`; `refute` prints its ROTTED count before the baseline moves; `validate` OK; the `/api/platform/profiles` anchor resolves or the notice text is softened |
| 10 | Identity collision → `--distinct <reason>` (D6) | `src/capture.mjs`, `bin/kb.mjs`, `test/capture.test.mjs` | 1.5 | the brief's collision case writes with a reason row instead of a re-anchor |
| 11 | Rehearsal run and the demo page | consumer repo with the plugin installed via `--plugin-dir`; the round-five template on `/api/order`; archive the log; write `measurements/kb-demo-2026-09/RESULT.md` with numbers printed by scripts, not typed | 4 | the journal shows ≥1 arrival read, ≥1 `confirm --note`, ≥1 `capture`; a second fresh session's catalog contains the new entry |
| — | buffer | | 3 | |

Stream A above totals 29.5 h including the buffer.

**Stream B — the shipped knowledge into the base**

| # | step | files | h | check |
|---|---|---|---|---|
| B1 | The `normative` plane | `src/planes.mjs` (`WRITTEN_STORES.normative → rules/`), `src/capture.mjs` (`fingerprint` branch by rule id + scope, like `flow`; `kb capture --rule`), `bin/kb.mjs` (`kb rules <domain>`; `kb show BL-…` alias by subject prefix), `buildCapturedArtifacts` (rules catalog sectioned by BL domain with a severity column), `validate.mjs` (same artifact checks as flows), tests | 5 | `npm test` green with the new cases; `kb capture --rule` on a copy writes `rules/KB-….md`, `rules-catalog.md` has one section per domain; `kb show BL-CART-003` opens it |
| B2 | Import `business-logic.md` | `scripts/import-business-logic-2026-09-<dd>.mjs` with `--dry-run`, parsing the fixed skeleton, writing through `capture()`, three-way human queue (§3), `from:` = `BL-AUDIT-2026-09-08.md` where that report is the one named, else the file at its commit; a sample of 20 read by a person | 5 | dry run prints 216 parsed / N to write / M queued, and M includes the 13 known collisions; after the run `kb validate` OK; `kb refute --baseline` re-taken after B2, not before |
| B3 | Import `vc-bug-catalog.md` and ECL `[OBSERVED]` rows | `scripts/import-patterns-2026-09-<dd>.mjs`; `appliesTo deployment=vcst` on the stand-bound ones; `from:` rows | 3 | 55 + ~180 parsed; every entry with a memory-slug cross-ref carries `from:` naming the catalog file at its commit and prints `single-observation` |
| B4 | Delete the derived-plane copies and re-point the agents | remove `api/graphql-schema.md` and the contract tables; replace the 23 `BL-*` citations' file paths in `plugins/vc-fix/agents/*` and skills with `kb rules <domain>` / `kb show BL-…`; extend `hooks/session-catalog.mjs` with the 24-line rules domain index | 2.5 | grep finds no `knowledge/oracles/business-logic.md` path in the plugin; a session's injected context shows the domain index under the surprises catalog |

Stream B totals 15.5 h. **Stream A + B ≈ 45 h; 30 h is not both.**

**The owner's order: migration first, then the demo.** So the 30 hours run as follows, and the
consequence is named rather than hidden:

| order | steps | h | running total |
|---|---|---|---|
| 1 | B1 the `normative` plane, B2 import `business-logic.md` | 10 | 10 |
| 2 | A1 re-port, A2 manifest, A3 base via `/project-init`, A4 catalog at session start (with the rules domain index), A6 the skill, A9 fresh extract and baseline | 14 | 24 |
| 3 | B3 import patterns and ECL rows, B4 delete the copies and re-point the agents | 5.5 | 29.5 |
| 4 | A5 arrival hook with filters, A11 rehearsal run | 8 | 37.5 |

Thirty hours end inside row 3. **The demo that fits the budget shows the catalog, the rules by
domain, the write-back loop and the 13-entry collision queue, and does not show the arrival hook
running live** — the hook stays a replayed measurement (`replay-logs.mjs`) until row 4 is paid for.
Steps 7, 8 and 10 are not in any row. The old `business-logic.md` stays in `vc-fix` until B4 lands,
so nothing is dark in between.

**Cut, in this order, if even that runs long:** B2's sample review shrinks to 10; step 7 (the skill's
compound step is the fallback); step 10; the cache half of 5 (keep the filters; 180 ms is survivable
for a demo); step 8 (`deliver` is not on the demo path once the skill points at `kb show`).

**Not in the plan, deliberately:** an MCP server (decision §3.3), embeddings, a sixth measured round
with a sealed prediction (the rehearsal in step 11 is a rehearsal and is labelled one), migrating the
plugin's operating instructions into the base (they are not knowledge about the platform — §7 Q1).

---

## 6. The demo script

Twenty minutes. The order is chosen so that the null results are said by the presenter before anyone
asks, and the live part shows the loop rather than a number.

1. **Open with the three nulls (2 min).** One slide: 194 / 211 / 232; 7.5 / 7.5 / 8.0; 7.0 / 7.0 /
   7.0. Say: "measured three times whether an agent with this base does the task better or faster —
   no, three times, inside noise. This demo does not claim speed and does not claim tokens."
2. **Say what it is instead (2 min).** "A register of this deployment's surprises, keyed by where you
   meet them." Show three entries as one-liners: the Active column, the empty tax widget, the two
   clocks on one blade. Say where each came from and who confirmed it — the `attested` column.
3. **What rounds four and five showed (3 min).** Round four: 4 substantive uses, 3 opens, 2 observed
   confirms, one contradiction built by reading an entry in full. Round five: 7 licensed entries under
   the task; licence taken twice, both held; 13 re-verified, all held; one mechanism corrected and the
   correction written; 6 new entries. Say: "the licence was mostly declined, and that is the finding."
4. **Live: a fresh session in the consumer repo (8 min).** The plugin is installed. Start a session —
   the catalog arrives (show `/context`). Give a small task on covered ground: "why does the storefront
   show this member as Active when Admin says the account is locked". Watch the agent navigate to
   `/company/members` — the hook arrives with `KB-27B4CD10` (the entry that would have saved two
   armless arms five calls; say that). The agent reads it, confirms with `--note`, and finds one new
   thing (the task is chosen so it will: the Status filter finds nobody, `KB-82111688`, is
   single-observation). It captures. Open the file: `by: session:…` set by the tool, `at`, the version
   stamp from the fresh pin, the note.
5. **The loop closes (2 min).** Start a second fresh session. Its catalog contains the new entry.
   That is the deliverable of decision §3.1 and nothing else is claimed.
6. **What the numbers do not show (2 min).** n = 1 per arm; round five's ground was chosen for
   coverage so rediscovery there is commissioned; writing is still end-loaded (calls 171–196 of 200);
   the hook ran in no measured arm before today; the catalog costs about 5k tokens a session; the pin
   was a patch behind for two rounds and the rows say so.
7. **Q&A the presenter should expect, with the honest answers.**
   * *Is it faster?* No, measured three times. *Then why?* It stops a fact from being found twice;
     twelve times in the archive a run paid for a fact the base held (`rediscovery.mjs`, the
     reviewer's number).
   * *Why not embeddings?* 184 KB; Anthropic's own threshold for "just put it in the prompt" is
     200k tokens; Claude Code's own memory index is 200 lines.
   * *Where did `business-logic.md` go?* Into the base, as 216 `normative` entries, one per file,
     each with its source anchor, its Verify step and a `from:` row naming what it was read out of.
     Thirteen of them collide with what agents observed on this stand and sit in a queue for a
     person; none was imported as `confirmed`, because the only audit report on disk covers one date.
     The rules are read by domain, on demand; the surprises arrive on their own.
   * *Who writes to it at a customer?* Virto's agents, into Virto's repository. The plugin ships the
     reader and the door; the corpus is a separate clone (decision §3.4). How a customer's own surprises
     come back is open — §7.

---

## 7. Open questions for the owner

Eight questions were answered on 2026-09-16 (see the decisions block at the top). What remains:

1. **ECL's `[OBSERVED]` rows.** "Do not touch" was said of the generic chapters. B3 still imports
   the 182 `[OBSERVED]` rows and chapter 14 as observations with `from:`. Confirm that those are
   meant to move, or B3 shrinks to the 55 bug-catalog patterns.
2. **Discard the 14 probe rows in the live `demand.jsonl`?** Recommended; it is your working tree.
3. **The demo without the arrival hook.** In the owner's order the 30 hours end before the hook and
   the rehearsal (§5, row 4). The demo then shows the catalog, the rules by domain, the loop and the
   collision queue, and cites the hook only as a replayed measurement. Accept, or trade B3/B4 for
   the hook.
4. **Is the rehearsal a round six?** With a sealed prediction and a control arm it costs another
   afternoon and its numbers may be quoted; without, they stay off every page.
5. **Tier two.** 13 request-reachable licensed entries need one authorized session against the
   stand; it rides on step A9. Before the demo or after.

---

## Appendix A — the seven hypotheses from the prior pass, verified

| # | hypothesis | verdict | how |
|---|---|---|---|
| 1 | `plugins/vc-kb/` is not a plugin | **confirmed, and worse**: also stale by 7 modules and 98 tests, with 1 failing | `find plugins/vc-kb -maxdepth 2`; `PORT.md`; `diff -rq`; `node --test` |
| 2 | access is pull-only and agents front-load it | **confirmed for reads in rounds 1–3; the shape in rounds 4–5 is end-loaded writes**: opens at calls 3/95/150, all 31 writes at 171–196 of 200 | `src/arrive.mjs` header; timestamp join of round-5 logs |
| 3 | `deliver` drops the cross-plane pointer that `ask` gives | **confirmed** on the copy; root cause in `src/deliver.mjs` lines 19–33 | ran both verbs |
| 4 | 78% of the corpus has never reached anyone | **confirmed: 78.4%** (543 of 693); captured-active 65% used, `gql-type` 11%, flows 100%; the denominator still includes the author's build sessions per the reviewer (the script has no exclusion flag) | `utilization.mjs` |
| 5 | retrieval is lexical only and fails in both directions | **confirmed**: control refuses 0 of 3 negatives; every candidate that refuses them loses 5–31 anchors; the reviewer's diagnosis (vocabulary) stands and the address-book change did not fix it (`ADDRESS-BOOK-COST.md`) | `sweep.mjs`, `replay-questions.mjs` |
| 6 | the right frame is a register of surprises keyed by where you meet them | **agreed**, with one amendment: the "no free-text retrieval" half is right, the "dozens of entries" half is a budget question the catalog-budget notice already asks; and "measured by rediscovery avoided" needs the oracle drawn from outside the corpus, which round five's template is the first attempt at | §1, §4 |
| 7 | round five is the first non-null signal | **agreed, narrowly**: 2 acted / 7 re-verified / 4 untouched, both acted held, on commissioned ground with n = 1; the sealed prediction was half right (2 of 4 named entries used; 6 new entries against 1–3 predicted). It survives its caveats as evidence that the licence is *sometimes* taken and has not yet done harm, and as nothing more | `RESULT.md`, `VERDICTS.json`, arm C `REPORT.md` |

## Appendix B — the frontmatter census (88 active entries, 2026-09-16)

Computed by a one-off script over `captured/*.md` in this session; re-derive rather than quote.

| | |
|---|---|
| files / active / retired | 100 / 88 / 12 |
| active bytes; median; min; max | 184,496; 1,991; 1,216; 7,222 |
| evidence rows on active entries | 156 = 141 observation + 8 source + 7 contradicting (`kb stat` agrees) |
| rows with tool-set `by` / with `from` / with `note` / with neither `by` nor `from` | 136 / 17 / 22 / 20 |
| rows stamped `3.1007.26` / `3.1007.27` / unstamped | 87 / 9 / 60 |
| deployments named | `vcptcore_stable` only (148 rows) |
| `refutableBy` | observation 87, anchor 1 |
| scope axes (top) | surface=admin-ui 39, rest 35, storefront-ui 28, storefront-xapi 20, principal=customer 10, graphql 7 |
| entries with `arrivesAt` | 9 |
| catalog bytes (captured + flows) | 19,013 + 1,094 |

## Appendix C — sources fetched (external practice)

Karpathy, *LLM Wiki* gist (raw), created 2026-04-04 — https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f ·
*LLM Wiki v2* — https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2 · agentmemory — https://github.com/rohitg00/agentmemory ·
Akita, 2026-05-18 — https://akitaonrails.com/en/2026/05/18/ai-agent-memory-karpathy-llm-wiki-agentmemory/ ·
llm-atomic-wiki — https://github.com/cablate/llm-atomic-wiki · *The Schema Is the Product* — https://cozypet.github.io/llm-wiki-schema/ ·
axiomhq/agent-memory — https://github.com/axiomhq/agent-memory ·
Anthropic, *Contextual Retrieval*, 2024-09-19 — https://www.anthropic.com/news/contextual-retrieval ·
Anthropic, *Agent Skills*, 2025-10-16 — https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills ; overview and best practices — https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview , https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices ·
Anthropic, *Effective context engineering for AI agents*, 2025-09-29 — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents ·
Anthropic, *Harness design for long-running apps*, 2026-03-24 — https://www.anthropic.com/engineering/harness-design-long-running-apps ·
Claude Code docs: hooks — https://code.claude.com/docs/en/hooks ; plugins — https://code.claude.com/docs/en/plugins ; plugins reference — https://code.claude.com/docs/en/plugins-reference ; memory — https://code.claude.com/docs/en/memory ; skills — https://code.claude.com/docs/en/skills ·
Manus, *Context Engineering for AI Agents*, 2025-07-18 — https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus ·
Cognition, *Don't Build Multi-Agents*, 2025-06-12 — https://cognition.com/blog/dont-build-multi-agents ·
Zhou et al., *Filesystem-Based Memory for LLM Agents*, 2026-07-29 — https://arxiv.org/abs/2607.26637 ·
de Assis, *Three Months of my LLM-wiki*, 2026-07-19 — https://medium.com/@paulo.deassis/three-months-of-my-llm-wiki-a-follow-up-and-an-update-43d95cc9246b ·
Letta, *Evaluating Memory in Production Agents*, 2026-07-28 — https://www.letta.com/blog/evaluating-memory-in-production-agents/ ; *Towards Agents That Learn*, 2026-06-25 — https://www.letta.com/blog/towards-agents-that-learn/ ; *Context Repositories*, 2026-02-12 — https://www.letta.com/blog/context-repositories/ ; MemFS — https://docs.letta.com/concepts/memfs ·
Teymoori, 2026-08-03 — https://amirteymoori.com/ai-agent-memory-markdown-files-vs-vector-mem0-2026/ ·
Mem0, *State of AI Agent Memory 2026* — https://mem0.ai/blog/state-of-ai-agent-memory-2026 ; *Your AI Agent's Memory Is Just a File?*, 2026-09-11 — https://mem0.ai/blog/your-ai-agents-memory-is-just-a-file-thats-the-problem ·
Zep/Graphiti, arXiv 2501.13956, 2025-01-20 — https://arxiv.org/abs/2501.13956 ·
CORE-Bench, arXiv 2606.11864, 2026-06 — https://arxiv.org/abs/2606.11864 · Zhang & Song, arXiv 2606.19121, 2026-06-17 — https://arxiv.org/abs/2606.19121 · Ding et al., arXiv 2606.30306, 2026-06-29 — https://arxiv.org/abs/2606.30306 ·
*SoK: Agentic Skills*, arXiv 2602.20867, 2026-02-24 — https://arxiv.org/abs/2602.20867 · Voyager, arXiv 2305.16291 — https://arxiv.org/abs/2305.16291 ·
Cherny quoted: vadim.blog, 2026-03-03 — https://vadim.blog/claude-code-no-indexing/ (the X post itself was not fetched) ·
compound-engineering plugin — https://github.com/EveryInc/compound-engineering-plugin · AGENTS.md — https://agents.md/ ·
Sourcegraph, 2026-05-21 and 2026-05-28 — https://sourcegraph.com/blog/agentic-coding , https://sourcegraph.com/blog/context-engineering · Aksan, 2026-05-19 — https://ceaksan.com/en/code-search-for-ai-agents-which-tool-when ·
VirtoOZ `PlatformDeveloperGuide`: Module Versioning and Dependencies; New Tax Provider Registration; Register New Shipping Method (docs.virtocommerce.org).

Not fetched, therefore not relied on: Cursor Memories documentation (404 / redirect), Boris Cherny's X post directly, the "LLM Wiki v2" creation date, mem0's exact publication date (page shows two).
