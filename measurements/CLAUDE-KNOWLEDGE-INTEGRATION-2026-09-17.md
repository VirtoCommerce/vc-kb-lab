# `.claude/knowledge` and the base — what is actually there, and how to join them

Written 2026-09-17, after the owner corrected the premise a second time: the current knowledge is
not `plugins/vc-fix/knowledge/`, it is **`vc-mcp-testing-module/.claude/knowledge/`**. Everything
below was measured this session against the working tree at `f62fd324`, not recalled.

---

## 0. The correction, and what it does and does not change

I reviewed and imported from the plugin mirror. The plugin mirror is a **declared, gated fork** of
the root tree, not a copy of it.

| | `.claude/knowledge` | `plugins/vc-fix/knowledge` |
|---|---|---|
| files | **56** | 34 |
| bytes | **1,951,466** | ~1.2 MB |
| tracked in git | yes | yes |
| files the other does not have | 21 | 5 (all plugin-specific: `plugin-root.md`, `azure-html-format.md`, `frontend-local-verify.md`, `upstream-schema.md`, `adr-upstream-default-deny.md`) |

**The B2 import is unaffected.** `oracles/business-logic.md` is **byte-identical** in both trees,
and that is not luck — `scripts/maintenance/mirror-check.mjs` lists it in the IDENTICAL bucket and
CI fails on any drift. The same holds for `e-commerce-edge-cases-library.md`. The 216 rules already
imported came from the right bytes.

**What it does change: B3.** `oracles/vc-bug-catalog.md` is 483 lines in the root and 382 in the
plugin, a declared `plugin-scope` fork; `oracles/critical-ui-scope.md` is 1359 against 1342, same
reason. B3 must read the root copy. And the 21 root-only files are most of the value I had not
seen.

---

## 1. What is in the 56 files

| layer | files | what it is | unit |
|---|---|---|---|
| `oracles/` | 4 | **business-logic.md** 216 `BL-*` rules in 25 domains · **e-commerce-edge-cases-library.md** 59 sections, 16 `ECL-*` ids, 182 `OBSERVED` rows · **vc-bug-catalog.md** 55 `VC-*` historical failures · **critical-ui-scope.md** the `BL-UI` matrix, 1359 lines | a claim with an id |
| `domain/` | 11 | three real **domain maps** (`b2b`, `loy`, `sr` — 51/66/68 KB) plus seven older references and two generated snapshots (`release-ledger-snapshot.json` 232 KB, `sitemap-snapshot.vcst.json`) | a document read whole |
| `api/`, `architecture/`, `automation/` | 11 | surface inventories, the generated `graphql-schema.md`, selectors, browser quirks | a document |
| `execution/` | 20 | preflight, tags, lanes, pipelines, promotion, ticket routing, reports policy | **operating instructions** |
| `agents/`, `ba/`, `diagnostics/` | 5 | shared agent instructions, BA doc style, the self-check oracle | **operating instructions** |

Decision 3 already drew that last line: operating instructions stay with the skills. Measured
against the root tree, that is **25 of 56 files** — more than I said in the review, because the
`execution/` family has grown by 14 files the plugin never received.

### What the corpus already does that the base does not

This is the part I had wrong, and it is the whole of the recommendation below.

* **`domain_slug` is a mechanical join key.** `scripts/maintenance/check-domain-maps.mjs`
  `DOMAIN-005` fails a map whose slug is not a real `bl:extract` domain. The domain maps and the BL
  oracle are already joined, and the join is gated.
* **Freshness is a contract with a test.** `stale_after_days: 60` / `expires_after_days: 120` on
  every domain map, enforced hard by `domain:check`; `stale_after_days: 45` on `release-ledger.md`,
  enforced by `scripts/unit/release-ledger.test.mjs` inside `npm test`. A stale map **fails**; a
  missing map **passes** — the asymmetry is deliberate and argued in the script.
