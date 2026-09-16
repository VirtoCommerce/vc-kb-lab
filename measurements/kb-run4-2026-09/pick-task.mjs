#!/usr/bin/env node
/**
 * WHERE TO SET THE NEXT TASK, chosen by a rule instead of by looking at the corpus.
 *
 *   node measurements/kb-run4-2026-09/pick-task.mjs
 *
 * Run condition 1 of the second review: "draw the oracle from somewhere other than the corpus, or
 * the number is manufactured again." The previous rounds' oracles were built by checking what the
 * base already held — `ORACLE-EXPLAIN.md` opens with "Coverage, measured before writing the task" —
 * so every fact an armless arm established had been asked for because the corpus had it.
 *
 * The rule here looks at the DEPLOYMENT and the LOGS, and never at `captured/`: which parts of the
 * published REST contract has no run ever touched? That picks ground by what has not been walked,
 * which is a property of the work rather than of the knowledge base.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LAB = fileURLToPath(new URL('../..', import.meta.url));
const CMP = 'C:/_VIRTO/_comparison-logs';
const base = process.env.KB_BASE ?? 'C:/_VIRTO/vc-knowledge';

// Every REST namespace the contract publishes, from the DERIVED plane only.
const routes = new Map();
const derivedDir = join(base, 'derived', 'entries');
for (const f of readdirSync(derivedDir)) {
  if (!f.endsWith('.md')) continue;
  const t = readFileSync(join(derivedDir, f), 'utf8');
  if (!/^subject: rest-api/m.test(t)) continue;
  for (const m of t.matchAll(/^ {2}- coordinate: (?:[A-Z]+ )?(\/api\/[^\s]*)$/gm)) {
    const ns = m[1].split('/').slice(0, 3).join('/');
    if (!routes.has(ns)) routes.set(ns, new Set());
    routes.get(ns).add(m[1]);
  }
}

// Everything any run or arm has ever touched.
const touched = [];
const dirs = [];
for (const d of readdirSync(join(LAB, 'MEASUREMENT-archive'))) dirs.push(join(LAB, 'MEASUREMENT-archive', d));
for (const d of ['arm-A', 'arm-B', 'arm-B2', 'arm-C']) dirs.push(`${CMP}/${d}`);
for (const r of ['round2', 'round3']) for (const d of ['arm-A', 'arm-B', 'arm-C']) dirs.push(`${CMP}/${r}/${d}`);
for (const dir of dirs) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (!/^tool-log-.*\.jsonl$/.test(f)) continue;
    touched.push(readFileSync(join(dir, f), 'utf8').toLowerCase());
  }
}
const haystack = touched.join('\n');

const rows = [...routes.entries()]
  .map(([ns, set]) => ({ ns, routes: set.size, walked: haystack.includes(ns.toLowerCase()) }))
  .sort((a, b) => Number(a.walked) - Number(b.walked) || b.routes - a.routes);

console.log('REST namespaces the contract publishes, by whether any of 22 archived runs touched one');
console.log('');
console.log('walked  routes  namespace');
for (const r of rows) console.log(`${r.walked ? '  yes ' : '   NO '}  ${String(r.routes).padStart(6)}  ${r.ns}`);
console.log('');
const unwalked = rows.filter((r) => !r.walked);
console.log(`${unwalked.length} of ${rows.length} namespaces have never been touched.`);
console.log('The task is set on the largest of them. Nothing here reads `captured/`.');
