# The prompt to hand a reviewer

Paste the block below to a fresh agent with read access to both repositories. It is deliberately
short: the brief it points at carries the detail, and a prompt that summarised the findings would be
handing the reviewer our conclusions to agree with.

---

You are reviewing the architecture of a knowledge base built for QA agents working against a Virto
Commerce deployment, and the tool that reads and writes it. Three controlled comparisons found no
capability difference between an agent with this base and an agent without one. A first review
accepted that result and found four instrument defects. **You are not being asked whether it works.
You are being asked whether it is the right shape, and what should be built instead.**

Start with `C:/_VIRTO/vc-kb-lab/measurements/REVIEW-BRIEF-ARCHITECTURE.md`. It states the
architecture, what changed since the first review, four measurements with their scripts, four places
we already believe the design is wrong, and five questions. Read
`measurements/REVIEW-BRIEF.md` next for the outcome history it assumes.

Everything reproduces. Every measurement is a committed script that is read-only and touches no
deployment; run them rather than trusting the numbers on the page. If a number does not reproduce,
that is the most useful thing you can report.

**Two hard rules.**

1. `kb ask` and `kb how` WRITE — they append a row to `demand.jsonl`. To probe the corpus, copy it
   and pass `--base <copy>`, using a drive-letter path (`C:/...`). Under Git Bash, exporting
   `MSYS_NO_PATHCONV=1` for a shell silently redirects writes to a phantom directory; that cost us
   three entries today.
2. Run nothing against the deployment. Every number in the brief came from a live B2B stand that
   other people use.

**What we want from you, in order of value to us.**

1. **Find what is wrong.** Design flaws, unstated assumptions, measurements that do not support the
   claims made from them, tests that pass for the wrong reason. The brief lists the weaknesses we
   already know about; repeating them back is worth less than one we have missed.
2. **Answer the five questions on the brief.** The sharpest is the first: should the derived plane —
   88% of the corpus by count, 15% of it ever used, and the material most adjacent answers are made
   of — be in the retrieval index at all?
3. **Say what to build.** We have verbs for writing, reading, gating and planning. Name the tool
   that is missing, or say that the next thing is not a tool.
4. **Say if the frame is wrong.** If a corpus of this shape cannot beat an agent with a browser and
   a source MCP, say so plainly. We would rather hear it now than after a fourth round.

**How to report.** One document. Lead with the thing you would change first and why. For every claim
about the code or the corpus, cite the file and what you ran. Mark each finding as one you verified
or one you suspect — we would rather have a labelled suspicion than a confident guess, and we have
been wrong in that exact way before.

Do not soften the result. This project's one durable asset is that its instrument keeps catching its
own author; a review that flatters it is worth nothing to us.

---

## Notes for whoever sends this

* The brief was written on 2026-09-16 and states the corpus at 78 active entries, 232 tests. If more
  than a few days pass, re-run `node bin/kb.mjs stat` and `npm test` and correct those two numbers,
  or the reviewer's first act will be to find the discrepancy and wonder what else is stale.
* Send the second brief and the first together. The first one carries the outcome history the second
  assumes and does not repeat.
* Give read access to `C:/_VIRTO/_comparison-logs/` as well. Half the measurements replay it, and a
  reviewer who cannot open it can only take the replay's word.
* Do not send the sealed predictions directory. It is referenced for verification, and a reviewer
  who reads predictions before reproducing results is no longer independent of them.
