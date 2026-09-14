#!/usr/bin/env node
/* memory-guard.mjs — park the project-memory entries a session must not see, then restore them.
 *
 *   node memory-guard.mjs on      # ENGAGE: quarantine the listed entries, strip their index lines
 *   node memory-guard.mjs off     # RELEASE: restore them and re-insert the missing index lines
 *   node memory-guard.mjs status
 *
 * MACHINE-SPECIFIC BY DESIGN. Set VC_MEMORY_DIR to the project memory directory and replace the
 * LEAKS list with the entry names you need out of the way. It takes a full backup before moving
 * anything and verifies byte-identity on restore.
 *
 * WHY IT EXISTS. When a session is meant to run without some particular knowledge, project
 * memory is the channel that leaks it silently. Two things make it awkward:
 *
 *   - A GIT WORKTREE INHERITS THE MAIN REPOSITORY'S PROJECT MEMORY, because the worktree's
 *     `.git` is a file pointing at the main repo and the tooling resolves the project from it.
 *     So a session you believe is isolated may not be.
 *   - MEMORY IS INJECTED, NOT FETCHED. No tool log can show whether it was used, which means the
 *     ground-truth log has a blind spot here and cannot audit compliance. That is why this
 *     removes files rather than asking a session not to look.
 *
 * Remove only what actually leaks. Over-removal is the opposite failure: it takes away the
 * ordinary project knowledge a real session would legitimately have, and quietly changes what
 * you are measuring.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

/* MACHINE-SPECIFIC. Set both before use:
 *   VC_MEMORY_DIR      the project memory directory to guard
 *   VC_MEMORY_QUARANTINE  where the removed entries are parked (default: ./memory-quarantine)
 * The LEAKS list below names entries specific to OUR project - replace it with your own. */
const M = process.env.VC_MEMORY_DIR;
const Q = process.env.VC_MEMORY_QUARANTINE || "./memory-quarantine";
if (!M) { console.error("set VC_MEMORY_DIR to the project memory directory"); process.exit(1); }
const LF = String.fromCharCode(10);

/* REPLACE THIS with the entry names to park, WITHOUT the .md extension.
 *
 * Pick them by grepping every entry for the vocabulary you need withheld, not by reading the
 * filenames — a name-based glance misses entries whose title looks unrelated while the body
 * names the thing. */
const LEAKS = [
  // "some-memory-entry",
];

const idx = join(M, "MEMORY.md");
const entries = () => readFileSync(idx, "utf8").split(LF).filter((l) => l.startsWith("- ["));

function engage() {
  mkdirSync(Q, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const backup = join(Q, "_full-backup-" + stamp);
  mkdirSync(backup, { recursive: true });
  for (const f of readdirSync(M)) if (statSync(join(M, f)).isFile()) copyFileSync(join(M, f), join(backup, f));
  console.log("  full backup: " + backup);

  let moved = 0;
  for (const n of LEAKS) {
    const src = join(M, n + ".md");
    if (!existsSync(src)) { console.log("  absent: " + n + ".md"); continue; }
    copyFileSync(src, join(Q, n + ".md"));
    rmSync(src);
    moved += 1;
    console.log("  quarantined: " + n + ".md");
  }
  const lines = readFileSync(idx, "utf8").split(LF);
  const kept = lines.filter((l) => !LEAKS.some((n) => l.includes("(" + n + ".md)")));
  writeFileSync(idx, kept.join(LF), "utf8");
  console.log("");
  console.log("quarantined " + moved + "; index now holds " + entries().length + " entries");
  /* Set VC_MEMORY_TRIPWIRE to a regex of the vocabulary that must not survive in the index,
   * e.g. "widget-protocol|PROJ-1234". Without it this check is skipped. */
  const tripwire = process.env.VC_MEMORY_TRIPWIRE;
  if (!tripwire) { console.log("  (set VC_MEMORY_TRIPWIRE to verify the index no longer mentions your vocabulary)"); return; }
  const leftover = readFileSync(idx, "utf8").match(new RegExp(tripwire, "gi"));
  console.log(leftover ? "  WARNING: the index still mentions " + [...new Set(leftover)].join(", ") : "  index is clean of the tripwire vocabulary");
}

function release() {
  if (!existsSync(Q)) { console.log("  nothing quarantined"); return; }
  const backupDir = readdirSync(Q).filter((d) => d.startsWith("_full-backup-")).sort().pop();
  let restored = 0;
  for (const f of readdirSync(Q)) {
    if (!f.endsWith(".md")) continue;
    const dest = join(M, f);
    if (existsSync(dest)) { console.log("  skip (present): " + f); continue; }
    copyFileSync(join(Q, f), dest);
    restored += 1;
    console.log("  restored: " + f);
  }
  if (backupDir) {
    const current = readFileSync(idx, "utf8").split(LF);
    const original = readFileSync(join(Q, backupDir, "MEMORY.md"), "utf8").split(LF);
    const missing = original.filter((l) => l.startsWith("- [") && !current.includes(l));
    if (missing.length) {
      writeFileSync(idx, current.concat(missing).join(LF), "utf8");
      console.log("  MEMORY.md: re-added " + missing.length + " index line(s)");
    }
  }
  /* Verify byte-identity before discarding the quarantine, then discard it — a stale quarantine
   * is how a later run silently gets a half-restored memory. */
  let bad = 0;
  for (const f of readdirSync(Q)) {
    if (!f.endsWith(".md")) continue;
    const a = readFileSync(join(Q, f), "utf8");
    const b = existsSync(join(M, f)) ? readFileSync(join(M, f), "utf8") : "";
    if (a !== b) { console.log("  DIFFERS: " + f); bad += 1; }
  }
  console.log("");
  if (bad) { console.log("restored " + restored + " but " + bad + " differ - quarantine KEPT for inspection"); return; }
  rmSync(Q, { recursive: true, force: true });
  console.log("restored " + restored + ", all byte-identical, quarantine removed; index holds " + entries().length + " entries");
}

function status() {
  console.log("  index entries: " + entries().length);
  const present = LEAKS.filter((n) => existsSync(join(M, n + ".md")));
  console.log("  leak-listed entries present in memory: " + present.length + " of " + LEAKS.length);
  console.log("  quarantine dir: " + (existsSync(Q) ? "PRESENT (a run may be guarded)" : "absent"));
  console.log("  => " + (present.length === 0 ? "GUARD IS ON (safe for a context run)" : present.length === LEAKS.length ? "GUARD IS OFF (do not start a context run)" : "PARTIAL - investigate"));
}

/* `on` ENGAGES the guard (memories out of the way); `off` RELEASES it (memories back).
 * The verb names the guard's state, not the memories' - the first version had it inverted,
 * so `off` engaged the guard while `status` reported "GUARD IS ON". */
const cmd = process.argv[2];
if (cmd === "on") engage();
else if (cmd === "off") release();
else if (cmd === "status") status();
else { console.error("usage: memory-guard.mjs on|off|status   (on = guard engaged, memories quarantined)"); process.exit(1); }
