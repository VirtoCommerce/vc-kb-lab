# The source door, and the fact that it has never had an occasion to open

**Result: across all fifteen questions this project has on record, the source door fired zero
times. Not zero useful pointers — zero occasions.** Run it yourself:

```
node measurements/kb-sourcedoor-2026-09/replay-misses.mjs --base <a copy of the corpus> --why
```

## What the door is

When `kb ask` cannot answer, it used to say so and stop. Since 2026-09-16 a MISS also names the
module that owns the nearest coordinate, the version of that module **installed on the extracted
deployment**, and a GitHub URL at that tag. The version is resolved out of the derived plane's
`appliesTo`, never typed, so the door cannot point at a tag the deployment is not running.

The pointer is gated: a near-miss earns one only if the entry behind it carries at least one
evidence row. An entry nobody has ever confirmed is not a good enough reason to send somebody
into a repository.

## What it scores, and against what

Two question sets, kept apart because one is evidence and the other is mine.

* **RECORDED** — every question the corpus's own `demand.jsonl` recorded as a MISS. Nobody wrote
  them for this measurement. Seven distinct.
* **ORACLE** — round two's eight oracle items, phrased as questions by me. Reported separately and
  never folded into a headline.

Ground truth is not a judgement: round two's arms fetched platform source 24 times, and every URL
names a repository. Mapped back through `src/data/module-repos.json`, those are the modules agents
demonstrably needed. The door is scored on whether it points inside that set — on saying *where to
look*, which is all it claims. The set is recomputed from the logs on every run rather than pasted
here.

## The result

| | RECORDED (7) | ORACLE (8) |
|---|---|---|
| answered outright | 5 | 8 |
| answered by a flow instead (redirect) | 2 | 0 |
| **MISS — the door had an occasion** | **0** | **0** |
| door named a module | 0 | 0 |

## Why it is zero, which is the interesting part

**A mechanism that only fires on a MISS cannot be exercised by a base that has stopped missing.**

* Thirteen of the fifteen are answered — and `measurements/kb-missdrift-2026-09/` shows that six of
  those answers are *adjacent rather than right*. The drift that makes the MISS contract unreliable
  is the same drift that starves the door. The two findings are one finding.
* The remaining two are procedural (`create a percentage-off promotion…`). Since the same day's flow
  fix, `ask` refuses those and names the flow that genuinely answers them — `KB-EB228603` and
  `KB-A54C919F`. The door is right to stay silent; a procedure is not a question about mechanism.

**This measurement was itself wrong first.** It scored a procedural redirect as a MISS, which put
2 in the MISS column and made the door look silent where it had nothing to be silent about. Fixed
2026-09-16; the corrected run distinguishes `redirect` from `MISS`.

## What this does and does not license

It does **not** say the door is useless. Every question on record predates it, and the class it was
built for — *the base does not know, and the answer is mechanism in C#* — is exactly the class round
two went to source for six times, and none of those six has ever been asked of the base.

It does say this: **the door is unmeasured, and it cannot be measured by replay.** Only a run that
asks a question the base genuinely cannot answer will exercise it. Until then it is a claim, and the
brief should say so rather than list it as a fix that landed.
