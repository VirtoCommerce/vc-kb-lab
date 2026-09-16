# kb-arrival-2026-09 — would the base have arrived before the agent went to source?

Reproduce:

```
node measurements/kb-arrival-2026-09/replay-logs.mjs --detail
```

Read-only against the corpus; safe on the live base.

## The question, and why "fires" was the wrong answer to it

Three runs consulted the base in their opening minutes and never again. Round three's arm holding
the corpus asked it **two questions in 84 calls**. It is not consulted because nothing prompts it.

`hooks/arrive.mjs` is the mechanism built for that: a PostToolUse hook that looks at the coordinate
an agent just touched — a URL, a route in a `curl`, a GraphQL field — and hands back what the base
holds about it, unasked. It was **enabled in no arm of any round.** Every comparison so far measured
unprompted recall of a tool, which is near zero for everything.

The first version of this page counted *fires* over three runs. A fire is a coordinate the base knew
something about; it says nothing about whether the agent needed it. The metric that can say
something is the **order of two events in one run**:

* **arrival-call** — the first call at which an entry that *already existed before the run began*
  would have been handed over, because the call touched its coordinate;
* **source-call** — the first call at which the arm went to platform source for an answer:
  `raw.githubusercontent.com` in a Bash target, or the source MCP (server id `da5c9759…`). The two
  channels every arm of rounds two and three used. The twelve runs and round one used neither.

## What was replayed

All twenty-two archived logs, **4,038 calls**: runs 01–12 and the ten completed arms of rounds
one to three. Round one's aborted arm-B attempt and round three's quarantined contamination log are
excluded and named.

Three honesty rules, two of them new:

1. **An entry counts only if it existed before the run started**, read off its first evidence row.
   Derived entries count as pre-existing — the coordinates were the deployment's own — and the
   restructure of 2026-09-12 (287 → 590 entries) is stated rather than hidden.
2. **A call to the base is not an arrival at a coordinate.** `kb capture --anchors /company/members`
   names the coordinate to write about it. Every `bin/kb.mjs` call is excluded and counted apart.
3. **Arrival is by coordinate, the fetch is by subject, and the two are judged side by side by a
   person.** The judgement is data in the script (`SOURCE_SUBJECTS`), so the number is reproducible
   and any row can be disputed by editing it.

Limit of the logs: `target` is cut at 200 characters (669 of 4,038 calls). Coordinates past the cut
are invisible, so arrivals are under-counted, if anything.

## The result

| | |
|---|---|
| arms that ever went to platform source | **6 of 22** — every arm of rounds two and three; nobody else, ever |
| of those, *some* pre-existing entry would have arrived before the first fetch | **6 of 6** — true, and meaningless: see next row |
| source subjects, judged by a person | **9** (round two: C# arithmetic ×3; round three: the Active column ×3, the sign-in mechanism ×3) |
| a pre-existing entry **on the same subject** would have arrived before the fetch for it | **3 of 9 subjects, in 3 of 6 arms** |
| distinct entries doing that work | **1 — `KB-27B4CD10`**, "storefront members Active column reads contact status not account state", anchored on `GET /company/members` |
| of the 3, arms that had not already asked the base for it | **2 of 3** — arms A and B of round three, which had no base and never asked one |
| first in time, about something else | **6 of 9** — the whole of round two, and the sign-in mechanism in round three |

Per arm, the three same-subject cases:

| arm | arrival | fetch | gap | what the arm went to source for |
|---|---|---|---|---|
| r3 A (nothing) | call 8, `/company/members` | call 13, `FrontendSourceCode` for Members.vue | **5 calls** | what the Active column reads |
| r3 B (QA repo) | call 9 | call 15 | **6 calls** | same |
| r3 C (the base) | call 11 | call 56 | 45 calls — but it had **asked** at call 2 and been served this entry; the arrival duplicates its own question | same |

Round three's oracle item 6 is "the Active column reports contact status"; every arm scored it 1.0,
and arms A and B got there by reading `Members.vue` from source at call 13 and 15. `KB-27B4CD10` is
that answer, written by run 05 on 2026-09-12. It would have been in front of both arms five and six
calls earlier, at the moment they opened the page, from a base neither of them had.

**The six that were not.** Round two fetched C# — `CustomerOrderService`, `DiscountEntity`,
`RewardExtensions`, `CartAggregate`, `BestReward`. What arrived before those fetches was REST route
tables and a promotion flow. Round three's second subject, the sign-in mechanism (`PendingApproval`,
`Locked`, `RequireConfirmedEmail`), has no entry in the corpus at all; `KB-4D082C89` arrives on the
same page and is adjacent, not the mechanism. The corpus carries mechanism only where it was visible
from outside a running deployment — which the review brief already said — so nothing on those
subjects *could* arrive.

