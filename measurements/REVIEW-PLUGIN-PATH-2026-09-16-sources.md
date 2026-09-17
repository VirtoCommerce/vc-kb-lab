# External practice: agent-maintained knowledge bases, retrieval, and Claude Code hook mechanics

Research notes for the architecture review of a ~90-entry hand-written register (~150 KB) plus 590 machine-generated contract entries, served to Claude Code QA agents through a PostToolUse hook and a Skill, with no MCP server and no vector store.

Compiled 2026-09-16. Every claim below comes from a page fetched on that date; the URL and the page's own publication date are given per section. Direct quotes are kept under 15 words; longer passages are paraphrased. Items that could not be fetched are listed at the end under UNVERIFIED.

Method note: pages were read with WebFetch; where WebFetch truncated or was refused, the raw page was downloaded with curl into the scratchpad and grepped (Karpathy gist raw, `hooks.md`, `plugins-reference.md`, the Medium follow-up, the mem0 post). Local copies: `karpathy-gist.md`, `hooks.md`, `plugins-reference.md`, `paulo.html`, `mem0-file.html` in this directory.

---

## 1. Karpathy, "LLM Wiki"

**URL:** https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f (raw text also read at `.../raw`)
**Date:** gist page shows "Created April 4, 2026". A dated copy saved 2026-05-09 (https://github.com/supachai-j/llm-wiki-101/blob/main/raw/2026-05-09-karpathy-llm-wiki-gist.md) matches the raw text.

**What it says**

- Self-description: "This is an idea file"; the closing note says it "describes the idea, not a specific implementation", and "Everything mentioned above is optional and modular". The phrase "a spec, not a piece of software" does not appear verbatim; the sentiment does.
- Three layers. Raw sources: "immutable — the LLM reads from them but never modifies them". The wiki: "a directory of LLM-generated markdown files" — "You read it; the LLM writes it." The schema: a document such as "CLAUDE.md for Claude Code or AGENTS.md for Codex" that fixes structure, conventions and workflows; "You and the LLM co-evolve this over time."
- Three operations. **Ingest**: read source, discuss takeaways, write a summary page, update the index, update entity/concept pages, append to the log; "A single source might touch 10-15 wiki pages." **Query**: search pages, read, synthesize with citations; "good answers can be filed back into the wiki as new pages." **Lint**: periodic health check for "contradictions between pages, stale claims", orphan pages with no inbound links, concepts lacking a page, missing cross-references, data gaps.
- Page structure: markdown files; entity pages, concept pages, summaries, comparisons, overview, synthesis; optional YAML frontmatter (tags, dates, source counts) for Dataview; Obsidian graph view for orphans and hubs; "The wiki is just a git repo of markdown files." The raw text does not literally write `[[wikilinks]]`, but the workflow (Obsidian, graph view, inbound-link orphan detection) assumes wiki-style links.
- Two navigation files. `index.md` is "content-oriented": each page with link, one-line summary, optional metadata, organized by category, updated on every ingest; "the LLM reads the index first to find relevant pages, then drills into them." `log.md` is "chronological", append-only, with a parseable prefix such as `## [2026-04-02] ingest | Title` so `grep "^## \[" log.md | tail -5` works.
- Stance on vectors: index-first navigation "works surprisingly well at moderate scale (~100 sources, ~hundreds of pages)" and "avoids the need for embedding-based RAG infrastructure." Search tooling is "Optional"; "at small scale the index file is enough"; if needed, a local hybrid BM25/vector tool (qmd) via CLI or MCP.
- Contradictions and provenance are handled in prose, not by mechanism: ingest includes "noting where new data contradicts old claims"; queries produce "an answer with citations"; lint flags stale claims. No confidence field, no supersession record, no provenance schema is specified.
- Human role: "You're in charge of sourcing, exploration, and asking the right questions." "The LLM does all the grunt work". Karpathy ingests one source at a time and stays in the loop; batch ingest "with less supervision" is offered as an option.
- Stated limits: only the "~100 sources, ~hundreds of pages" comfort zone for index-only navigation. No hard ceiling is named.

**Relevance to a ~90-entry register with catalog-in-context and a PostToolUse arrival hook**
The register is squarely inside Karpathy's index-only comfort zone if only the ~90 hand-written entries are indexed; it leaves that zone (680 pages) if the 590 contract entries are indexed as peers. The gist's own split suggests the answer: contract entries are closer to "raw sources" (immutable, machine-generated) than to wiki pages, so the catalog should list the hand-written entries and point at the contract set as a whole. The catalog-in-context is `index.md`; the arrival hook is the "read the index first, then drill in" step, executed by the harness rather than by the model. The register already has the two things the gist leaves as prose only (contradiction and provenance handling) as open design questions; the derivatives in section 2 are where mechanisms appear.

---

## 2. Community extensions: LLM Wiki v2, agentmemory, atomic wiki, "the schema is the product"

### 2a. "LLM Wiki v2" (Rohit Ghumare)
**URL:** https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2
**Date:** forked from Karpathy's gist; comments on the gist run April 11 – August 29, 2026; last activity shown September 15, 2026. A third-party reading (2d) dates the v2 text to April 8, 2026 (UNVERIFIED on the gist itself).

- Adds eleven mechanisms over v1: confidence scores per fact (sources supporting it, recency of confirmation, contradictions); explicit **supersession** ("The new one should explicitly supersede it" rather than leaving the old claim with a note); Ebbinghaus-style decay ("Not deleted, but deprioritized"); four consolidation tiers working → episodic → semantic → procedural; event-driven hooks on ingest, session start/end, contradiction detection, scheduled lint; a typed knowledge graph instead of flat wikilinks; hybrid search "BM25 … + Vector search … + Graph traversal" fused with reciprocal rank fusion; multi-agent mesh sync with shared vs private scoping; schema-driven operations ("The schema document is the most important file"); self-healing lint; audit trails ("Every operation on the wiki should be logged with a timestamp").
- Names the v1 scaling wall: index.md "Works up to maybe 100-200 pages. Beyond that, the index itself becomes too long for the LLM to read in one pass."
- Names the v1 operational gap: "Everything is manual. You drop a source and tell the LLM to process it."
- Contradiction resolution proposed via "source recency, source authority, and the number of supporting observations."
- A top comment (@gnusupport, April 14) criticises it as ideas without a blueprint: no confidence algorithm, no latency or accuracy targets, no access control, no versioning; "Steal the ideas, not the plan."

### 2b. agentmemory (the v2 implementation)
**URL:** https://github.com/rohitg00/agentmemory
**Date:** README as fetched 2026-09-16 (28.5K stars, 482 commits shown); Apache-2.0.

- README: "The gist extends Karpathy's LLM Wiki pattern … agentmemory is the implementation."
- Architecture: local Node daemon, SQLite state, in-memory vector index, BM25 with synonym expansion, knowledge-graph extraction, RRF fusion (k=60); 54 MCP tools; 12 auto-capture hooks including SessionStart, PostToolUse, SessionEnd.
- Multi-agent write conflicts: `AGENT_ID` / `AGENTMEMORY_AGENT_SCOPE`; shared mode with audit-trail attribution or isolated mode; conflicts "prevented through KV versioning and session-scoped leases."
- Claimed benchmarks: LongMemEval-S Recall@5 95.2%, Recall@10 98.6%, MRR 88.2%; "92% fewer tokens" than LLM-summarised approaches.
- Independent operating report (Fabio Akita, https://akitaonrails.com/en/2026/05/18/ai-agent-memory-karpathy-llm-wiki-agentmemory/, May 18, 2026): ran it in production for one week and "walked it back" over BM25 reindex failures on restart, a 5-second data-loss window, and roughly 47% of hooks failing on Claude Code tool calls; he then wrote his own replacement (ai-memory, Rust — not fetched).

### 2c. llm-atomic-wiki (cablate)
**URL:** https://github.com/cablate/llm-atomic-wiki
**Date:** README as fetched; no explicit date on the page.

- Inserts an **atom layer** between raw and wiki: "one atom equals one claim, with frontmatter"; atoms are the immutable source of truth, wiki pages are compiled from 3–8 atoms each.
- **Two-layer lint**: a programmatic layer (ghost links, format violations) and an LLM layer (contradictions, expired claims).
- **Parallel-compile naming lock**: pre-allocate slugs so parallel agents fill named slots instead of inventing filenames.
- Motivation quoted from a Karpathy-gist commenter: "loss of information" and "false sense of source of truth" when wiki pages diverge from sources.
- Scale actually run: 584 posts + 8,668 replies → 630 atoms → 11 topic branches → 83 wiki pages, 16 lint warnings.

### 2d. "The Schema Is the Product" (Han Heloir Yan)
**URL:** https://cozypet.github.io/llm-wiki-schema/
**Date:** references the April 4 and April 8, 2026 gists; own date not shown.

- Thesis: the schema file is "where all the architectural value concentrates"; "Spend 80% of your effort on the governance document."
- Failure modes named: superseded claims "remain in the wiki, unmarked"; false coherence (a source error "gets woven into the wiki seamlessly"); missing provenance ("no way to know where that claim originated"); no dependency graph from claims back to sources, so no incremental re-compile.
- Recommendations: "Build the lint pass before the ingest pass"; "Track provenance from the first ingest"; hybrid search becomes necessary "beyond roughly 200 pages".
- Second-hand numbers quoted there (17% degradation for partially compiled wikis; an ETH Zurich result) are not traced to their sources in this review — UNVERIFIED.

**Relevance**
Two independent derivatives put the index ceiling at 100–200 pages; the 90-entry register is under it and the 680-entry union is over it, which is a second argument for keeping contract entries out of the in-context catalog. The mechanisms the register lacks — supersession as an explicit record, provenance on each claim, a programmatic lint layer separate from the LLM lint — are exactly the ones every derivative added first. The atomic wiki's "naming lock" and agentmemory's "KV versioning and leases" are both answers to concurrent agent writes; for a git-backed register the cheap equivalent is already present (git), and Letta (section 5) makes the same choice deliberately. agentmemory is also the cautionary case for the "no MCP server, no daemon" decision: a 54-tool daemon with 12 hooks was abandoned by an experienced operator within a week for reliability reasons.

---

## 3. Anthropic, "Introducing Contextual Retrieval"

**URL:** https://www.anthropic.com/news/contextual-retrieval
**Date:** September 19, 2024

**What it says**

- Metric: "top-20-chunk retrieval failure rate" — how often the correct chunk is not among the 20 retrieved.
- Contextual Embeddings + Contextual BM25 cut that failure rate from 5.7% to 2.9%, the quoted 49% reduction.
- Adding a reranking step brought it to 1.9%, the quoted 67% reduction.
- Technique: prepend "chunk-specific explanatory context to each chunk before embedding", and apply the same contextualisation "before creating the BM25 index".
- The small-corpus rule, quoted exactly: "If your knowledge base is smaller than 200,000 tokens (about 500 pages of material), you can just include the entire knowledge base in the prompt that you give the model, with no need for RAG or similar methods."
- Prompt caching is named as what makes that whole-corpus approach "significantly faster and more cost-effective".

**Relevance**
At ~150 KB the hand-written register is roughly 35–40k tokens (rule-of-thumb estimate, ~4 chars/token — my arithmetic, not a fetched figure), about one fifth of Anthropic's own "just include it" threshold. The 49%/67% figures are measured on large chunked corpora and say nothing about a corpus this size; the applicable sentence is the 200k-token rule. That makes "no vector store" the documented Anthropic position for this register, not a compromise. The catalog-in-context design sits between the two poles — cheaper than whole-corpus-in-context, while staying deterministic — and the 200k line is the number to quote if anyone proposes adding embeddings before the register grows by an order of magnitude.

---

## 4. Anthropic, Agent Skills and progressive disclosure

**URLs and dates:**
- Engineering blog, https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills — October 16, 2025
- Skills overview, https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview — live docs, fetched 2026-09-16
- Authoring best practices, https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices — live docs
- Claude Code skills page, https://code.claude.com/docs/en/skills — live docs

**What it says**

- Three-level model (overview page table): Level 1 metadata, "Always (at startup)", "~100 tokens per Skill"; Level 2 SKILL.md body, "When Skill is triggered", "Under 5k tokens"; Level 3 resources, "As needed", "None until accessed".
- Blog: "the agent pre-loads the `name` and `description` of every installed skill into its system prompt"; the body is read only when the skill is judged relevant; further files are discovered "only as needed".
- Frontmatter limits (overview + best practices): `name` max 64 chars, lowercase/digits/hyphens, no "anthropic"/"claude"; `description` non-empty, max 1,024 chars, must say what the skill does and when to use it, written in third person because it is "injected into the system prompt".
- Size guidance (best practices): "Keep SKILL.md body under 500 lines"; split when approaching that; reference files longer than 100 lines should carry a table of contents; "Keep references one level deep from SKILL.md" because Claude may preview nested files with `head -100`.
- Best practices: "The context window is a public good"; describes the filesystem model as what enables progressive disclosure; scripts are "executed, not loaded".
- Claude Code specifics: skill descriptions "are loaded into context so Claude knows what's available"; description plus `when_to_use` "is truncated at 1,536 characters in the skill listing"; an invoked skill "enters the conversation as a single message and stays there"; after auto-compaction Claude Code re-attaches each invoked skill's most recent invocation, "keeping the first 5,000 tokens of each", within "a combined budget of 25,000 tokens".

**Relevance**
The register already mirrors the three levels: catalog line = Level 1, entry body = Level 2, contract entries and sources = Level 3. The documented numbers set the budget for the Skill that carries the catalog: keep the catalog itself under 5,000 tokens so it survives compaction re-attachment intact, keep the SKILL.md under 500 lines, and keep any per-entry summary line in the spirit of a ≤1,024-char description written in third person with trigger words. The one-level-deep rule matters for the register too: an entry that says "see X, which says see Y" will be read with `head -100` and lose its tail; entries should link directly to what they need.

---

## 5. Published after May 2026: agentic search, agent memory, context engineering, wiki experience reports

Eight primary items published June–September 2026, plus the live Claude Code memory docs. Earlier 2026 items that frame them are listed separately at the end of this section.

### 5a. Paulo de Assis, "Three Months of my LLM-wiki: A Follow-Up and an Update"
**URL:** https://medium.com/@paulo.deassis/three-months-of-my-llm-wiki-a-follow-up-and-an-update-43d95cc9246b
**Date:** 2026-07-19 (page metadata `datePublished`). Read via curl; WebFetch returned 403.

- A Karpathy-pattern research wiki over "roughly 3,000 pages of philosophy", maintained by Claude Code with the three-layer design; after three months "Every measure roughly doubled" and "The wiki nearly doubled without changing its shape."
- The blind spot: the original LINT was a list of checks the agent ran by re-reading pages; "At 185 pages, that worked." Past that it did not; a program "does not get tired at page 300."
- Built a dependency-free `wiki lint` that builds the link graph, names orphans, and "compares the pages on disk against the pages named in the index and reports the drift."
- First run on a structurally clean wiki still found ten orphan pages (mostly bulk imports never wired in) and nine pages on disk that "had never made it into the index".
- Keeps "epistemic markers" on claims: from-source, wiki synthesis, author's position, uncertain.
- Lesson stated for other Karpathy-pattern wikis: find the checks the agent performs by re-reading, "and hand them to a program."

### 5b. Letta, "Evaluating Memory in Production Agents"
**URL:** https://www.letta.com/blog/evaluating-memory-in-production-agents/
**Date:** July 28, 2026

- Evaluates two sides: using existing memory (adherence, retrieval) and generating new memory (generalisation, hygiene).
- Memory formats under test include "external memory stored as files in MemFS (Letta's git-backed memory filesystem)" alongside in-context blocks, skills and message history.
- Failure named as "memory rot": memory "can become more unstructured or contain stale memory that is never removed"; weaker models leave "stale and contradictory information behind".
- Retrieval is "the closest task type across providers"; the spread is in memory generation and hygiene.

### 5c. Letta, "Memory Models: Towards Agents That Learn"
**URL:** https://www.letta.com/blog/towards-agents-that-learn/
**Date:** June 25, 2026

- Memory lives in token space: memory models "update an agent's memory in token space (e.g. in context repositories or AGENTS.md files)".
- Maintenance happens off the critical path via "sleep-time compute" ("agent dreaming"): memories are generated between sessions to improve the next one.
- Background on Letta's file-based memory (pre-May, for context): Context Repositories, https://www.letta.com/blog/context-repositories/ (Feb 12, 2026) — "Every change to memory is automatically versioned"; git "enables concurrent, collaborative work across multiple subagents"; defragmentation target "a clean hierarchy of 15–25 focused files". MemFS docs, https://docs.letta.com/concepts/memfs (undated) — "The file tree itself is always in the system prompt"; "Files under `system/` are loaded … on every turn"; other files "stay out of context until they are needed".

### 5d. Amir Teymoori, "AI Agent Memory: What Actually Works in 2026"
**URL:** https://amirteymoori.com/ai-agent-memory-markdown-files-vs-vector-mem0-2026/
**Date:** August 3, 2026

- Baseline design: "Markdown files on disk, an index loaded at session start", read and written "with the same tools it uses for source code."
- Threshold: "Below a couple thousand memory items, files win." Pain "usually north of a few thousand notes" shows as slow scans and wrong-file guesses.
- Where vectors earn their place: semantic recall — the user says "slow queries", the note says "index scan regression", "grep whiffs and embeddings land it."
- Progression: "Start with files … Add search once grep starts missing … Reach for a product when you're multi-tenant."

### 5e. Mem0, "Your AI Agent's Memory Is Just a File? That's the Problem"
**URL:** https://mem0.ai/blog/your-ai-agents-memory-is-just-a-file-thats-the-problem
**Date:** 2026-09-11 (`article:published_time`). Vendor position piece; read via curl after WebFetch returned only metadata.

- Concedes the small case: "one developer with one coding agent and 50 facts to remember, a markdown file is fine."
- Its ceiling: "Files work for ~200 static memories, single user, no concurrency." Past that "you're rebuilding databases by hand, badly."
- Failure list: files "loaded wholesale"; "grep can't reason"; no temporal reasoning ("files don't know when facts stopped being true"); concurrent writes "silently lose data"; "contradictions coexist, LLM guesses"; "signal-to-noise degrades monotonically".
- Cites Claude Code issues about CLAUDE.md corrupted by concurrent writes (not independently checked here).
- Companion report, https://mem0.ai/blog/state-of-ai-agent-memory-2026 (September 2026; the page shows both Sept 3 and Sept 16 — date UNVERIFIED): Mem0 "replaced external graph store support with built-in entity linking"; retrieval quality drops ~25% when context scales 10x on its BEAM 1M→10M test.

### 5f. CORE-Bench (Zhang et al.), "A Comprehensive Benchmark for Code Retrieval in the Era of Agentic Coding"
**URL:** https://arxiv.org/abs/2606.11864
**Date:** v1 June 10, 2026; v3 August 24, 2026

- Premise: "agentic coding requires more than matching a natural-language query to an isolated snippet."
- Three levels measured: code understanding, issue-to-edit localisation, broader context retrieval; 180k+ queries, 106k+ context-relevance labels, drawn from code-search tasks and SWE-bench-series instances.
- Finding: "a sharp drop from traditional code search to code retrieval in agentic coding settings"; off-the-shelf embedding models do poorly, and "simple supervised fine-tuning … significantly improves performance".

### 5g. Zhang & Song, "Written by AI, Managed by AI: … Index Sickness Elimination Across 391 Consecutive Sessions"
**URL:** https://arxiv.org/abs/2606.19121
**Date:** June 17, 2026 (v2 June 19)

- Action research on one software project over ~one month and 391 human–LLM sessions.
- Finding: adding "symbolic identifier systems" and "defensive rules in System Prompts" past a complexity threshold makes outputs "internally consistent but … physically disconnected from reality" — named "Index Sickness"; its canonical form "Phantom Legislation".
- Their fix, "Baseline-Log Physical Separation", "reduced AI Instructions volume by ~75%", with no recurrence over the following ~150 sessions.
- Their principle: natural language "carrying explicit purpose" beats symbolic expression for information quality.

### 5h. Ding et al., "Always-On Agents: A Survey of Persistent Memory, State, and Governance in LLM Agents"
**URL:** https://arxiv.org/abs/2606.30306
**Date:** June 29, 2026

- Frames memory as one part of persistent state alongside "provenance and audit records, shared state, trigger conditions".
- Six diagnostic axes per state item: "authority, scope, mutability, provenance, recoverability, and actionability".
- Across a 435-work corpus the literature "concentrates more heavily on accumulating and retrieving state than on governing, recovering, or relinquishing it."
- Proposes AOEP-v0, which scores "state mutation and recovery obligations rather than answer quality alone."

### 5i. Claude Code docs, "How Claude remembers your project" (auto memory)
**URL:** https://code.claude.com/docs/en/memory
**Date:** live docs, fetched 2026-09-16 (page cites Claude Code versions up to v2.1.239)

- Auto memory directory per repository: `MEMORY.md` as "Index, one line per memory, loaded into every session", plus one topic file per memory.
- Load rule: "The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first" load at session start; content beyond is not loaded. After Claude writes the index, Claude Code measures it and, near the limit, "reminds Claude to shorten it"; over the limit, the write succeeds but Claude Code returns an error telling Claude to rewrite the index.
- Topic files are "not loaded at startup"; Claude reads them "on demand using its standard file tools."
- Memory files with frontmatter get a tool-written `modified` ISO-8601 field (v2.1.214+), so recency is recorded by the harness, not typed by the model.
- Four memory kinds are recorded in a `type` frontmatter field: `user`, `feedback`, `project`, `reference`. Claude "skips anything it can derive from the codebase" and anything CLAUDE.md already says.
- CLAUDE.md: "target under 200 lines"; a file up to 4 MiB loads in full; "Shorter files produce better adherence." Content is "delivered as a user message after the system prompt", and is "context, not enforced configuration" — hooks are for enforcement.

### Framing items from earlier in 2026 (not post-May, listed for completeness)
- Sourcegraph, "Agentic Coding in 2026" (May 21, 2026), https://sourcegraph.com/blog/agentic-coding — "Approximate retrieval is fine on a small repo"; on large code it "returns plausible-looking results that miss cross-cutting impact"; advocates exact symbol/callsite search.
- Sourcegraph, "Context Engineering: A Practical Guide" (May 28, 2026), https://sourcegraph.com/blog/context-engineering — just-in-time loading "using lightweight identifiers like file paths or query strings"; "structured note-taking" to a file outside the context window.
- Ceyhun Aksan, "Code Search for AI Agents: ripgrep, ast-grep, or Semantic?" (2026-05-19), https://ceaksan.com/en/code-search-for-ai-agents-which-tool-when — tiered: ripgrep first (1–5 ms), ast-grep for structure, embeddings last; short keyword queries "collapse nearly every semantic model tested to near-zero nDCG@10" (citing CoREB); search budget ≈ 15% of context window.
- Anthropic, "Harness design for long-running application development" (March 24, 2026), https://www.anthropic.com/engineering/harness-design-long-running-apps — inter-agent state passed as files ("one agent would write a file, another agent would read it"); context resets with structured handoff chosen over compaction.

**Relevance**
The post-May record is consistent from three unrelated camps — a hostile vendor (Mem0), a neutral practitioner (Teymoori), and Anthropic's own harness — that a markdown register with an index loaded at session start is the correct design for a single-tenant, low-concurrency store in the tens-to-hundreds of items; the disagreement is only about where files stop (Mem0 says ~200 static memories, Teymoori says a couple of thousand). Claude Code's own auto memory is the reference implementation of that design and gives concrete numbers the register can borrow: an index capped at 200 lines / 25 KB with a tool-enforced measurement after each write, topic files read on demand, and a harness-written `modified` timestamp. The failure modes to design against are named repeatedly: stale claims never removed (Letta's "memory rot"), contradictions coexisting (Mem0), orphans and index drift that the agent cannot see by re-reading (de Assis found 19 such pages at ~300 pages and fixed detection with a program, not a prompt), and over-formalised instruction sets that make the model reason about the symbols instead of the domain (Zhang & Song's ~75% cut). CORE-Bench and Aksan support grep-first over embeddings for agentic retrieval at this scale. The Always-On survey supplies vocabulary for the review: authority, scope, mutability, provenance, recoverability — the register's open questions are governance questions, which the survey says the field under-serves.

---

## 6. Claude Code plugin and hook mechanics (official docs)

**URLs:** https://code.claude.com/docs/en/hooks (reference; full text via `hooks.md`), https://code.claude.com/docs/en/plugins (guide), https://code.claude.com/docs/en/plugins-reference (reference; full text via `plugins-reference.md`)
**Date:** live docs fetched 2026-09-16; pages cite Claude Code versions up to v2.1.265.

### 6a. What a plugin needs

- Layout: `.claude-plugin/plugin.json` (manifest, optional), `skills/<name>/SKILL.md`, `commands/` ("Skills as flat Markdown files. Use `skills/` for new plugins"), `agents/`, `hooks/hooks.json`, `.mcp.json`, `.lsp.json`, `monitors/monitors.json`, `bin/`, `settings.json`. Only `plugin.json` goes inside `.claude-plugin/`; every other directory "must be at the plugin root level."
- "The manifest is optional. If omitted, Claude Code auto-discovers components in default locations and derives the plugin name from the directory name." "If you include a manifest, `name` is the only required field."
- Manifest fields (reference table): `name` (kebab-case, "no spaces, control characters, or bidirectional-formatting characters"), `displayName`, `version`, `description`, `author` (object), `homepage`, `repository`, `license`, `keywords`, `skills`, `commands`, `agents`, `hooks`, `mcpServers`, `outputStyles`, `lspServers`.
- Path rule: "All paths must be relative to the plugin root and start with `./`", except `skills` also accepts `"."`. `skills` **adds to** the default `skills/` scan; `commands`, `agents`, `outputStyles` **replace** their default folders; `hooks`, `mcpServers`, `lspServers` merge.
- Hooks location: "`hooks/hooks.json` in plugin root, or inline in plugin.json". Same `{"hooks": {...}}` object shape as `settings.json`.
- Namespacing: skill `hello/` in plugin `my-first-plugin` is `/my-first-plugin:hello`; a plugin found under `~/.claude/skills/<name>/` with a manifest loads as `<name>@skills-dir` with no install step.
- Local test: `claude --plugin-dir ./my-plugin`; `/reload-plugins` picks up changes; `claude plugin validate ./my-plugin` checks `plugin.json`, `hooks/hooks.json` and component frontmatter.

### 6b. `${CLAUDE_PLUGIN_ROOT}` and friends

- `${CLAUDE_PLUGIN_ROOT}`: "Absolute path to the plugin's installation directory". `${CLAUDE_PLUGIN_DATA}`: persistent directory that survives updates (`~/.claude/plugins/data/{id}/`). `${CLAUDE_PROJECT_DIR}`: project root.
- Stability warning: "For a copied plugin, `${CLAUDE_PLUGIN_ROOT}` changes when the plugin updates"; the old directory is ephemeral — "don't write state there." A plugin loaded in place from a local-directory marketplace keeps a stable path.
- Both hook forms "export them as the environment variables `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`, and `CLAUDE_PLUGIN_DATA`" on the spawned process.
- Shell form: wrap in quotes, `"\"${CLAUDE_PLUGIN_ROOT}\"/scripts/x.sh"`. Exec form (with `args`): no shell, placeholders substituted "as plain strings"; on Windows exec form needs a real `.exe`, so use `"command": "node", "args": ["${CLAUDE_PLUGIN_ROOT}/…js"]`. PowerShell shell form rewrites the placeholders to `${env:NAME}` (v2.1.198+), which works in double quotes only.

### 6c. PostToolUse contract — exact field names

**When:** "Runs immediately after a tool completes successfully." Matcher is the tool name (`"Edit|Write"`, regex if other characters present, `mcp__<server>__.*` for MCP tools; omit or `"*"` for all). A `PostToolUse` matching `Edit|Write` does **not** fire when a `Bash` command or an outside process rewrites the file; use `FileChanged` for that.

**Stdin JSON — common fields (all events):** `session_id`, `prompt_id` (v2.1.196+), `transcript_path` (written asynchronously, "may lag the in-memory conversation"), `cwd`, `scratchpad_dir` (v2.1.257+), `permission_mode`, `effort` (object with `level`), `hook_event_name`; plus `agent_id` and `agent_type` inside subagents.

**Stdin JSON — PostToolUse-specific:** `tool_name`, `tool_input`, `tool_response` ("The exact schema for both depends on the tool"), `tool_use_id`, `duration_ms` (optional, excludes permission prompts and PreToolUse hooks). File-tool paths are "always absolute, with the platform's native separators, so backslashes on Windows."

**Stdout JSON — PostToolUse decision control (table quoted from the reference):**

| Field | Documented effect |
| :-- | :-- |
| `decision` | `"block"` adds the `reason` next to the tool result; "Claude still sees the original output" |
| `reason` | Explanation shown to Claude when `decision` is `"block"` |
| `additionalContext` | "String added to Claude's context alongside the tool result" |
| `classifierContext` | Note for the auto-mode classifier, not for Claude (v2.1.236+) |
| `updatedToolOutput` | Replaces the tool output Claude sees; "must match the tool's output shape" |
| `updatedMCPToolOutput` | MCP tools only; "Prefer `updatedToolOutput`" |

`decision`/`reason` are top-level; `additionalContext` and the `updated*` fields go inside `hookSpecificOutput` with `"hookEventName": "PostToolUse"`. Documented example:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "This file is generated. Edit src/schema.ts and run `bun generate` instead."
  }
}
```

**How `additionalContext` is delivered ("Add context for Claude" section):** Claude Code "wraps the string in a system reminder and inserts it into the conversation at the point where the hook fired"; for PreToolUse/PostToolUse/PostToolUseFailure/PostToolBatch that is "next to the tool result"; Claude "reads the reminder on the next model request, but it doesn't appear as a chat message". "When several hooks return `additionalContext` for the same event, Claude receives all of the values." Universal output fields (`continue`, `stopReason`, `suppressOutput`, `systemMessage`, `terminalSequence`) also apply.

**Output cap:** "Hook output strings, including `additionalContext`, `systemMessage`, and plain stdout, are capped at 10,000 characters." Over that, the text is "saved to a file and replaced with a preview and file path."

**Exit codes for PostToolUse:** exit 0 — JSON on stdout is parsed; plain stdout goes to the debug log for most events. Exit 2 — "Shows stderr to Claude; the tool already ran" (cannot block). Other codes — non-blocking error, stderr shown in transcript.

**Timeouts:** `timeout` is in seconds, per hook entry. "Defaults: 600 for `command`, `http`, and `mcp_tool`; 30 for `prompt`; 60 for `agent`." The 600 default is lowered to 30 only on `UserPromptSubmit`, `PreModelSwitch`, `PostModelSwitch`, and to 10 on `MessageDisplay`; `SessionEnd` shares a 1.5-second budget. A timed-out hook is cancelled and its output "discarded". `async: true` runs a command hook in the background and delivers `additionalContext`/`systemMessage` "on the next conversation turn"; there is "no deduplication across multiple firings of the same async hook."

**Execution model:** "All matching hooks run in parallel. If you define the same handler in more than one settings file, it runs once. A plugin's or skill's copy of the same handler stays separate." "`PostToolUse` fires once per tool, which means it fires concurrently when Claude makes parallel tool calls." `PostToolBatch` "fires exactly once with the full batch" and "is the right place to inject context that depends on the set of tools that ran"; it has no matcher.

**Hook types:** `command`, `http`, `mcp_tool`, `prompt`, `agent`. Optional per-entry `statusMessage`.

**Trust:** hooks from `.claude/settings.json` run only after the workspace trust dialog; user-level hooks run regardless.

**Relevance**
This is the contract the arrival hook lives under, and several of its numbers should become explicit settings rather than defaults. The command-hook default timeout is 600 s, so a slow arrival lookup is not cut off by the harness — latency discipline has to come from an explicit `timeout` on the entry (the docs recommend it) and from the script itself. Injected text is capped at 10,000 characters per hook before it spills to a file, which is a hard ceiling on how much of an entry a single arrival can deliver; it also means the catalog cannot be re-sent on every arrival without cost. Because PostToolUse fires per tool and concurrently on parallel calls, any on-disk arrival log needs to tolerate concurrent appends, and `PostToolBatch` is the documented place for once-per-turn injection if the design ever needs "what arrived this turn". Delivered context is a system reminder "next to the tool result", invisible in the UI — so the user cannot see arrivals unless the hook also emits `systemMessage`. Finally, `${CLAUDE_PLUGIN_ROOT}` moves on update for copied plugins; anything the hook writes (counters, arrival log) belongs under `${CLAUDE_PLUGIN_DATA}` or the project, and `tool_input.file_path` arrives with Windows backslashes on this machine, which matters for matching register paths.

---

## UNVERIFIED (not fetched, or fetched without the needed part)

- https://www.morphllm.com/agentic-search — HTTP 429. The claim seen only in search snippets that Anthropic removed vector search from Claude Code in May 2025 in favour of grep is therefore UNVERIFIED here.
- "LLM Wiki v2" creation date of April 8, 2026 — stated by the cozypet reading, not confirmed on the rohitg00 gist page (which showed comment dates April 11 – August 29, 2026 and last activity September 15, 2026).
- https://github.com/lawls76/LLM-Wiki-V2 — not fetched.
- https://github.com/Astro-Han/karpathy-llm-wiki and https://github.com/SamurAIGPT/llm-wiki-agent — not fetched.
- https://github.com/akitaonrails/ai-memory — Akita's Rust replacement, not fetched; his "~47% broken hooks" figure is his own claim in the fetched article.
- The mem0 "State of AI Agent Memory 2026" publication date — the fetched page showed both "September 16, 2026" and "updated September 3, 2026".
- The "17% degradation" and "ETH Zurich 5 of 8 settings" figures quoted inside the cozypet article — second-hand there, sources not traced.
- Mem0's citation of Claude Code GitHub issues about concurrent-write corruption of CLAUDE.md — not checked against the issue tracker.
- arXiv 2604.11243 ("Knowledge Compounding … Self-Evolving Knowledge Wikis") and arXiv 2604.12034 ("Memory as Metabolism") — surfaced in search, not fetched.
- DataCamp "LLM Wiki" article, the Medium "Mem0 vs Letta in Production" (Aug 2026), and the assorted tutorial blogs surfaced in search — not fetched; nothing above relies on them.
- The Karpathy gist's literal use of `[[wikilinks]]` — the raw text describes Obsidian graph view and inbound-link orphan detection but the fetch summary's bracketed form is not in the raw file verbatim.
- My conversion of ~150 KB to ~35–40k tokens — rule-of-thumb arithmetic, not a fetched figure.