* **There is a verbatim slicer, and it is measured.** `bl:extract --domain cart` returns the
  oracle's own markdown by line range, never a re-rendering. Its header records 7.5% of the file,
  ~7.2K tokens against ~96K. It exists because agent briefs point at the oracle by path and each
  one reads all 386 KB to use three invariants — its header cites ~41 briefs; measured this session,
  **67 files** outside the plugin name that path, 12 of them in `.claude/agents/`, 7 in `ci/agents/`
  and 7 in `.claude/commands/`.
* **There is a demand signal, and it is large.** `regression/` and `config/` carry **5,890
  citations** of **279 distinct `BL-*` ids**. The oracle holds 216, so roughly 63 cited ids are
  dangling or `PROPOSED-BL-*`, which `lint-bl.ts` `BLC-002` already reports.
* **There is a significance model.** `oracle-significance.ts` (604 lines) scores business value
  (the entry's own severity tag) against product value (citation count, cross-domain reach,
  platform confirmation), combines them by **conjunction** rather than sum, and gates promotion at
  T2. `rank-oracles.ts` prints the queue.
* **There is a context budget with a ratchet.** `lint-claude-docs.mjs`: 80,000 chars always-loaded
  (CLAUDE.md + `.claude/rules/`), 2,500 chars per line, 19,000 chars per prompt file, plus
  ratchets for dead `npm run` targets, dead paths, dead `§Section` anchors, and transcribed derived
  counts. Knowledge files are Tier 2, cited on demand, and cost nothing per turn.
* **The mirror is a declared ledger.** 16 knowledge paths are declared forks — 12 `plugin-scope`,
  3 `undecided` (the burn-down list), 1 `root-ahead`. The script's own header records that 64 of 92
  shared paths had diverged with nothing recording which divergences were meant.
* **CI runs four of these gates** — `context:check`, `bl:lint && ecl:lint`, `releases:check` — in
  `.github/workflows/gates.yml`.

### What the corpus does not do, and the base does

* **No claim inside a file has provenance.** `business-logic.md` says "CONFIRMED 3/3" and
  "triangulated" as *sentences*. Nothing counts parties, nothing distinguishes a source reading
  from a sighting, nothing records which deployment or which pin.
* **Freshness is per FILE, not per claim.** A 66 KB map is fresh or stale as a whole. One
  observation inside it going wrong is invisible until the whole map is regenerated.
* **Disagreement overwrites.** There is no structure for "the rule says X, the deployment does Y,
  both stand". The overlap annex found 13 such pairs and the only place they exist is that annex.
* **Nothing is checked against the live contract.** The base's derived plane is 590 entries
  regenerated from the deployment's own swagger and GraphQL introspection and byte-gated by
  `kb check`. The corpus has `graphql-schema.md`, generated but ungated against anything.
* **Retrieval is by path and slug only.** There is no way to ask a question, and no way to reach a
  claim from a coordinate you are standing on.
* **The corpus's own index rots.** `.claude/knowledge/README.md` opens "Cross-agent reference files
  **(32)**". There are 56.

---

## 2. The recommendation

**Do not pour 56 files into one plane and index the text.** The two systems are not two attempts at
the same thing; they hold different units of knowledge and each is strong where the other is weak.
The join is an **id and a coordinate**, never a copy — the project's own first rule, applied to
corpora rather than to values.

### 2.1 Four units, one store

`vc-knowledge` becomes the single store, with a **fifth plane** for the unit it cannot currently
hold:

| plane | unit | from | how it is reached |
|---|---|---|---|
| `derived-first` | a contract coordinate | regenerated from the deployment | by coordinate; byte-gated by `kb check` |
| `normative` | **one rule, by its author's id** | `business-logic.md` (216, done) · ECL `ECL-*` + the 182 `OBSERVED` rows · `vc-bug-catalog.md` 55 `VC-*` · `critical-ui-scope.md` `BL-UI` | `kb rules <domain>`, `kb show BL-CART-003` |
| `experiential` | **one observation, with provenance** | agents at work (100 today) | ranked search, coordinate arrival |
| `flow` | one procedure | agents at work (3 today) | `kb how` |
| **`reference`** *(new)* | **one document, read whole** | the three domain maps, `sitemap.md`, `catalog.md`, `products.md`, `store-settings.md`, `white-labeling.md`, `mobile-navigation.md`, `api/*`, `architecture/*`, `automation/*`, `release-ledger.md` | **`kb domain <slug>`** |