## What this does and does not establish

**Established:** the first non-null signal in the base's favour, in three rounds. Not a speed-up
and not a score: a moment. On the one subject the corpus held the answer to, it would have handed
that answer to two agents that had no base, before either went to source for it. The bar set for
this measurement — arrival lands first in at least half the cases — is met at exactly half of the
arms (3 of 6) and one third of the subjects (3 of 9), on one entry. Say it that way.

**Not established:** whether an arm *reads* what arrives. This is a replay of logs, not a run.
Every number above is "would have"; the next run's question is whether the injection changes what
the agent does, and that is measured by nothing here.

**Also not established:** anything about round one or the twelve runs. None of them went to source
through either channel, so the metric has no second event to compare against there. Their arrival
columns are printed for completeness and mean only what the first version of this page said they
meant: the hook pays where work touches routes.

## Two matcher defects the replay caught, added to the three the first version caught

1. **A namespace is not a place.** The derived plane's root entry is anchored on `POST /api`, whose
   path is a prefix of 675 of the 700 route coordinates. It "arrived" on every REST call any agent
   made and was the commonest arrival in eleven of twenty-two logs. A route whose path prefixes most
   of the index is now skipped (`src/arrive.mjs`); `/cart` and `/search`, one segment each and
   prefixing nothing, still fire.
2. **Writing about a coordinate looks like touching one.** Already named in the first version;
   quantified here as the `kb-calls` column (311 of 4,038 calls) and excluded. The same class fired
   this hook on every edit of this page while it was written.

## The rehearsed moment (Task 3)

Offline, against a copy of the corpus, the hook was fed a PostToolUse payload for a browser
navigation to `/company/members`:

```
echo '{"hook_event_name":"PostToolUse","tool_name":"mcp__playwright-chrome__browser_navigate","tool_input":{"url":"https://<storefront>/company/members"}}' | KB_BASE=<copy> node hooks/arrive.mjs
```

It returns, as `additionalContext`:

```
The knowledge base holds entries anchored on a coordinate you just touched:
  @kb(KB-27B4CD10)  storefront members Active column reads contact status not account state  [written by an agent]  — anchored on GET /company/members
  @kb(KB-4A8606CA)  an abandoned invitation can leave an account nothing can delete  [written by an agent]  — anchored on GET /company/members
  @kb(KB-4D082C89)  a pending invitation is a locked account with no status  [written by an agent]  — anchored on GET /company/members
Read one with `node bin/kb.mjs deliver "<your question>"` — or `kb how "<what you are trying to do>"`
for a procedure, which `deliver` deliberately cannot reach. You can also open the file directly.
An agent-written entry is one observation until someone else confirms it. If it holds, `kb confirm <id> --deployment <name>`; if it does not, `kb dispute`.
```

The first line is the answer to round three's item 6, before any question is asked. The hook is
enabled in this repository's own `.claude/settings.json`, and for an arena session in
`measurements/kb-comparison-2026-09/arena-settings/settings.arm-c-arrival.json` — arm C's file plus
this one hook, logging to its own folder, **not a comparison arm and not used for any number on any
RESULT page.**
