# Your three items, built. One of them does not work, and the reason is a design result

All three were taken. Nothing ran against the deployment; every write landed in the corpus and every
probe ran against a copy. Gate OK — 590 derived, 94 captured, 3 flows. 269 tests, 269 pass.

Commits: `7566f81` (`--note`), `f0386d0` and `841c5da` (round five), `76f554c` + corpus `2185f9d`
(refutation), and before them `061d00e` + corpus `d53fdf7`, which is where the register's number
changed meaning — read that one first, because it moves a number you have been quoting.

---

## Before the three: the register's column was not what the brief said it was

Your demotion of `KB-7E35E6BC` is applied, kept and marked with the report it was checked against.
`partiesOf` skips a row marked `attested: false`.

The sweep you also asked for is **refused**, and the numbers are in the migration's header rather
than in this letter: 47 confirm rows, 40 with no `from`, and **37 of those with no `by` either** —
they predate `sessionParty`, so there is no artefact and no author to check them against. Demoting
them takes the licensed set from 23 to 7. `confirm` never required a note, so their silence is a gap
in the verb, not evidence about the rows; writing a verdict on evidence nobody can read is the same
move as typing your own witnesses, pointed the other way.

**What the demotion turned up, which neither of us was looking for.** `confirmationsOf` counted
evidence **rows**. The trust *level* has counted independent parties since the provenance fix. So an
entry could print `confirmations: 3` and `single-observation` in the same breath — and the brief in
round four's prompt told the arm, in terms, that the column meant "how many independent parties have
seen it. An entry with two or more has been seen by somebody other than its author."

That sentence was false for eight active entries. `KB-BCA7468D` printed **3** where one party had
seen it. Three entries printed 1 for a reading of source code nobody observed at all.

The column now counts parties, source readings excluded. Licensed set: **23 → 22**, one of which is
your demotion. Eight rows in the register you were handed were overstated.

---

## 1. `--note` on `confirm` — done, and not deferred to the brief

I said this would land with the round-five brief so the tool and the arm changed together. That was
wrong in one direction: the brief is not written and the corpus is being confirmed into now. It
refuses today.

```
confirm refused: --note is required — say what you saw that agrees with this entry. A row that
records agreement and describes nothing is a sighting nobody can check, and it counts toward the
`confirmed` level that lets the next reader act without re-verifying. If you read the code rather
than watching it happen, pass --source <Module.Id>:<path>.
```

`--source` is exempt: a source row already names module, installed version and path, which is what
the note would have said. The note lands on the evidence row, not only in the console.

Ten tests confirmed without saying what they saw, including three that only passed because one
session was agreeing with itself. Each now says it. The requirement is in the help, in the collision
refusal that tells a writer which verb to use, and in the arrival hook's hint — so an agent meets it
before the refusal rather than after.

## 2. Round five — your rule is implemented and it picks ground with nothing to test

`QUESTION-TEMPLATE.md` is committed in `f0386d0`, **before** `pick-namespace.mjs` exists in
`841c5da`. That ordering is checkable in the history and it is the point: questions written after
the namespace is known can be shaped to what the register holds.

Then the inverted rule ran. Contract and logs only, never opens `captured/`:

```
   hits  routes  namespace
     47      89  /api/platform
     42      25  /api/marketing
     31      69  /api/catalog
     30      26  /api/order

PICKED: /api/platform — 47 mentions across the archived logs, 89 routes in the contract.

register entries anchored in /api/platform : 7
  of those, licensed (2+ parties, not disputed): 0
```

**Zero.** Round five as specified tests the protocol on exactly what round four tested it on.

The assumption was that most-walked implies best-covered, because the register was written by runs
walking this ground. It does not hold, and a second corpus-blind statistic does not rescue it:

| namespace | runs that touched it | mentions | licensed |
|---|---|---|---|
| `/api/platform` | 16 of 27 | 47 | **0** |
| `/api/stores` | 12 | 14 | **0** |
| `/api/order` | 11 | 30 | **7** |
| `/api/marketing` | 9 | 42 | 2 |

The reason is legible once seen: infrastructure namespaces are traversed by every run on the way to
somewhere else and surprise nobody, so nothing surprising is written about them. The licensed
entries sit where a small number of runs did deep work. `/api/order` has 7 and ranks fourth.

**So the three conditions are satisfiable two at a time, not three:** a corpus-blind pick, ground the
register covers, and questions the register's author did not write. I have not re-picked, and the
script refuses to suggest it — re-picking to raise that number is the commissioning the blind pick
exists to remove.

**What I would do, and it is your call.** Drop the blind *pick* and keep the blind *oracle*: choose
`/api/order` because the register covers it, say so in the run page in those words, and keep the
frozen questions and the sealed prediction. Round three's error was that the oracle — what counted
as success — was written from the corpus, so rediscovery was guaranteed. Here the five questions are
frozen and were not derived from those 7 entries, and the prediction can still fail. That is a
weaker contamination than round three's and it is not zero, and it should be named on the page
rather than engineered away. If you would rather run on `/api/platform` and accept a second round
with the protocol untested, say so and I will.

## 3. Refutations — the half that needs no deployment is built and running

13 of the 22 licensed entries have a request-reachable scope (`rest`, `graphql`, `storefront-xapi`),
which is the set you scoped. A full refutation re-observes the claim, which needs a request and an
authorized session. There is another half, and it runs today:

> A claim is **about** a coordinate. The contract publishes coordinates. A coordinate that stops
> being published means the claim is standing on ground that moved, whatever the claim says.

**Why `validate` did not already do this.** It reports unreachable anchors and calls them coverage —
*"nothing generated will raise them until it does"*. That is right for a storefront route this base
has never extracted and exactly wrong for a REST field that existed last week. In a single snapshot
the two are the same picture and they are opposite findings. Telling them apart needs a baseline of
what **did** resolve, recorded while it was true.

```
refute — 22 licensed entr(ies), baseline taken 2026-09-16T14:26:35.644Z

  unprojected KB-5ADBFB34  only the largest cart-subtotal promotion applies, whatever isExclusive says

  holds 21 · ROTTED 0 · unprojected 1
```

Baseline: 21 entries with at least one resolving anchor, against 3386 contract coordinates. Verified
against a **copy**: renaming one coordinate turns that entry `ROTTED`, names the lost coordinate, and
exits 1, so it can gate a run.

Four properties worth your attack:

* The baseline records **only the hits**, so extending the extractor later never reads as the earlier
  coordinates rotting.
* With no baseline the verb **refuses to judge** rather than guessing.
* It will not confirm or dispute anything for you. A coordinate disappearing says the ground moved,
  not what is true now.
* The baseline was taken deliberately against a derived plane that is **a patch behind the stand**
  (pin 3.1007.26, stand served .27). That is the useful direction: whatever the next `kb extract`
  drops shows up as rot rather than as a silent change nobody attributes.

**What this does not do.** It cannot tell you a claim is false — only that the thing it is about has
moved. An entry whose coordinate is untouched while the behaviour behind it changed reads `holds`.
That is the tier that needs the deployment, and it is the 13.

---

## What we would like from you

1. **Round five's ground.** Which of the three conditions is dropped, and is it the one I propose?
2. **The 37 unattested-by-default rows.** The sweep is refused above. If you still want them marked,
   say what evidence would justify it, because I cannot find any that is not a guess.
3. **Tier two.** 13 entries, one authorized session against the stand. Worth doing before round five,
   or after it?
