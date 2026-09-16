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

const captured = readFileSync(join(base, 'captured-catalog.md'), 'utf8');
const flows = readFileSync(join(base, 'flows-catalog.md'), 'utf8');
const rows = captured.split(/\r?\n/).filter((l) => /^\| \[`KB-/.test(l)).length;
const notice = catalogBudgetNotice({ rows, bytes: Buffer.byteLength(captured) });

const brief = `# Round four — the brief for this session

Read this whole page before your first tool call.

## What you are doing

A real QA task against a Virto Commerce deployment. **The task is the job.** Everything below is a
tool you may use; none of it is the subject of the work, and you are not testing it.

Your task is in \`measurements/kb-run4-2026-09/TASK.md\`. Read it next.

## The register

Below is **everything this project's agents have written down** about this deployment: ${rows} one-line
claims, grouped by subject, each with an id. It is not a search index and there is nothing to query.
It is a list. Read it the way you would read the contents page of a thin book.

**To open one:** \`node bin/kb.mjs show <id>\` — or open \`captured/<id>.md\` under the base directly.

Three things worth knowing before you read it:

* **Every line is a surprise, not a specification.** These are things this deployment does that the
  contract or the code would lead you to expect otherwise. Anything derivable from the schema is not
  here; fetch that from the schema.
* **\`confirmations\` is how many independent parties have seen it.** An entry with two or more has
  been seen by somebody other than its author. One means one, and one is a claim, not a fact.
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
  wins, and \`node bin/kb.mjs dispute <id> --deployment vcptcore-stable --note "<what you saw>"\`
  records it.

### The loop

When you learn something the register does not hold — and on this task you will, because it holds
nothing about the ground you are working on — write it:

\`\`\`
node bin/kb.mjs capture --subject "…" --question "…" --claim "…" \\
  --anchor "<a route, a page, a GraphQL type>" --scope "surface=…" --deployment vcptcore-stable
\`\`\`

\`node bin/kb.mjs capture --help\` explains what belongs in each field. If something in the register
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
