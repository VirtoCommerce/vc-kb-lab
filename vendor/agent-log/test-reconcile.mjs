/* Acceptance tests for reconcile.mjs, run against a freshly generated synthetic capture.
 * Each case names what the report is for. */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const check = (name, cond, detail) => {
  if (cond) { pass += 1; console.log("  PASS  " + name); }
  else { fail += 1; console.log("  FAIL  " + name + (detail ? "  ->  " + detail : "")); }
};

const work = mkdtempSync(join(tmpdir(), "recon-"));
const cap = join(work, "capture");
const gen = spawnSync(process.execPath, [join(HERE, "make-reference-capture.mjs"), cap], { encoding: "utf8" });
check("the generator produced a capture", gen.status === 0, (gen.stderr || "").slice(0, 120));

const run = (dir, ...extra) =>
  spawnSync(process.execPath, [join(HERE, "reconcile.mjs"), dir, ...extra], { encoding: "utf8" });

let r = run(cap);
check("exits 0 — the reports are observations, not gates", r.status === 0, "status " + r.status);
for (const h of ["1. COVERAGE", "2. UNDER-LOGGED WINDOWS", "3. METHOD NOT FOUND", "4. TOOL MIX BY PHASE"]) {
  check("prints " + h, r.stdout.includes(h));
}

console.log("attribution: a row's window is the calls AFTER its stamp, because the row is added first");
/* The scripted session reads docs in `orient`, curls in `locate` and reads source in
 * `understand`. If the windows were shifted by one, these would land on the wrong phases — which
 * is exactly the defect this tool found in the generator's first version. */
check("orient is attributed a file read", /orient\s+\d+ calls\s+Read/.test(r.stdout), (r.stdout.match(/orient.*/) || [""])[0]);
check("locate is attributed the curl calls", /locate\s+\d+ calls\s+Bash/.test(r.stdout), (r.stdout.match(/locate.*/) || [""])[0]);
check("report is attributed the writes", /report\s+\d+ calls\s+Write/.test(r.stdout), (r.stdout.match(/report.*/) || [""])[0]);

console.log("report 3 finds the divergence the row itself declares");
/* One row of the capture names a config file as its method and actually found the answer in
 * source — it carries found_elsewhere=yes. Reconcile must reach the same conclusion from the
 * OTHER side, i.e. from what happened rather than from the agent's admission. */
const flagged = (r.stdout.match(/^   row (\d+)  \[/gm) || []).map((s) => s.trim());
check("exactly one row is flagged", flagged.length === 1, JSON.stringify(flagged));
check("that row is the one whose found_elsewhere is yes", (() => {
  const f = spawnSync(process.execPath, ["-e",
    "const fs=require('fs');const d=process.argv[1];const n=fs.readdirSync(d).find(f=>f.startsWith('questions-'));" +
    "const t=fs.readFileSync(require('path').join(d,n),'utf8').split('\\n').filter(Boolean);" +
    "const h=t[0].split(',');const iR=h.indexOf('row'),iF=h.indexOf('found_elsewhere');" +
    "console.log(t.slice(1).map(l=>l.split(',')).filter(c=>c[iF]==='yes').map(c=>c[iR]).join(','))",
    cap], { encoding: "utf8" });
  const yes = (f.stdout || "").trim();
  return flagged.length === 1 && flagged[0].includes(yes);
})(), "flagged=" + JSON.stringify(flagged));

console.log("it refuses a directory that does not hold both logs");
const empty = mkdtempSync(join(tmpdir(), "recon-empty-"));
r = run(empty);
check("non-zero and says what is missing", r.status !== 0 && /need one tool-log/.test(r.stderr), JSON.stringify((r.stderr || "").slice(0, 90)));
rmSync(empty, { recursive: true, force: true });

console.log("under-logged windows are detected when the log falls behind the work");
/* Append a long run of calls after the last row's stamp does NOT do it — that is tail-end work.
 * Instead, re-stamp: add many calls between two rows by appending to the tool log and rewriting
 * the second row's stamp upward, which is what an unlogged stretch looks like. */
const dir2 = join(work, "wide");
spawnSync(process.execPath, [join(HERE, "make-reference-capture.mjs"), dir2], { encoding: "utf8" });
const files2 = spawnSync(process.execPath, ["-e", "console.log(require('fs').readdirSync(process.argv[1]).join(','))", dir2], { encoding: "utf8" }).stdout.trim().split(",");
const tl = join(dir2, files2.find((f) => f.startsWith("tool-log-")));
const qs = join(dir2, files2.find((f) => f.startsWith("questions-")));
for (let i = 0; i < 40; i += 1) appendFileSync(tl, JSON.stringify({ ts: new Date().toISOString(), tool: "Bash", target: "extra " + i }) + "\n");
{
  const t = readFileSync(qs, "utf8").split("\n").filter(Boolean);
  const h = t[0].split(",");
  const iC = h.indexOf("calls");
  const last = t.length - 1;
  const cells = t[last].split(",");
  cells[iC] = String(Number(cells[iC]) + 40);
  t[last] = cells.join(",");
  writeFileSync(qs, t.join("\n") + "\n", "utf8");
}
r = run(dir2);
check("a window far above the median is reported", /row \d+  \d+ calls \(median/.test(r.stdout), (r.stdout.match(/row \d+  \d+ calls.*/) || [""])[0]);
check("and it is not called a failure", r.status === 0);

console.log("");
console.log("passed " + pass + ", failed " + fail);
rmSync(work, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