**Why a document is a plane and not 400 claims.** A domain map answers "what is this feature and
where are its surfaces", and it answers it by being read start to finish before the work begins.
Chopping `b2b-organizations.md` into claims would destroy the one thing it is for — orientation —
and would hand the arrival hook 400 more reasons to fire. The review already found that isolated
facts arriving do not substitute for orientation. So the `reference` plane's identity is
`(domain_slug, path)`, its evidence is the file's own `sources:` list, and its freshness is the
`stale_after_days` contract it already carries, checked by `kb validate` instead of by
`domain:check`.

### 2.2 What moves, what stays, what is deleted

| | what | where it ends up |
|---|---|---|
| **moves to the base** | the 4 oracles, the 11 `domain/` files, `api/*`, `architecture/*`, `automation/*` — **31 of 56** | `normative` + `reference` planes |
| **stays with the skills** | `execution/` (20), `agents/` (3), `ba/` (1), `diagnostics/` (1) — **25 of 56** | decision 3, unchanged. These are how to run the suite, not what the platform does |
| **stays generated, never imported** | `release-ledger-snapshot.json` (232 KB), `sitemap-snapshot.vcst.json`, and `api/graphql-schema.md` | they have refresh scripts and drift guards already; `graphql-schema.md` is superseded by the derived plane, which is gated where it is not (decision 10) |
| **deleted, not migrated** | the whole `knowledge/` half of the plugin mirror | 28 shared paths leave `mirror-check.mjs`, and **3 `undecided` forks are resolved by deletion rather than by adjudication** |

### 2.3 The toolchain does not get rebuilt — it gets re-pointed

This is the part that would be easiest to get wrong. Five scripts, 1,531 lines, already work. Only
one of them can move.

| script | what happens | why |
|---|---|---|
| `lint-bl.ts` structural half (BLL-001…005) | **replaced** by `kb validate` + `src/rules.mjs` | duplicate id, severity tag, required fields, domain-prefix mismatch and numbering gaps are all things the base's gate already decides, or decides with a few lines |
| `extract-bl.ts` | **replaced** by `kb rules <domain> --text` | one addition to `bin/kb.mjs`: emit the verbatim bodies rather than a listing. The 41 briefs then cite a verb instead of a 386 KB path |
| `lint-bl.ts` coverage half (BLC-002/004/005) | **stays in the testing repo**, reads `kb rules --json` | the demand lives in `regression/suites/**.csv`, which is not the base's business and never will be |
| `rank-oracles.ts` + `oracle-significance.ts` | **stays in the testing repo**, reads `kb rules --json` | same reason: severity comes from the base, citations come from the consumer |
| `check-domain-maps.mjs` | **replaced** by the `reference` plane's freshness check in `kb validate` | the contract travels with the document |
| `mirror-check.mjs` | **shrinks** by 28 paths | the knowledge half stops existing |
| `lint-claude-docs.mjs` | **unchanged, and it constrains us** | whatever the plugin ships must fit 80,000 always-loaded chars and 19,000 per prompt file |

The asymmetry is the finding: **the base owns what is true, the consumer owns what is wanted.**
Severity, text and identity move; citation demand does not.

---

## 3. Indexing, concretely

Six changes, in the order they pay off.

1. **`kb domain <slug>`** — the highest-value addition, because it matches how the corpus is
   already keyed and how `/qa-test` already dispatches. One slug returns: the domain map to read
   first, that domain's rules, the observations on coordinates the map names, and the contract
   namespaces behind them. It needs a `domain_slug` axis in the index, which three files already
   carry and `bl:extract` already validates against.
2. **Rules enter `kb ask`, in their own block.** Today `resolve.mjs` loads the derived, captured and
   flow indexes and not the rules index, so a question a rule answers returns the observations
   around it and never the rule. Rules go into the ranked list **after** what somebody saw and
   under their own heading — 216 unattested entries mixed into 100 observed ones would drown the
   half of the corpus that was earned.
