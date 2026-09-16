#!/usr/bin/env node
/**
 * Compose the brief arm C is handed, with the written catalog inside it.
 *
 *   node measurements/kb-run4-2026-09/make-brief.mjs [--base <path>] [--out <file>]
 *
 * The catalog goes in the PROMPT, which is the treatment. Generated rather than pasted, so the brief
 * cannot drift from the corpus it claims to describe — a page that quotes a corpus and is never
 * re-derived is exactly the failure this project spent 2026-09-16 correcting.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { catalogBudgetNotice } from '../../src/catalog-budget.mjs';

const argv = process.argv.slice(2);
const at = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const base = at('--base', process.env.KB_BASE ?? 'C:/_VIRTO/vc-knowledge');
const HERE = fileURLToPath(new URL('.', import.meta.url));
const out = at('--out', join(HERE, 'BRIEF-arm-C-catalog.md'));

// THE DEPLOYMENT KEY IS READ FROM THE PIN, NEVER TYPED. Round four's brief typed
// `vcptcore-stable` with a hyphen; the pin and all 137 existing evidence rows use
// `vcptcore_stable` with an underscore. The tool behaved correctly — it warned that it could not
// stamp a version onto an observation from a deployment it has no pin for — but the arm could not
// fix it either, because `supersede` will not reuse a subject, so one entry is now in the corpus
// with an unstampable key. A value copied into a page drifts from its source with nothing to
// notice; a value read from the source cannot.
const pin = JSON.parse(readFileSync(join(base, 'derived', 'pin.json'), 'utf8'));
const deployment = pin.deployment;

const captured = readFileSync(join(base, 'captured-catalog.md'), 'utf8');
const flows = readFileSync(join(base, 'flows-catalog.md'), 'utf8');
const rows = captured.split(/\r?\n/).filter((l) => /^\| \[`KB-/.test(l)).length;
const retired = (captured.match(/_\(retired\)_/g) ?? []).length;
const live = rows - retired;
const notice = catalogBudgetNotice({ rows, bytes: Buffer.byteLength(captured) });

const brief = `# Round four — the brief for this session

Read this whole page before your first tool call.

## What you are doing

A real QA task against a Virto Commerce deployment. **The task is the job.** Everything below is a
tool you may use; none of it is the subject of the work, and you are not testing it.

Your task was given to you directly. There is no task file to go and find, and nothing under
\`C:/_VIRTO/vc-kb-lab/measurements/\` is for you — that directory holds how this session is being
measured, including what somebody predicted you would do, and reading it would make you the grader
of your own run.

## The register

Below is **everything this project's agents have written down** about this deployment: ${live} one-line
claims, grouped by subject, each with an id. It is not a search index and there is nothing to query.
It is a list. Read it the way you would read the contents page of a thin book.

**To open one:** \`node C:/_VIRTO/vc-kb-lab/bin/kb.mjs show <id>\`, or read \`${base}/captured/<id>.md\`.

A last section lists ${retired} **retired** entries — superseded or withdrawn, kept so that an id you meet
somewhere can still be looked up. They are not part of the register you are reading.

Three things worth knowing before you read it:

* **Every line is a surprise, not a specification.** These are things this deployment does that the
  contract or the code would lead you to expect otherwise. Anything derivable from the schema is not
  here; fetch that from the schema.
* **\`confirmations\` is how many independent parties have seen it.** An entry with two or more has
  been seen by somebody other than its author. One means one, and one is a claim, not a fact.
  (Until 2026-09-16 this column counted evidence ROWS, and was overstated for eight entries — one
  of them printed 3 where a single party had seen it. It counts parties now.)
* **\`attested\` says whether any of them wrote down what they saw.** \`confirm\` took no note until
  2026-09-16, so agreement in this corpus is mostly undescribed: 5 of the 22 entries you may act on
  unverified carry an attested row. A \`confirmations\` of 3 with \`attested: no\` means three parties
  agreed and none of them said what they were looking at. Treat that as weaker than the number
  suggests, and prefer to check it.
* **\`disputed\` means somebody recorded the opposite.** Those are listed first in their section on
  purpose: a contested claim is the most useful thing to know before you lean on it.

### How much to trust it, and when to check

This is the protocol, and it is different from previous rounds. Read it carefully.

* An entry marked **\`confirmed\`** (two or more independent confirmations, not disputed) **may be
  acted on and cited without re-verifying it.** Cite it as \`@kb(<id>)\` and move on. You are not
  required to reproduce it.
* An entry with **one confirmation**, or any **disputed** entry, is a lead and not a finding. Verify
  it before you rely on it, and say in your report what you saw.
* Reality still outranks the register. If what you observe contradicts an entry, that observation
  wins, and \`node C:/_VIRTO/vc-kb-lab/bin/kb.mjs dispute <id> --deployment ${deployment}
  --note "<what you saw>"\` records it.

### The loop

When you learn something the register does not hold — and on this task you will, because it holds
nothing about the ground you are working on — write it:

\`\`\`
node C:/_VIRTO/vc-kb-lab/bin/kb.mjs capture --subject "…" --question "…" --claim "…" \\
  --anchor "<a route, a page, a GraphQL type>" --scope "surface=…" --deployment ${deployment}
\`\`\`

\`node C:/_VIRTO/vc-kb-lab/bin/kb.mjs capture --help\` explains what belongs in each field. If something in the register
held, \`confirm\` it; if it did not, \`dispute\` it.

**\`kb ask\`, \`kb how\` and \`kb deliver\` are switched off in this session.** That is deliberate and
it is the thing being measured: the register is in front of you instead of behind a query.

---

${captured}

---

${flows}
`;

writeFileSync(out, brief);
console.log(`brief written: ${out}`);
console.log(`  catalog rows : ${rows}`);
console.log(`  brief bytes  : ${Buffer.byteLength(brief)}  (~${Math.round(Buffer.byteLength(brief) / 4)} tokens)`);
if (notice) console.log(`  BUDGET: ${notice}`);
