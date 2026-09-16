# Round four, corrected. Every claim in part three reproduced, and one thing you left out

Nothing below ran against the deployment. Everything is the archived log, the handed catalog and the
corpus.

## Your claims, checked one at a time before accepting any of them

| your claim | how it was checked | verdict |
|---|---|---|
| call 307 hides two opens | dumped every tool-log target containing a `KB-` id: call 22 `cat ".../captured/KB-6824BC2B.md"`, call 307 `cd .../captured && cat KB-AD1FA66B.md; echo …; cat KB-35A09C64.md` | **stands** — opens are 3 |
| "cited: 7" counts bookkeeping | `grep -no 'KB-[0-9A-F]\{8\}' REPORT.md`: `KB-7E35E6BC` occurs once, on line 199, inside the closing "Register work" table | **stands** — body citations are 6 |
| the confirm on `KB-7E35E6BC` has no observation | the entry is about order timestamps; the report never mentions a timestamp; the journal shows three confirms at 12:29:22, :23, :23 | **stands** |
| `KB-1B18B821` and `KB-F027283D` were cited against the protocol | both are 1 confirmation in `CLAUDE.md.as-handed`; the report says "which I did not re-verify and am citing only as context" and "Consistent with" | **stands** |
| the showpiece was built from the opened body | call 307 reads `KB-AD1FA66B` at 12:23:00; section 5 quotes its body; the report was still being edited at call 354, 12:31 | **stands** |
| seven rows carry a version the stand was not running | every `session:8ec21246` evidence row in `captured/` reads `platformVersion: 3.1007.26`; `derived/pin.json` says 3.1007.26; `REPORT.md:3` and `:204` say the platform served 3.1007.27 | **stands** |
| writing is end-loaded | all twelve kb-journal rows fall between 12:26:24 and 12:29:30, calls 339–351 of 357, in a run that began 11:49 | **stands** |
| `KB-6824BC2B` is a use the scorer cannot see | opened at call 22, 11:51:33, two minutes in; the report lists platform GraphiQL among the surfaces read and cites nothing | **stands** |

Eight for eight. The scorer is fixed, `RESULT.md` is corrected in place with the old numbers kept
beside the new ones, and the re-run reproduces your table exactly:

```
register entries touched: 8 of 92
  cited in the body     : 6
  named only in a table : 1   (bookkeeping, not reasoning)
  confirmed or disputed : 3
  opened as a file      : 3   (a floor: 45 of the log's targets are cut at 200 chars)
```

The scorer no longer prints a result. It prints what it can count and says in the output that
whether a citation *changed* anything is a judgement about prose that no regex here can make.

## The thing you left out, and it is worse than what you found

**The changed protocol — the treatment's second half — got no test at all.** From the confirmation
counts in the handed catalog:

| entry | confirmations as handed | protocol said | arm did |
|---|---|---|---|
| `KB-AD1FA66B` | 1 | verify it | opened and verified. **That is the old protocol working** |
| `KB-F1542157` | 1 | verify it | reproduced and confirmed |
| `KB-1B18B821` | 1 | verify it | cited as unverified context |
| `KB-F027283D` | 1 | verify it | cited as unverified context |
| `KB-5F7C8FC4` | 3 | may act unverified | cited as context; nothing built on it |
| `KB-35A09C64` | 4 | may act unverified | verified anyway |

Exactly one entry the new rule licensed was touched, and nothing rested on it. Our page reported
"four entries acted on without re-verification" as the protocol working; two of those four were the
protocol being ignored, and the showpiece was a **lead the protocol required verifying**, verified.
So the sharpest result of round four is evidence for the rule we already had.

A consequence for your question 2: a run on covered ground is not a nice-to-have second data point.
It is the only condition under which the licence to act unverified can be exercised at all.

## Your three answers

**1. The count.** Accepted as you wrote it: **4 substantive uses, 3 opens, 2 observed confirms**, and
that is what `RESULT.md` now leads with. We would add one qualification against ourselves rather than
for: three of the four involved opening the entry. The one-line claim carrying the work unaided is
`KB-F1542157`, and that is a single event.

**2. The next run.** Taken. The five questions become a template parameterised by namespace and
store, frozen and committed before `pick-task.mjs` is inverted to pick the most-walked namespace, and
arm A runs the same task as a control. One thing we would add to your list of constants: the **model
and the settings diff are already held**, but the *register itself* must be archived again as handed,
because round four wrote five entries into it and the next run's catalog will not be this one.

**3. Refutations.** Taken, narrowly, for the two-or-more-confirmations-and-not-disputed set with
scope `rest`, `graphql` or `storefront-xapi`. Your argument is the one that carries it: the stand
moved a patch under the corpus mid-run and nothing mechanical noticed, while the protocol was busy
telling an agent it may act on claims nobody has re-observed. UI entries stay prose.

## The pin, which is ours and is the worst finding here

`kb check --env` existed, was not in the pre-flight, and would have been red. The fix is both halves,
not either: `kb check` becomes a gate that stops a run, **and** the stamp stops copying
`derived/pin.json`. A version is a property of the deployment at the moment of the sighting; reading
it from a file written days earlier is the same class of error as the brief typing the deployment
key, which this run also caught. The seven rows will be corrected only by re-extracting against the
stand, which is a separate action against the deployment and is not being done from a log-reading
session.

**A `--note` on `confirm`** is accepted in principle and is a CLI contract change that will land with
the round-five brief rather than quietly now, so that the arm reading the brief and the tool
enforcing it change together.

## Not disputed

The zero source calls, the 78-of-92 depth with your caveat about what "reached" means, and the
self-supersede. On that last one we agree it needs no scorer — which is the general point of your
review: the two numbers that needed one were both wrong, and the finding that needed none was right
the first time.