3. **Import the citation count as a read-only signal.** 5,890 citations across 279 ids is a demand
   measurement the base could not produce in a year of arrival replays. Attached per rule, it
   answers "which of these are worth verifying" immediately, and it makes the verification queue
   obvious: a rule cited by dozens of cases and observed by nobody is the top of it. Refreshed by
   the consumer, never typed.
4. **A `reference` index keyed on (slug, section).** A document plane needs section-level
   retrieval — `b2b-organizations.md §3` — or the unit is too big to hand anybody. Headings are the
   natural key and the corpus already writes `file.md §Section` citations that
   `lint-claude-docs.mjs` `DOC-004` checks.
5. **Freshness in the gate.** `stale_after_days` / `expires_after_days` become `kb validate`
   notices, and expiry becomes a failure, keeping `domain:check`'s asymmetry: stale fails, absent
   passes.
6. **Do not index the snapshots.** `release-ledger-snapshot.json` alone is 232 KB of generated JSON
   with its own refresh script and drift test. Text-indexing it would add a ninth of the corpus's
   bytes for nothing readable.

---

## 4. What this costs, and what is already spent

B2 delivered the `normative` plane and 216 rules, verified against a copy. Against the plan in
`HANDOFF-2026-09-17.md` §5, the new work is:

| step | | est. |
|---|---|---|
| B3′ | the remaining oracles, from the **root** tree: ECL (16 ids + 182 `OBSERVED` rows), `vc-bug-catalog.md` (55), `critical-ui-scope.md` (`BL-UI`) | 4 h |
| B5 | the `reference` plane: schema, `kb validate`'s freshness check, the importer for 11 documents | 5 h |
| B6 | `kb domain <slug>`, and `kb rules <domain> --text` for the 41 briefs | 3 h |
| B7 | `kb rules --json` + re-point `lint-bl` coverage, `rank-oracles` at it; delete the structural half | 3 h |
| B8 | rules into `kb ask` under their own heading; import the citation counts | 3 h |

That is 18 hours on top of what B2 spent, and it does not fit the 30-hour budget alongside stream
A. The budget question is therefore live again and it is the owner's: **the demo can show the
accumulation loop on what exists today (B2 + A1–A6), or it can show the joined corpus, but not
both by the same date.**

---

## 5. What is the owner's to decide

1. **Does `execution/` really stay?** It is 20 files and 14 of them the plugin has never seen.
   Decision 3 said operating instructions stay with the skills, and I still think that is right —
   but it was taken against a 34-file tree, not this one.
2. **`reference` as a fifth plane, or documents left in the repo and merely *cited* by the base?**
   The second is cheaper and honest, and it keeps `domain:check` where it is. It also means the
   knowledge does not fully leave the project, which contradicts decision 1.
3. **Who owns `rank-oracles`' promotion bar once severity lives in the base?** Today one script
   decides both what is true and what is worth carrying. Splitting them across two repositories is
   correct and is also a new seam.
4. **The 63 dangling `BL-*` ids.** 279 cited, 216 exist. They are pure demand — test cases citing
   rules nobody has written. That is the best candidate list this project has for what to write
   next, and nothing currently reads it.

---

## 6. Can the two bases coexist?

**Yes — but only under a rule that makes it not-duplication, and the rule has to be mechanical.**

That is not a theoretical worry in this repository. `mirror-check.mjs` exists because the last time
two copies of this corpus were kept side by side, **64 of 92 shared paths diverged** with no record
anywhere of which divergences were meant. Coexistence with prose governing it produced exactly the
defect it was supposed to prevent. Two bases governed by prose would reproduce it one level up, and
the symptom would be the same 13 contradictions the overlap annex already found.

The rule that works is **one home per unit, and a reference from the other side**:

| unit | one home | the other side holds |
|---|---|---|
| a rule (`BL-*`, `ECL-*`, `VC-*`, `BL-UI-*`) | **the base** | nothing — it cites the id |
| a document (domain map, surface inventory) | **the base, as a file** | nothing — it cites the path |
| an observation | **the base** | nothing; the repo has no structure for one today |
| a contract coordinate | **the base's derived plane** | nothing; `api/graphql-schema.md` is deleted (decision 10) |
| how to run the suite | **the repo, with the skills** | nothing — the base never holds it (decision 3) |
| **which test case cites which rule** | **the repo** | the base never holds it; it is a fact about the suites |

The last row is the one that makes coexistence honest rather than a slow merge: **the base owns what
is true, the consumer owns what is wanted.** Severity, text and identity live in the base; the 5,890
citations that measure demand live where the suites live and are read across, never copied.

---

## 7. The defects in `.claude/knowledge`

Measured 2026-09-17. **Start with what is not wrong**, because it is the part I got wrong first:

* Its own gates pass. `bl:lint` reports **72 findings, 0 blocking**; `ecl:lint` **0 at or above
  High**; `domain:check` **OK, every map fresh**; `releases:check` **OK, matches upstream**.
* **53 of 56 files are cited by path from outside the directory** — `business-logic.md` 98 times,
  `graphql-schema.md` 63, `quality-gates.md` 45. The three that are not are the two newest domain
  maps, written a week ago, and one generated snapshot. This corpus is **connected**. Ours was not:
  78.5% of our entries had never been served and never arrived.

The defects are specific and structural, and every one of them is a thing its gates cannot see.

**D1 — 82% of the corpus is in files too big to hand an agent whole.** 23 of 54 markdown files
exceed the repo's own 19,000-char prompt budget, and those 23 hold **1,399,643 of 1,706,974 bytes**.
Exactly two of them have a slicer (`bl:extract`, `ecl:extract`). The other 21 — including
`critical-ui-scope.md` at 96 KB, the three domain maps at 51–68 KB, and `test-data-authoring.md` at
51 KB — are read whole or not at all. The corpus has already proved this matters: `bl:extract` was
written because agents were reading 386 KB to use three invariants, and it was measured at 7.5%.
Nothing generalised that fix.

**D2 — 50 of 54 files carry no freshness contract.** `stale_after_days` covers the three domain maps
and the release ledger. The two files with the most authority in the whole repository — the 389 KB
BL oracle and the 121 KB edge-case library — have none, and neither does the 96 KB UI matrix. A
stale domain map fails CI; a stale invariant does not exist as a concept.

**D3 — evidence is prose, in nine spellings.** Counted across the corpus: `triangulated` 105,
`[OBSERVED]` 183, `UNVERIFIED` 53, `live-confirmed` 33, `{OBSERVED}` 29, assumed/unconfirmed 24,
`CONFIRMED n/n` 12, `source-read` 4, `NOT VERIFIED` 4. There is no vocabulary, nothing is countable,
and no gate reads any of it. "CONFIRMED 3/3" cannot be told apart from one person writing it three
times — which is the exact failure this project fixed in its own corpus on 2026-09-16, when fifteen
rows naming an arm as their author turned out to be one author transcribing reports.

**D4 — 699 dates typed into prose.** Every one is a value copied onto a page: 238 in 2026-08, 177 in
2026-09. Nothing can say which are still true. This project's first rule is *pin the source, not the
value*, and here it is broken 699 times by hand.

**D5 — no claim can be re-checked.** A claim carries no deployment, no module version, no pin. So
when one goes wrong, the only instrument is a re-audit of the whole file — which is what
`/qa-review-bl` is, and why it is expensive. Per-claim provenance is the thing that turns a re-audit
into a re-check.

**D6 — disagreement has nowhere to live.** When a rule and a sighting disagree, one overwrites the
other or the pair ends up in a review document. Concretely, still true in the root tree today:
`api/api-auth.md:87` says GraphiQL needs "no token needed (uses session cookies from Admin SPA
login)", while `api/graphiql-interaction.md:32` says queries execute as **Anonymous** unless the JWT
is inserted with `execCommand`. Both files are current, both are cited, and no gate can see it
because a contradiction between two files is not a check anybody wrote.

