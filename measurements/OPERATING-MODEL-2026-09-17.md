# How an agent works against the joined base — the operating model

Written 2026-09-17, after the `.claude/knowledge` analysis
(`CLAUDE-KNOWLEDGE-INTEGRATION-2026-09-17.md`). This page answers one question: **what actually
happens, step by step, when a run needs knowledge** — who asks, what they ask, when the brief is
built, and what gets written back.

Everything is marked `[exists]`, `[exists, re-pointed]` or `[to build]`, so nothing here reads as
working that is not.

---

## 0. The one idea this rests on

**The dispatcher assembles; the agent receives. An agent does not go looking.**

This is not new and it is not mine. `.claude/skills/qa-test/dispatch-pack.md` already states it,
with the boundary that makes it safe:

> **Text if the dispatcher already holds it AND it is identical for every recipient.
> Path if the recipient must derive, date, or triangulate it itself.**

and the guardrail, which matters more than the rule:

> a pack that swallows a source the agent was supposed to *interrogate* does not save tokens, it
> removes a check — and it removes it invisibly, because the brief still looks complete.

`kb brief` is that pack, generalised from the two files that have a slicer today to everything the
base holds. It must inherit the boundary intact, or it will quietly turn a triangulation step into
a ratification step.

---

## 1. The four roles

| | who | what it does |
|---|---|---|
| **the library** | domain maps, oracles, surface inventories | what the feature IS and what it MUST do. Written by people and by `/qa-domain-map`. |
| **the journal** | the experiential plane | what somebody SAW on a deployment, with provenance. Written by agents at work. |
| **the contract** | the derived plane | what the deployment actually publishes. Regenerated, byte-gated, never typed. |
| **the dispatcher** | the orchestrating command | decides which slices of the three go into each agent's brief. |

The agent talks to the base exactly twice in a normal run: once at the start (it receives a brief)
and once at the end (it writes back what surprised it). Everything between is work.

---

## 2. Before any run — is the base worth reading

Run by CI on a schedule, not by an agent.

| step | call | what it decides |
|---|---|---|
| contract still current | `kb check` `[exists]` | regenerates the derived plane in memory and byte-compares. A field that vanished is a failure, not a surprise six weeks later |
| licensed claims still resolve | `kb refute` `[exists]` | every claim the base says may be acted on without re-verification still names coordinates the contract publishes |
| corpus intact | `kb validate` `[exists, re-pointed]` | ids, planes, indexes, and — new — the freshness contract on every document that carries one `[to build]` |

If `kb check` fails, the run still happens; the brief simply says the contract is stale and names
the date. **A degraded base reports itself. It never silently hands over old bytes.**

---

## 3. Step 1 — orientation, once per run

The orchestrator, before any agent is dispatched. In `/qa-test` this is the `1b … 1c ‖ 1d` wave.

**3.1 Resolve the domain.** The ticket names a module or an area; that maps to a `domain_slug`
(`cart`, `b2b`, `sr`, `loy`…). `[exists]` — `bl:extract --list` prints them and
`check-domain-maps.mjs` DOMAIN-005 already forces the slug to be a real one.

**3.2 Ask the base what it holds for that domain.**

```
kb domain cart                                   [to build]
```

Returns four counts and nothing else — it is a decision, not a read:

```
cart
  map        reference/domain/cart.md   rev 2, generated 2026-08-30, 18 days old (stale at 60)
  rules      15 BL-CART, 4 of them P0-revenue, 2 disputed
  journal    9 observations, 3 licensed, 1 contradicting a rule
  contract   CartType, Mutations.addItem + 22 more coordinates
```

**3.3 If the map is ABSENT, build it before dispatching.** `[exists]` — `/qa-domain-map cart` is
already model-invocable and already runs from `/qa-test` at `1c-map`. That is what took the corpus
from *1 of 13 domains mapped after two months of recommending it* to a map appearing as a
by-product of work.

**If the map is STALE, do not refresh it automatically.** `[exists]` — `--refresh` is a human's
flag and no pipeline passes it, because a refresh rewrites claims other tickets already cite. The
brief carries `map: 61 days old` and the agent treats it as a hypothesis. *Staleness is a
suspicion; rewriting on a timer is a decision.*

---

## 4. Fan-out — the brief, built once per recipient

This is the moment the whole design exists for. The orchestrator is about to dispatch N agents; it
builds N briefs.

```
kb brief --domain cart \
         --anchors "Mutations.addCoupon,CartType.discounts" \
         --rules   "BL-CART-003,BL-CART-009" \
         --budget  12000                        [to build]
```

The three inputs are all things the dispatcher **already knows** before the agent starts — that is
why this is addressing rather than search:

