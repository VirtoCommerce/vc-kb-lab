// WHEN A WRITTEN ENTRY CAME INTO EXISTENCE -- the honesty rule shared by every measurement that
// asks whether the base could have helped somebody.
//
// It lives here rather than in one script because it was wrong once and the fix has to reach every
// reader of it. This project has already been bitten by a rule that was correct in one copy and
// stale in another.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { CAPTURED_DIR, FLOWS_DIR } from '../../src/planes.mjs';

export class BirthDatesRefused extends Error {}

/**
 * A base with no git history cannot answer this question, and must say so rather than guess.
 *
 * FOUND BY THE SECOND REVIEW, 2026-09-16, and it is the worst shape of bug this project keeps
 * producing: a degraded answer that looks like an answer. Against the live corpus the rule reports
 * `15 dated by git, 77 by earliest evidence row`. Against a copy made with `git archive` or a `cp`
 * that drops `.git` — the two ways this project's OWN hard rule tells a reviewer to probe without
 * writing — it reported `0 dated by git (added after null), 92 by earliest evidence row`, one
 * informational line, and fell back silently to the typed field the whole rule exists to distrust.
 *
 * A reviewer following the instructions would have got numbers built on backdated timestamps and no
 * warning. On 2026-09-16 the relabelling happens to make both runs agree; a day earlier it would
 * not have.
 *
 * So it refuses. A caller who genuinely wants the typed dates — replaying a corpus that never had a
 * repository — says so in as many words.
 */
export function birthDates(base, { allowTypedDates = false } = {}) {
  // WHEN EACH WRITTEN ENTRY CAME INTO EXISTENCE. This decides which entries may count as help that
  // was already there when a run was recorded, so it is the honesty rule of the whole replay.
  //
  // NEITHER AVAILABLE SOURCE IS AUTHORITATIVE ALONE, and picking one silently is how this went
  // wrong the first time.
  //
  //   The frontmatter `at:` is TYPED. Fifteen rows were typed by the author while reading an arm
  //   report and dated to the minute that arm ran, so entries written on the 16th claimed the 15th.
  //   One of them was the entire reported gain of a measurement. (Relabelled 2026-09-16; a
  //   transcription now carries `from:` and its `at:` is when it was typed.)
  //
  //   Git says when a file appeared, which a writer cannot type -- but this corpus was created on
  //   2026-09-14 and 77 entries went in on day one, having been written during runs that ran days
  //   earlier. For those, the git date is far too LATE and would throw away genuine pre-existence.
  //
  // So: an entry added after the repository's first day is dated by git, because from that point on
  // a new entry was committed near when it was written. An entry from the day-one import is dated by
  // its EARLIEST evidence row -- earliest, not the first one in the file, which is what this used to
  // read and which the review found wrong by construction.
  const bornAt = new Map();
  const gitBirths = new Map();
  let repoDay = null;
  try {
    const first = execFileSync('git', ['log', '--reverse', '--format=%aI', '--max-parents=0'], { cwd: base, encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim().split(/[^0-9TZ:+.-]+/)[0];
    repoDay = first ? first.slice(0, 10) : null;
    const log = execFileSync('git', ['log', '--diff-filter=A', '--name-only', '--format=%aI', '--reverse'], { cwd: base, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore','pipe','ignore'] });
    let when = null;
    for (const line of log.split(new RegExp(String.fromCharCode(91, 13, 10, 93) + String.fromCharCode(43)))) {
      if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T/.test(line)) { when = line.trim(); continue; }
      const m = line.match(/(?:^|[/])(KB-[0-9A-F]{8})[.]md$/);
      if (m && when && !gitBirths.has(m[1])) gitBirths.set(m[1], when);
    }
  } catch { /* not a git checkout: every entry falls back to its earliest evidence row */ }

  let fromGit = 0;
  for (const dir of [CAPTURED_DIR, FLOWS_DIR]) {
    const abs = join(base, dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      if (!f.endsWith('.md')) continue;
      const id = f.replace('.md', '');
      const git = gitBirths.get(id);
      if (git && repoDay && git.slice(0, 10) > repoDay) { bornAt.set(id, git); fromGit += 1; continue; }
      const rows = [...readFileSync(join(abs, f), 'utf8').matchAll(/^ *at: (.*)$/gm)].map((x) => x[1].trim()).sort();
      bornAt.set(id, rows[0] ?? '9999');
    }
  }
  if (!repoDay && bornAt.size && !allowTypedDates) {
    throw new BirthDatesRefused(
      `birth dates refused: ${base} has no git history, so every one of its ${bornAt.size} written entries `
      + 'would be dated by the typed `at:` field — which is the field this rule exists to distrust, and which '
      + 'was found backdated on fifteen rows. A copy made with `git archive`, or a `cp` that dropped `.git`, '
      + 'lands here; so does a corpus that was never a repository.\n'
      + '  Probe a copy that KEEPS its history (`cp -r` the whole directory, `.git` included), or pass '
      + '--trust-typed-dates to say you accept typed dates and know what they are worth.',
    );
  }
  return { bornAt, fromGit, repoDay, typedOnly: !repoDay };
}

export const describeBirths = ({ bornAt, fromGit, repoDay, typedOnly }) => (typedOnly
  ? `BIRTH DATES ARE TYPED, NOT VERIFIED: all ${bornAt.size} come from the \`at:\` field because this base `
    + 'has no git history. Every number computed from them is only as honest as those timestamps, and '
    + 'fifteen of them were found backdated on 2026-09-16. Say so wherever you quote a figure from this run.'
  : `birth dates for ${bornAt.size} written entries: ${fromGit} dated by git (added after ${repoDay}), `
    + `${bornAt.size - fromGit} by earliest evidence row (the day-one import)`);
