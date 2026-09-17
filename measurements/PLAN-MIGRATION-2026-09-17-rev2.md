# Migration plan, revision 2 — 2026-09-17

Supersedes `PLAN-MIGRATION-2026-09-17.md`. That page is still the record of how the decisions were
reached; this one is what to do. Four owner decisions taken after it was written change roughly a
third of the work, and the order of the phases.

---

## The four decisions that changed it

| # | decision | what it removes |
|---|---|---|
| **A** | **The oracles move as FILES, not as records.** Cutting `business-logic.md` into 217 entries is dropped from this migration and becomes a separate later step | `kb rules --text`, `--json`, `--render`, `kb coverage`, moving the freshness ratchet into `kb validate` — about 13 of phase 2's 18 hours |
| **B** | **`/project-init` always clones the base into the project folder.** No searching the machine | the three-step runtime resolution; the sibling walk; `src/base.mjs:47`'s hardcoded climb |
| **C** | **Minimal edits in `vc-mcp-testing-module`. Adapt to the existing toolchain, do not replace it** | every command rename. `bl:extract`, `bl:lint`, `ecl:*`, `domain:check`, `oracles:rank` keep their names and their code |
| **D** | **The tool ports to `plugins/vc-kb` first, not last** | phase 4 moves to the front; the lab stops being where the tool is edited |

### What decision A does not break

Checked, not assumed:

* an empty `rules/` store is a legitimate state — `kb validate` passes over it (the latent defect
  where `kb reindex` wrote an index and a catalog for an empty store, and the gate then failed on
  that verb's own output, was fixed on 2026-09-17)
* `rules-index.json` sits in the base's `.gitignore` ahead of the store that will fill it. Harmless
* `src/rules.mjs`, the normative plane and `scripts/import-business-logic-2026-09-17.mjs` stay on
  the shelf, finished, costing nothing
* **the 20-entry sample stops being a gate.** There is nothing to read before a live write, so the
  hold on writing to `vc-knowledge` lifts

What is lost is visibility, not function: the 13 disagreements between what the rules promise and
what runs actually observed stay invisible until the import happens. The demo's accumulation loop
does not depend on them — it is carried by the 100 captured observations, their confirmations and
the 5 disputes.

### One thing decided separately: `api/graphql-schema.md` is NOT deleted

Decision 10 of the handoff said the contract copies are deleted rather than migrated. Measured
today, that is half right and does not survive decision C:

| | |
|---|---|
| references to it in the repository | **113** — 9 agents, 3 commands, the domain maps, both `shared-instructions` |
| what generates it | `npm run schema:refresh` → live GraphQL introspection |
| what it holds besides the schema | a **Critical Rules** section — 6 hand-written traps (the `command` wrapper, no `createCart`, `MoneyType`'s shape, `CartType`'s flat money fields, the token form, the facet shape) and the warning that absence from the page is not evidence of absence from the schema |
| what it is not | the full contract. The type sections are a **curated allowlist** (`keyTypes` in the refresher), 140 listed items against **471** tables in `derived/graphql/` |

So the base covers the **mechanical** half more completely and byte-compares it via `kb check`; it
does not cover the six authored rules at all. Deleting the page would mean repointing 113
references at a different format and losing those six.

**It moves as a file like everything else.** `refresh-graphql-schema.mjs` stays; its `OUTPUT`
constant is one of the 23 below. The duplicate contract in the base is accepted knowingly and
recorded: `kb check` does not police that page.

*Later, separately:* generate the mechanical half from the base so `schema:refresh` stops needing a
deployment, and turn the six Critical Rules into captured entries.

---

## Phase 1 — the base in order · DONE 2026-09-17

Full record in `PHASE-1-BASE-TIDY-2026-09-17.md`. In short:

* the **rebuildable** indexes (`captured-`, `flows-`, `rules-index.json`) leave git; `kb reindex`
  rebuilds them from the entries on disk at ~0.35 ms/entry
* **`derived-index.json` stays tracked** — only `kb extract` writes it and only from a running
  deployment, so a clone without it has no way back
* `kb validate`: an **absent** written-store index is a notice, a **stale** one is still a problem,
  an absent **derived** index is still a problem
* catalogs stay tracked

**Applied and pushed 2026-09-17** (`vc-knowledge` `7f2f5e2`), together with the README section
describing which of the stores git carries and why the asymmetry is deliberate.

The fast-forward listed here as outstanding turned out to be already done: `main`,
`migration/knowledge-2026-09` and both their remotes were all at `8ec66de` when checked. Nothing was
pushed for it, because a push that changes nothing is noise in the history.

---

## Phase 2 — the tool becomes the plugin · DONE 2026-09-17 (`06d3fe39`)

`plugins/vc-kb` is 23 modules / 4 686 lines / 14 test files against the lab's 31 / 6 763 / 27.
Missing: `rules`, `source-door`, `refute`, `contradiction`, `provenance`, `todo`, `topics`,
`catalog-budget`, and 13 test files — **none of which depend on the measurement apparatus that
deliberately stayed behind**, so all 13 travel.

Branch: `claude/kb-tool` in `vc-mcp-testing-module` — 2 ahead of `origin/main`, 0 behind, clean.

1. **Replace** `plugins/vc-kb/{bin,src,test}` and `vendor/minisearch.js` with the lab's current
   state. **Leave `vendor/agent-log/` alone** — the plugin already carries the correct trimmed set
   of 7 files; the lab's 13 include the measurement apparatus that must not travel.
2. **The blockers.**
   * `src/base.mjs:47` in the port resolves the base as `resolve(here,'..','..','..','vc-knowledge')`
     — three levels, which is how deep `plugins/vc-kb` sits and nothing else. The lab's version
     replaces it, and **decision B simplifies it further**: `--base` → `KB_BASE` →
     `knowledgeBase.path` from `project-profile.json`. **No sibling walk at all.**
   * `test/kb.test.mjs:124` — `const base = 'C:/_VIRTO/vc-knowledge'`. Hits the live base and fails
     on any other machine.
   * `bin/kb.mjs:20` imports `src/journal.mjs` unconditionally, which resolves
     `vendor/agent-log/log-row.mjs`. Make the CSV half inert when no recorder is present.
   * machine paths in text a user reads: `hooks/arrive.mjs:6`, `src/capture.mjs:713`, and
     `plugins/vc-kb/README.md:80` ("defaults to `C:/_VIRTO/vc-knowledge`" — untrue under decision B).
3. `.claude-plugin/plugin.json`, `hooks/hooks.json`, the marketplace row, `"dependencies"` in
   `vc-fix` and `vc-perf`, a `plugins/vc-kb/** text eol=lf` line in `.gitattributes`.
4. **The arrival hook ships disabled.** 254–286 ms against 80–84 baseline, it fires on the
   developer's own commands, and it buys ~1% — measured, not assumed.
5. **CLI, not MCP.** Every MCP tool's schema sits in context on every turn.
6. Gates: the lab's **288 tests** pass inside the plugin; `kb validate` green; the lab imports the
   tool from the plugin by one path constant (decision 9 — the plugin copy is canonical).

---

## Phase 3 — getting the base onto a machine · DONE 2026-09-17 (`4b6a9faa`) — NOT through `/project-init`

```
/project-init
  → git clone --depth 1 <repo> <project>/.vc-knowledge
  → project-profile.json:  knowledgeBase: { repo, path, ref }
```

* **the repo URL is hardcoded** as the default: `https://github.com/VirtoCommerce/vc-knowledge.git`.
  It is the identity of the base, not a machine detail. Client bases are added beside it later
* **the checkout is never searched for.** Always cloned into the project folder (decision B)
* `ref` matters right now: a `--depth 1` clone of `main` is 18 commits behind the migration work
  until the fast-forward above is pushed
* `.vc-knowledge/` goes into the working repo's `.gitignore` — it is a git checkout inside a git
  repository
* **two bases on one machine is the failure to design against.** `C:/_VIRTO/vc-knowledge` is the
  workbench, `<project>/.vc-knowledge` is what the tools read, and writing to one while reading the
  other is silent. So: `kb` prints which base it used in its readiness line, and `--base`/`KB_BASE`
  stay as the explicit override for migration work. Once the fast-forward lands, the workbench copy
  can be deleted
* files: `gen-profile.mjs`, `verify-access.mjs` (readiness row), `reconcile-profile.mjs`
  (`--check` adds the field to old profiles)
* **a skill that cannot reach the base refuses loudly** — no `knowledgeBase` in the profile, or the
  directory is not there → stop with one line saying what to do

---

## Phase 4 — move the knowledge · DONE 2026-09-17 (`ef164bf3`, `a48cae01`, `afc32364`)

### 4.1 To the base, as files

`vc-knowledge` is a git repository too, so this is `git mv` plus a pointer row. **Keep the
directory layout identical inside the base** — that is what makes decision C cheap:

```
.claude/knowledge/oracles/business-logic.md
   →  <base>/knowledge/oracles/business-logic.md
```

Only the prefix changes; every path tail stays.

| from | files |
|---|---|
| `oracles/` | 4 — rules, edge cases, bug catalog, the `BL-UI` matrix |
| `domain/` | 13 — three domain maps (51/66/68 KB), 7 references, 2 snapshots |
| `api/` | 4 — including `graphql-schema.md`, which stays generated by its own script |
| `architecture/` | 2 |
| `automation/` | 3 |
| `ba/` | 1 |
| `execution/` | 2 — `debugging-signals.md`, `performance-thresholds.md`: both about the platform, filed under a folder about runs |
| `reports/ba/` | 56 — the primary BA material the domain maps cite in `sources:`, travelling as **paths, not text** |

The domain maps are **not** cut into entries — a map is read whole, for orientation.

### 4.2 Repoint the consumers · 23 one-line edits

The literal `.claude/knowledge` appears **67 times** in `scripts/`, but only **23 of those are
code**; the rest are comments. All 23 have the same shape:

```ts
const BL_PATH    = join(".claude", "knowledge", "oracles", "business-logic.md");
const DOMAIN_DIR = join(ROOT, ".claude", "knowledge", "domain");
const SNAPSHOT   = resolve(ROOT, '.claude/knowledge/domain/release-ledger-snapshot.json');
```

They become the base path from `project-profile.json` plus the same tail. **One shared resolver,
23 consumers** — not 23 copies of the lookup.

No npm script is renamed. No script of theirs is rewritten or moved into a plugin.

### 4.3 To the plugin, as instructions

The operating instructions — `execution/*`, `agents/*`, `diagnostics/skill-expectations.md`,
`api/graphql-test-cases-runner.md` — go **inside the plugin whose skills read them**. The old plan
counted 23 files, the integration page counted 25; settle it by applying the criterion file by
file rather than by copying either number.

**The criterion, unchanged and still the whole point:**

> **What would make this file untrue?**
> platform or outside world changed → **base** · plugin changed → **plugin** ·
> test cases or stand data changed → **working repo**
>
> And the corollary that settles most arguments: a file whose **subject** is a skill, command or
> script belongs to the plugin; a file that merely **mentions** one does not.

One real coupling to guard: §1c/§1d of `skill-expectations.md` track constants in
`hooks/session-telemetry.mjs`. The file declares the plugin version it was written against and
`/vc-self-check` refuses on a mismatch.

If two plugins need one file, declare a `dependencies` entry. Never copy — copying is the defect
`mirror-check.mjs` exists to catch.

### 4.4 Stays in the working repo

`regression/suites/**` (138 CSV, 8.4 MB, 5 890 citations of 279 rule ids), `test-data/` (38 MB),
`scripts/`, `execution/module-suite-map.md`, and seven of the eight `reports/` folders.

### 4.5 Delete and switch

`.claude/knowledge/` disappears. `plugins/vc-fix/knowledge/` loses its 9 knowledge files and gains
the instruction files the root has that it never received. `mirror-check.mjs` shrinks and its three
unresolved forks close by deletion.

**Phase gate, on the moved base:** `npm run bl:lint`, `ecl:lint`, `domain:check`, `context:check`,
`mirror:check`, `npm test`, plus one real `/qa-test` run on a live ticket. Every one of those
commands is expected to pass **unchanged** — that is what decision C means, and it is the whole
test of whether the move was minimal.

---

## Later, outside this migration

| | |
|---|---|
| cut the oracles into records | 217 `BL-*`, the ECL `[OBSERVED]` rows and chapter 14, the 55 `VC-*`; then `kb rules`, `kb show BL-…`, and the 13 disagreements become visible. **Costed below — it is not the cheap step it reads as, and the obvious way to do it is the wrong one** |
| the `graphql-schema.md` duplicate | generate the mechanical half from the base; the six Critical Rules become captured entries |
| `kb note` + `kb drain` | **the write race.** `src/capture.mjs` has neither a lock nor an atomic write. One writer has always been enough; three parallel agents break it on the first run |
| `kb brief`, `kb domain <slug>`, rules in `kb ask` | the operating model |
| 68 MB of run output in git | `reports/regression/` and `reports/tickets/` — keep committing, or publish to the tracker |

### Cutting the oracles: what it costs, measured 2026-09-17

The table's first row was written as though the oracles were a corpus with no consumers. They have
172. Measured before the step is planned, because the cheap-looking version of it breaks a gate on
day one.

**What survives, by design.** 5 785 `BL-*` citations across 122 suite CSVs, on 4 358 rows — the
bulk of the 5 890 in §4.4 — are citations **by id**, and `src/rules.mjs` exists to keep every one of
them resolving.
The id rides in the entry's `subject` (`"BL-CART-003 coupon + sale interaction"`), the entry keeps a
normal `KB-<hex>` id, and `kb show BL-CART-003` finds it. Nothing is renamed. This half is free.

**What breaks: the path.** `business-logic.md` is named **413 times across 172 files** — ~74 in
`.claude/`, the `plugins/vc-fix/` mirror, `ci/agents/`, `scripts/maintenance/`. Most of the tail is
reports and presentations, which are history and do not matter. The live consumers do.

**What breaks hardest: five parsers.** These depend not on the path but on the markdown SHAPE
(`### BL-CART-003: Title [P0-revenue]`):

| | |
|---|---|
| `scripts/knowledge/lint-bl.ts` | **the `bl:lint` CI gate** — parses every `### BL-*` into structured fields |
| `scripts/knowledge/extract-bl.ts` | imports that same `ENTRY_RE`, deliberately, so "what is a BL entry" has one definition |
| `rank-oracles.ts` · `oracle-significance.ts` · `remap-bl-citations.ts` | read the file too |

Under decision C these are supposed to keep working **unchanged**. A file MOVE leaves them alone; an
atomisation rewrites all five.

**What does not break but gets worse.** The inlined cheat-sheets in agent bodies
(`- **BL-CHK-003** Double-submit prevention: …`) are literal text and keep working. But once the
authoritative version is an entry that can be `dispute`d, `supersede`d or `amend`ed, the agent
carries a copy nothing updates — a new silent-drift surface, the same defect class as the
`108 rules` / actual `217` divergence found in 7 agent definitions the same day.

**It cannot happen quietly.** `DOC-003` is a dangling-path ratchet pinned at baseline 0, so the day
the file disappears `context:check` fails and names every broken reference. That is a feature: the
step is loud, not silent.

### The reason to do it is NOT what it looks like

The obvious justification — "agents stop reading a 386 KB file to use three invariants" — **is
already solved and is not available as a benefit.** `bl:extract` slices the oracle by domain,
verbatim, by line range: measured 2026-09-08, `--domain cart` is **7.5% of the file, ~7.2K tokens
against ~96K**, and `BL-*` ids keep their citation contract. That work is done.

So the value of cutting is narrower and worth stating plainly, or the step will be justified with an
argument that is no longer true: **it puts rules in the same index as observations, so the two can
contradict each other.** That is the 13 disagreements, and it is what `refute.mjs`,
`contradiction.mjs` and the `DISPUTED` flag were built for — all three shipped, all three idle,
because the base holds `0 rule(s)`.

### Do it by inverting the source, not by deleting the file

The version that breaks 172 files is not the only one available:

```
now:    business-logic.md  ->  (172 consumers)
after:  entries in the base  ->  business-logic.md (GENERATED)  ->  (172 consumers, untouched)
```

The page stays where it is, in the same shape, with the same `### BL-*` headings. Every path
reference, all five parsers, `bl:lint`, `bl:extract` and the inlined cheat-sheets keep working with
**no edit at all**. What changes is which side is authoritative.

This is not a new technique here — `graphql-schema.md` is already generated by `schema:refresh`, and
the table's `graphql-schema.md` row proposes exactly this for the contract duplicate. Applying it to the oracles
makes the two consistent rather than adding a second pattern.

Side benefit, and not a small one: the generator prints the counts. `217 rules across 25 domains`
becomes output rather than prose, and the failure measured on 2026-09-17 — seven agent definitions
asserting `108 rules` and `17 domains`, a number that was already wrong by 36 the day it was
written — stops being possible instead of merely being corrected.

**What is still open** after the inversion: the round-trip has to be lossless and gated. A generator
whose output differs from the page it replaced is a silent rewrite of 217 invariants, so the first
gate is a byte-compare against the current file — the same shape as `kb check` for the derived
plane.

---

## Estimate, against what happened

| phase | | was | planned | actual |
|---|---|---|---|---|
| 1 | base in order | 4 h | done | done |
| 2 | tool → plugin | 8 h | 4 h | done |
| 3 | base onto a machine | (inside 11 h) | 3 h | done, and **smaller** — see below |
| 4 | move the knowledge | 18 h | 5 h | done |
| | remainder of dismantling | 11 h | 6 h | **there was none** |
| | **total** | **41 h** | **18 h** | |

### Where the plan was wrong, recorded rather than quietly fixed

**"Remainder of dismantling the project" never had a section.** It appears once, in the estimate
table, and nothing in this document says what it is. Measured against the finished state it
dissolves: §4.3 had nothing to move (below), §4.5's first clause is wrong (below), and its third
clause is somebody else's burn-down.

**Phase 3 was not `/project-init` work.** The plan had the wizard clone the base into each project.
It does not: `kb sync` fetches ONE checkout per machine into `~/.claude/vc-knowledge`, and every
project on that machine reads it. Claude Code has no install event — the hook surface is
SessionStart, UserPromptSubmit, Pre/PostToolUse, Stop and SubagentStop — so "the plugin fetches the
base when installed" was never available. `knowledgeBase.path` survives as an OVERRIDE for a base of
one's own. The phase came in under an hour rather than three, and `/project-init` was not touched.

**That required breaking this file's own rule about a fallback constant.** `src/base.mjs` said there
is none and the prohibition was written after a measured loss. A managed default is admitted because
it cannot be the wrong corpus the way the old constant could — it names the tool's own pocket, is the
same on every machine, and is CHECKED like any other candidate. The guarantee moved from structural
to disciplinary, so the discipline shipped WITH it: staged clone, refusal to replace a checkout that
holds uncaptured work, and content age in the readiness line.

**§4.3 "to the plugin, as instructions" had nothing to move.** Measured: files vc-fix references and
does not carry — **zero**. It already shipped its own copies of `tracker-ops.md`, `live-discovery.md`,
`module-suite-map.md`, `agents/*` and `diagnostics/*`.

**§4.5 "`.claude/knowledge/` disappears" is wrong by this plan's own criterion.** Twenty-seven files
stay, and they should: `execution/` (20 — how WE run), `agents/` (4), `diagnostics/`, and the GraphQL
runner's grammar. What makes each untrue is a change to OUR code. `quality-gates.md` alone is cited
31 times.

**The phase-4 order in §4.1–4.5 was unsafe as written.** Removing vc-fix's duplicate knowledge before
the base could be read by a client would have handed clients the unscrubbed pages — which is exactly
what those copies existed to prevent (`mirror-check.mjs`'s `plugin-scope`: "the plugin copy omits or
annotates [references] a client cannot follow"). The base had to be annotated and gated FIRST. It was,
and then the twenty copies came out.

**Two counts in §4.1's table were already stale** when checked: `api/` was 5, not 4 (after routing
`graphql-test-cases-runner.md` to the plugin by the criterion), and `reports/ba/` was 65 `.md`, not 56.
The plan's own instruction — apply the criterion file by file rather than copying a number — is the
one that held.