* `--domain` from the ticket;
* `--anchors` from the test model's surfaces, or from the contract for that domain;
* `--rules` from the test case's own `Business_Rule` column — **5,890 such citations exist**, so
  for a regression run the required knowledge is literally named in the row being executed.

### What comes back, and in what order

```
## What this feature is                       ← PATH, not text
  reference/domain/cart.md §3 (cross-layer), §5 (surfaces)
  rev 2, generated 2026-08-30. Read it; it is a hypothesis, not an answer.

## What must hold                             ← TEXT, verbatim
  BL-CART-003  Coupon + sale interaction  [P0-revenue]
    Rule: … (the oracle's own markdown, character for character)
    Verify: …
    Violation signal: …
  BL-CART-009  … 

## What was actually seen                     ← TEXT, with its provenance
  KB-35F20D97  a coupon code that does not work leaves the cart unchanged
      2 parties · vcptcore_stable · 2026-09-13 · CONTRADICTS BL-CART-009
  KB-E7790BF6  where an applied coupon and its reward live
      1 party · single observation — treat as a lead, not a fact

## What the contract publishes                ← TEXT
  Mutations.addCoupon(cartId, couponCode): CartType
  CartType.coupons: [CouponType]  · CouponType.isAppliedSuccessfully: Boolean!

## Left out
  6 further BL-CART rules (not cited by this case) · 4 journal entries on other cart coordinates
  · the 232 KB release ledger. Ask for them with: kb rules BL-CART --text
```

Five properties, each of which is a decision:

1. **Rules go as TEXT.** Verbatim, never paraphrased — a summarised invariant is a second, drifting
   copy. `[exists]` as `bl:extract`; `[to build]` as `kb rules <domain> --text`.
2. **The domain map goes as a PATH.** `dispatch-pack.md` is explicit that prior art stays a path
   *deliberately*, because the agent's job includes triangulating it. Packing it as a digest
   pre-answers the question the step exists to ask.
3. **Journal entries carry their trust on the same line.** "2 parties, contradicts BL-CART-009" is
   the whole point: the agent is told *this rule is contested* before it starts, not after it files
   a false FAIL.
4. **The budget is real and declared.** 23 of 54 library files exceed the repo's own 19,000-char
   prompt limit; a pack with no budget just moves the overflow.
5. **It says what it left out.** An agent that knows the boundary can ask for more. An agent handed
   a complete-looking pack cannot know there was more.

### When the brief is NOT built

* **A verifier.** `[exists]` — Verifier Mode re-derives from source by definition, so packing the
  doer's evidence turns an independent check into a ratification. Rule text may be packed; evidence
  never.
* **A freshness judgement.** If deciding whether a snapshot is current is part of the job, the agent
  gets the source and its date, not a cut of it.

---

## 5. During the work — one question, and only one

An agent with a brief does not consult the base again, with a single exception:

> **It is standing on a coordinate the brief did not cover.**

A checkout run that unexpectedly lands on `/api/payments/…`, a query that returns a field nobody
mentioned. Then, and only then:

```
kb ask "<what it needs>"             [exists]
kb deliver "<question>" --json       [exists]  the citable form, or an explicit MISS
kb how "<what I am trying to do>"    [exists]  procedures, which deliver cannot reach
```

**Two things this design gives up deliberately.**

*Search is not the main route any more.* `ask` and `deliver` are 602 lines and produced four null
rounds — measured, not suspected. They stay, demoted to the case above: unknown domain, unknown
coordinate. That is the case they are actually good at.

*The arrival hook does not run.* `[exists, retired from the working loop]` It pushes facts at an
agent mid-flight, measured at 254–286 ms against an 80–84 ms baseline and firing on the operator's
own commands. If the brief is assembled before dispatch, the hook is solving a problem that no
longer exists. It stays available for demonstration and for the case where no dispatcher exists at
all — a lone agent in a terminal.

---

## 6. After the work — what gets written back, and by whom

Three different things, three different bars. This is where the two systems stay separate on
purpose.

**6.1 A surprise → the journal.** `[exists]`

```
kb capture --subject "…" --question "…" --claim "…" \
           --anchor "Mutations.addCoupon" --scope "surface=xapi" --deployment vcst-qa
```

Seven fields, none defaulted. `by` and `at` are written by the tool and cannot be typed. The bar is
low on purpose — *something surprised me* is enough — because this is the cheap half of the loop.

**6.2 A rule that did not hold → a dispute, not an edit.** `[exists]`

```
kb dispute KB-1390E170 --deployment vcst-qa --note "coupon came off the LIST price, not the sale price"
```

The rule text is not touched. Both readings stand, the rule is marked contested, and the next brief
that carries `BL-CART-003` carries the dispute with it. **This is the single largest behavioural
change from today**, where the same discovery either rewrites the oracle or is lost in a report.