**D7 — nothing is checked against the live contract.** `api/graphql-schema.md` is generated from
introspection and then gated against nothing. The base's derived plane is 590 entries regenerated
from the same deployment and **byte-compared** by `kb check`; a field that disappears is a failure,
not a surprise six weeks later.

**D8 — the biggest coverage hole is reported as noise.** 50 `BLC-002` findings are not scattered
mistakes; they are **whole missing domains**. The suites cite `BL-SEC-*`, `BL-CFG-*`, `BL-GA4-*`,
`BL-L10N-*`, `BL-CMS-*`, `BL-STORE-002..004` and `BL-PAY-002/005/006` — security, configuration,
analytics, localisation, CMS — and the oracle has no chapter for any of them. That is the clearest
"what to write next" list this project has, and it is currently printed at severity Medium in a list
of 72.

**D9 — the hand-maintained index rots.** `.claude/knowledge/README.md` opens "Cross-agent reference
files **(32)**". There are 56. The file that tells a reader what is in the directory is 24 files out
of date.

**D10 — three forks are declared `undecided`.** `agents/developers/shared-instructions.md`,
`architecture/vc-module-architecture.md`, `execution/tracker-ops.md`. The registry itself calls this
the burn-down list: "Nobody has decided which side wins or why."

---

## 8. How to do it right

Five moves, in order. Each one is reversible and each one leaves the repository working.

**1. The base becomes the single WRITER of rules; the file stays as generated output.**
`business-logic.md` is cited by path 98 times and sliced by two scripts. Do not break that. Instead:
the rules plane becomes the source, and `kb rules --render` regenerates `business-logic.md`
byte-for-byte, gated the way `kb check` gates the derived plane. Then 98 citations keep working,
`bl:extract` keeps working, CI keeps passing, and there is exactly one writer. When the consumers
have moved to `kb rules <domain> --text`, the generated file is deleted and nothing notices.

*This is the move that makes everything else safe, and it is the one I would do first.*

**2. The documents move as FILES, not as entries.** `vc-knowledge` is a git repository. A domain map
becomes `reference/domain/b2b-organizations.md` — the same bytes, the same frontmatter — plus one
index row carrying `(domain_slug, section headings, coordinates named inside)`. `domain:check` moves
into `kb validate` with its asymmetry intact: stale fails, absent passes. Nothing is atomized.
Chopping a 66 KB map into 400 entries would destroy the one thing it is for, and would hand the
arrival hook 400 more reasons to fire.

**3. Nine spellings of evidence become one column.** Every `[OBSERVED]`, `{OBSERVED}`, `UNVERIFIED`,
`triangulated` and `CONFIRMED n/n` maps onto the evidence row the base already has — a party, an
artefact or a deployment, a date the tool wrote. The 183 `[OBSERVED]` rows in the edge-case library
are the largest single block of real evidence in the corpus and they become 183 attested rows. The
105 `triangulated` mentions become **unattested** rows, because a page asserting its own
confirmation is not a confirmation — the same rule B2 already applies to all 216 imported invariants.

**4. Demand is imported, never copied.** 5,890 citations across 279 ids, refreshed from the suites,
attached to each rule as a read-only count. It answers what our own arrival replay could not: which
rules are worth verifying. And the 63 dangling ids stop being Medium noise and become the written
backlog — D8 is the single most valuable thing in this whole analysis.

**5. Slicing generalises.** `kb domain <slug>` returns the map, the rules, the observations on
coordinates the map names, and the contract behind them. That is `bl:extract` extended to all 23
oversized files instead of two, and it is the reason to have a base at all: not that the prose is
bad, but that **82% of it cannot be handed to anybody whole.**

### What this is worth saying plainly

The corpus is not the problem. It is better maintained than our base on every axis its authors chose
to measure — connectedness, citation integrity, freshness of what it decided to make fresh, context
budget. What it cannot do is per-claim: it cannot say who saw a thing, cannot re-check one claim
without re-auditing a file, cannot hold a disagreement, and cannot hand a reader the 7% of a file
they need unless somebody wrote a slicer for that particular file.

Those four are exactly what the base was built for. That is the argument for joining them, and it is
a better argument than "there should be one place", which is the argument I would have made before
measuring.
