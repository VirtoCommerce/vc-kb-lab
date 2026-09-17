#!/usr/bin/env node
/**
 * THE TOOL IS NOT EDITED HERE ANY MORE.
 *
 * `kb` was built and measured in this repository, and on 2026-09-17 it was ported to
 * `vc-mcp-testing-module/plugins/vc-kb`, which is now the canonical copy (migration decision 9).
 * What stays here is the MEASUREMENT record — `measurements/`, `MEASUREMENT-archive/`, the arm
 * reports — which is the evidence behind every constant in the tool and belongs next to the thing
 * it measured.
 *
 * WHY A CHECK AND NOT JUST A LINE IN THE README. Two copies of a program with nothing comparing them
 * is a single shared assumption away from silent loss: somebody fixes a bug in the copy they happen
 * to have open, and it reaches nobody. The README says where the tool lives; this says whether
 * anybody edited it here anyway.
 *
 * SELF-CONTAINED ON PURPOSE. It compares this tree against a recorded digest of itself rather than
 * against a plugin checkout, because a check that needs the consumer repository present is a check
 * that does not run on the machine where the accidental edit happens. Pass `--against <dir>` to
 * additionally diff a plugin checkout when you have one.
 *
 *   node scripts/frozen-check.mjs                     # did anything change here?
 *   node scripts/frozen-check.mjs --update            # accept the current state as the frozen one
 *   node scripts/frozen-check.mjs --against ../vc-mcp-testing-module/plugins/vc-kb
 *
 * Exit: 0 clean, 1 drift.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MANIFEST = join(ROOT, 'scripts', 'frozen.json');
const TRACKED = ['bin', 'src', 'test'];

// Line endings are normalised away. A checkout on Windows writes CRLF and one on Linux writes LF for
// the same blob, and a freeze check that fired on that would be noise on every second machine.
const digest = (p) => createHash('sha256').update(readFileSync(p, 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 16);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const snapshot = () => {
  const out = {};
  for (const d of TRACKED) {
    for (const f of walk(join(ROOT, d))) out[relative(ROOT, f).split(sep).join('/')] = digest(f);
  }
  return out;
};

const args = process.argv.slice(2);
const now = snapshot();

if (args.includes('--update')) {
  writeFileSync(MANIFEST, `${JSON.stringify({
    frozenAt: new Date().toISOString().slice(0, 10),
    canonical: 'vc-mcp-testing-module/plugins/vc-kb',
    note: 'Digests of bin/, src/ and test/ at the moment the tool stopped being edited here. '
      + 'CRLF is normalised to LF before hashing.',
    files: now,
  }, null, 2)}\n`);
  console.log(`frozen manifest written — ${Object.keys(now).length} files`);
  process.exit(0);
}

if (!existsSync(MANIFEST)) {
  console.error('No scripts/frozen.json. Run `node scripts/frozen-check.mjs --update` to record one.');
  process.exit(1);
}

const was = JSON.parse(readFileSync(MANIFEST, 'utf8')).files;
const changed = Object.keys(now).filter((f) => was[f] && was[f] !== now[f]);
const added = Object.keys(now).filter((f) => !was[f]);
const removed = Object.keys(was).filter((f) => !now[f]);

if (!changed.length && !added.length && !removed.length) {
  console.log(`frozen OK — ${Object.keys(now).length} files unchanged since the port`);
} else {
  console.error('THE TOOL WAS EDITED HERE, and this repository is not where it lives any more.');
  console.error('Canonical copy: vc-mcp-testing-module/plugins/vc-kb\n');
  for (const f of changed) console.error(`  changed  ${f}`);
  for (const f of added) console.error(`  added    ${f}`);
  for (const f of removed) console.error(`  removed  ${f}`);
  console.error('\nMove the change to the plugin. If the edit belongs here after all — a measurement');
  console.error('harness, say — record the new state with `--update` and say why in the commit.');
}

// The plugin is AHEAD by design: the port fixed machine paths, cwd-dependence and base resolution,
// and phase 3 added `kb sync`. So a difference is not itself a fault; an UNEXPLAINED one is. This
// prints the comparison and never changes the exit code.
const againstAt = args.indexOf('--against');
if (againstAt !== -1 && args[againstAt + 1]) {
  const other = args[againstAt + 1];
  console.log(`\nAgainst ${other}:`);
  let same = 0;
  const diverged = [];
  const pluginOnly = [];
  for (const f of Object.keys(now)) {
    const there = join(other, f);
    if (!existsSync(there)) { diverged.push(`${f} — missing in the plugin`); continue; }
    if (digest(there) === now[f]) same += 1;
    else diverged.push(f);
  }
  for (const d of TRACKED) {
    for (const f of walk(join(other, d))) {
      const rel = relative(other, f).split(sep).join('/');
      if (!now[rel]) pluginOnly.push(rel);
    }
  }
  console.log(`  identical ${same} · diverged ${diverged.length} · plugin-only ${pluginOnly.length}`);
  for (const f of diverged) console.log(`    != ${f}`);
  for (const f of pluginOnly) console.log(`    +  ${f}`);
}

process.exit(changed.length || added.length || removed.length ? 1 : 0);