**6.3 A verified fact → the map, at the end of the run.** `[exists]` — `/qa-test` `5h-map`, FULL
only, non-blocking, and it *appends what the run verified* rather than rewriting. The journal is
where a fact lands first; the map is where it settles once it stops being news.

**Who may write what**

| | agent, unattended | agent, gated | human only |
|---|---|---|---|
| journal entry | ✔ | | |
| dispute on a rule | ✔ | | |
| new domain map | | ✔ `/qa-domain-map` | |
| **refresh** of a map | | | ✔ `--refresh` |
| new rule | | ✔ `/qa-review-oracles`, above the T2 bar | |
| edit to a rule's text | | | ✔ |

---

## 7. Periodically — how knowledge is promoted and how it dies

Not part of a run. Weekly, or when somebody asks.

| | call | what it answers |
|---|---|---|
| what is worth verifying | `rank-oracles` `[exists, re-pointed]` reading `kb rules --json` `[to build]` | severity × citation demand. A rule cited by dozens of cases and observed by nobody is the top of the queue |
| what is missing entirely | `bl:lint` BLC-002 `[exists]` | **50 cited ids that do not exist** — whole absent domains: security, configuration, analytics, localisation, CMS |
| what nobody asked for | `kb demand` `[exists]` | questions asked with nothing written back; observations served and never confirmed |
| what has settled | a human reading the journal | 2+ independent parties, undisputed, stable → promote into the map or into a rule |
| what has rotted | `kb validate` freshness `[to build]` + `kb refute` `[exists]` | a document past its contract; a licensed claim whose coordinates no longer resolve |

Nothing is ever deleted. A rule that stopped holding gains a dispute; a document past its date is
reported, not removed. Un-indexing is reversible, deletion is not.

---

## 8. The whole thing, on one ticket

> **VCST-XXXX — "coupon discount is wrong on a sale item".**
>
> 1. `/qa-test VCST-XXXX` resolves the domain: `cart`. `[exists]`
> 2. `kb domain cart` — map is rev 2, 18 days old; 15 rules; 9 journal entries, one of them
>    contradicting a rule. `[to build]`
> 3. No map would mean `/qa-domain-map cart` first. There is one, so on. `[exists]`
> 4. The test model names two surfaces; the cases cite `BL-CART-003` and `BL-CART-009`.
> 5. `kb brief --domain cart --rules BL-CART-003,BL-CART-009 --anchors Mutations.addCoupon` —
>    three agents, three packs, each ~11 KB instead of a 389 KB path. `[to build]`
> 6. The backend agent reads in its pack: *BL-CART-003 says the coupon applies to the sale price;
>    KB-35F20D97, two parties, saw it applied to the list price.* **It starts already knowing the
>    rule is contested** — which is the difference between filing a defect and filing a question.
> 7. It works. It touches `Mutations.addCoupon`, which the pack covered, so it asks the base
>    nothing.
> 8. It finds the coupon is case-sensitive, which nothing mentioned → `kb capture`. `[exists]`
> 9. It confirms the list-price behaviour → `kb dispute` on `BL-CART-003`, second party. `[exists]`
> 10. At close-out, `5h-map` appends the verified surface to the cart map. `[exists]`
> 11. Next week `rank-oracles` puts `BL-CART-003` at the head of the audit queue: high severity,
>     heavily cited, now disputed twice. `[exists, re-pointed]`
>
> Two of eleven steps are new code. The rest already runs.

---

## 9. What has to be built, smallest first

| | | est. |
|---|---|---|
| `kb rules <domain> --text` | verbatim slices; replaces `bl:extract` | 2 h |
| `kb rules --json` | so `rank-oracles` and `lint-bl`'s coverage half can read the base | 1 h |
| `kb rules --render` | regenerate `business-logic.md` byte-identical, gated like `kb check` — **this is what lets the file move without breaking 98 citations** | 3 h |
| the `reference` plane | documents as files + a `(slug, section)` index + freshness in `kb validate` | 5 h |
| `kb domain <slug>` | the four-line decision | 2 h |
| `kb brief` | the pack, with the budget and the "left out" line | 6 h |
| citation import | 5,890 citations as a read-only count per rule | 2 h |

**21 hours.** Six of the seven are additions to a tool that already runs; none of them changes how
the existing pipeline behaves until a caller opts in, and each can ship alone.

### The one measurement that decides whether this worked

Not a survey, not an impression: **do agents stop reading whole files?** The dispatch pack's own
premise is that they read 386 KB to use three invariants. Count the whole-file reads before and
after. If the number does not fall, the pack is selecting badly and no amount of ranking will fix
it — and that will be visible rather than arguable.
