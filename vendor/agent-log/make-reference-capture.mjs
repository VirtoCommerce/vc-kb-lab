#!/usr/bin/env node
/* make-reference-capture.mjs — produce a SYNTHETIC but genuinely tool-produced capture, so you
 * can see the shape of a finished session before running one.
 *
 *   node tools/make-reference-capture.mjs [out-dir]      # default: ./reference-capture
 *
 * Everything is invented: a fictional "orders-api" service, fictional endpoints, fictional
 * findings. The SHAPES are real — the tool-log lines are written by tool-log.mjs from synthetic
 * PostToolUse events, and every CSV row goes through log-row.mjs, so the file you get is exactly
 * what a real run produces and `check` / `render` / `merge-runs` all work on it.
 *
 * It is deliberately a generator rather than a checked-in sample: a sample drifts from the tools
 * silently, and nobody notices until the shape it shows is wrong.
 *
 * The session it depicts is written to be worth reading rather than merely well-formed. It
 * contains, on purpose:
 *   - a row whose answer came from somewhere other than the place it named (found_elsewhere yes)
 *   - a row the run could not answer at all (UNANSWERED with a note)
 *   - a row that was believed and then contradicted at the point of use
 *   - a re-asked row
 *   - a VALUE row with NO-RECIPE, and a KNOWLEDGE row that IS the recipe for another VALUE row
 *   - all three `applied` values, plus one row that deliberately keeps the automatic `N/A` because its
 *     answer is a CONVENTION taken from the prompt rather than a claim ABOUT the system
 * Those six are the cases most people's first capture is missing. `applied` was added to this
 * list after a reviewer pointed out that it was the one field the capture did not demonstrate -
 * and it was the one whose semantics had needed explaining, so an empty column was the worst
 * possible place for a gap.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] || join(HERE, "..", "reference-capture");
const SESSION = "ref00001";
const LF = String.fromCharCode(10);

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

/* ---- 1. the ground-truth log, written BY the hook from synthetic events ---- */
const hook = (tool, input, ok = true) => {
  const r = spawnSync(process.execPath, [join(HERE, "tool-log.mjs")], {
    input: JSON.stringify({ session_id: SESSION, tool_name: tool, tool_input: input, tool_response: ok ? {} : { is_error: true }, cwd: OUT }),
    encoding: "utf8",
    env: { ...process.env, VC_MEASURE_OUT: OUT, VC_MEASURE_CAP: "60", VC_MEASURE_SECRETS: join(OUT, ".env.none") },
  });
  return (r.stdout || "").trim();
};

const row = (...args) => {
  const r = spawnSync(process.execPath, [join(HERE, "log-row.mjs"), ...args], {
    encoding: "utf8",
    env: { ...process.env, VC_MEASURE_OUT: OUT },
  });
  if (r.status !== 0) { console.error("log-row refused: " + (r.stderr || "").trim()); process.exit(1); }
  return (r.stdout || "").trim();
};

/* A synthetic session: work out how a fictional orders-api paginates, and verify one claim. */
const steps = [
  // [what the agent "did", then the row it wrote]
  { calls: [["Read", { file_path: "docs/orders-api.md" }]],
    add: ["--class", "KNOWLEDGE", "--backed-by", "DOCS", "--phase", "orient", "--re-asked", "no",
          "--question", "What does the orders-api service do and which surface owns pagination?",
          "--method", "docs/orders-api.md"],
    mark: ["--answer", "It fronts the order store; pagination is a query concern on GET /orders, not a client concern.",
           "--held", "HELD", "--found-elsewhere", "no", "--reusable", "yes",
           "--applied", "MATCHED",
           "--note", "the doc says pagination is server-side; the live endpoint agrees"] },

  { calls: [["Bash", { command: "curl -s http://localhost:8080/orders?limit=2" }], ["Bash", { command: "curl -s http://localhost:8080/orders?limit=2&cursor=abc" }]],
    add: ["--class", "KNOWLEDGE", "--backed-by", "LIVE", "--phase", "locate", "--re-asked", "no",
          "--question", "Is the cursor opaque or an offset?",
          "--method", "GET /orders?limit=2 then follow next_cursor"],
    mark: ["--answer", "Opaque: the value is base64 of a sort key, and an integer is rejected with 400 invalid_cursor.",
           "--held", "HELD", "--found-elsewhere", "no", "--reusable", "yes"] },

  { calls: [["Grep", { pattern: "DEFAULT_PAGE_SIZE" }], ["Read", { file_path: "src/orders/query.ts" }]],
    add: ["--class", "KNOWLEDGE", "--backed-by", "CODE", "--phase", "understand", "--re-asked", "no",
          "--question", "What is the default page size when limit is omitted?",
          "--method", "config/defaults.yaml"],
    mark: ["--answer", "25, and it is clamped to 100 server-side regardless of the requested limit.",
           "--held", "HELD", "--found-elsewhere", "yes", "--found-via", "src/orders/query.ts, not the config file I named",
           "--reusable", "yes",
           "--applied", "CONTRADICTED-BY-ENV",
           "--note", "CLAIM (config/defaults.yaml): default page size 50. OBSERVED: 25, from a constant in the query builder; the config value is commented out and never read"] },

  { calls: [["Bash", { command: "curl -s -X POST http://localhost:8080/auth/token -d grant=client" }, false]],
    add: ["--class", "VALUE", "--backed-by", "LIVE", "--phase", "reproduce", "--re-asked", "no",
          "--question", "Which credential gets a token for the read-only role on this instance?",
          "--method", "POST /auth/token for each credential in the local env"],
    mark: ["--held", "UNANSWERED",
           "--note", "NO-RECIPE. Tried all three credentials the env declares; each returns 401 invalid_client with no detail. The role may not exist on this instance"] },

  { calls: [["Bash", { command: "curl -s http://localhost:8080/orders?limit=200" }]],
    add: ["--class", "KNOWLEDGE", "--backed-by", "ASSUMED", "--phase", "verify", "--re-asked", "no",
          "--question", "Does an over-limit request fail, or silently clamp?"],
    mark: ["--answer", "I assumed it would 400. It clamps to 100 and says nothing.",
           "--held", "CONTRADICTED", "--found-elsewhere", "no", "--reusable", "yes",
           "--marker", "SELF-CORRECTED",
           "--note", "acted on the assumption before checking; the response carries no indication the limit was reduced"] },

  { calls: [["Bash", { command: "curl -s http://localhost:8080/orders?limit=200 -o /dev/null -w %{http_code}" }]],
    add: ["--class", "KNOWLEDGE", "--backed-by", "LIVE", "--phase", "verify", "--re-asked", "yes",
          "--question", "Does an over-limit request fail, or silently clamp?",
          "--method", "GET /orders?limit=200 and count the returned items"],
    mark: ["--answer", "200 OK with exactly 100 items and no warning field. A client cannot tell it was clamped.",
           "--held", "HELD", "--found-elsewhere", "no", "--reusable", "yes"] },

  { calls: [["Bash", { command: "curl -s http://localhost:8080/orders?limit=1" }]],
    add: ["--class", "VALUE", "--backed-by", "LIVE", "--phase", "verify", "--re-asked", "no",
          "--question", "Which concrete order id can I use as a stable fixture here?",
          "--method", "GET /orders?limit=1 and take the first id"],
    mark: ["--answer", "ord_8f21 - but see the recipe row: ids are per-instance and must be discovered, never hardcoded.",
           "--held", "HELD", "--found-elsewhere", "no", "--reusable", "no"] },

  { calls: [["Read", { file_path: "docs/orders-api.md" }]],
    add: ["--class", "KNOWLEDGE", "--backed-by", "DOCS", "--phase", "understand", "--re-asked", "no",
          "--question", "Does the documented archive-after-90-days rule actually apply on this instance?",
          "--method", "docs/orders-api.md, the retention section"],
    mark: ["--answer", "Cannot be decided here: the oldest order on this instance is 6 days old, so nothing has reached the boundary.",
           "--held", "HELD", "--found-elsewhere", "no", "--reusable", "yes",
           "--applied", "UNTESTABLE-HERE",
           "--note", "the claim is checkable in principle, just not against this data set - recorded so a later run knows it is still open rather than confirmed"] },

  { calls: [],
    add: ["--class", "KNOWLEDGE", "--backed-by", "INSTRUCTIONS", "--phase", "report", "--re-asked", "no",
          "--question", "How should a future run obtain an order id instead of reusing this one?"],
    mark: ["--answer", "GET /orders?limit=1 and read items[0].id. The recipe is the reusable part; the id is not.",
           "--held", "HELD", "--found-elsewhere", "no", "--reusable", "yes"] },
];

/* THE ORDER MATTERS AND IT IS THE PROMPT'S OWN RULE: add the row BEFORE the lookups, then do
 * them, then mark. A row's call stamp is taken at `add` time, so the calls attributable to it are
 * the ones that follow. Building the sample the other way round — calls first, then the row —
 * produces a capture in which every row's method belongs to the PREVIOUS row's window, and
 * reconcile.mjs reports each one as a method that did not happen. The first version of this
 * generator did exactly that, and reconcile found it. */
/* One call before the first row, because a real session always has one: it reads $VC_MEASURE_OUT
 * and the task input before it has a question to log. Without it `log-row add` correctly refuses
 * — there is no ground-truth log to stamp against yet. */
hook("Bash", { command: "echo $VC_MEASURE_OUT && ls" });

let n = 0;
for (const s of steps) {
  const out = row("add", ...s.add);
  n += 1;
  const m = out.match(/^row (\d+)/);
  for (const c of s.calls) hook(c[0], c[1], c[2] !== false);
  row("mark", "--row", m ? m[1] : String(n), ...s.mark);
}
/* a few more calls after the last row, so `calls` on the final row is NOT the session total -
 * a real capture looks like this and the difference confuses people */
hook("Write", { file_path: join(OUT, "report.md") });
hook("Write", { file_path: join(OUT, "entries.md") });

writeFileSync(join(OUT, "README.md"),
  "# Reference capture (synthetic)" + LF + LF +
  "Generated by `tools/make-reference-capture.mjs`. Every fact in it is invented - a fictional" + LF +
  "`orders-api` - but the files are produced by the real tools, so the shapes are exact." + LF + LF +
  "Regenerate at any time:" + LF + LF +
  "    node tools/make-reference-capture.mjs" + LF + LF +
  "Six things are in here on purpose, because they are what a first capture usually lacks:" + LF +
  "a row answered somewhere other than where it looked (`found_elsewhere yes`), a question that" + LF +
  "could not be answered (`UNANSWERED` with a note saying what was tried), an assumption that was" + LF +
  "contradicted at the point of use, a re-asked row, a `VALUE` row whose reusable recipe lives in" + LF +
  "a separate `KNOWLEDGE` row, and all three `applied` values." + LF + LF +
  "## What `applied` is doing here" + LF + LF +
  "`applied` answers one question: did knowledge you were HANDED match the system in front of" + LF +
  "you? So it belongs only on a row whose answer came from something loaded - the prompt" + LF +
  "(`INSTRUCTIONS`) or a file you read (`DOCS`/`CODE`). The capture shows all three values:" + LF + LF +
  "- `MATCHED` on the row where the documentation and the live endpoint agreed;" + LF +
  "- `CONTRADICTED-BY-ENV` where a config file claimed one default and the code did another." + LF +
  "  Note its `note`: it records BOTH halves, the claim and the observation. Without both the" + LF +
  "  row cannot be acted on, and `check` refuses it;" + LF +
  "- `UNTESTABLE-HERE` on a documented rule this instance simply cannot decide - recorded so a" + LF +
  "  later run knows the claim is still open rather than quietly confirmed." + LF + LF +
  "**One row deliberately keeps the automatic `N/A`**, and that is the distinction the field needs." + LF +
  "The last row's answer comes from `INSTRUCTIONS`, but it is a CONVENTION taken from the prompt" + LF +
  "(describe the class of value, not the value) - not a claim ABOUT the system. There is nothing" + LF +
  "for the environment to match or contradict, so the flag is not passed and the cell reads `N/A`" + LF +
  "- the value you will see on most rows. `applied` is not \"this row read something loaded\"; it is" + LF +
  "\"a loaded claim about the system was tested against it\"." + LF + LF +
  "Try it out:" + LF + LF +
  "    VC_MEASURE_OUT=reference-capture node tools/log-row.mjs check" + LF +
  "    VC_MEASURE_OUT=reference-capture node tools/log-row.mjs render" + LF + LF +
  "Note that `calls` on the last row is lower than the number of lines in the tool log: the run" + LF +
  "kept working after its final row. That is normal, and it is why `check` compares a row's" + LF +
  "stamp with the PREVIOUS row's rather than with the session total." + LF, "utf8");

console.log("");
console.log("wrote " + OUT);
const check = spawnSync(process.execPath, [join(HERE, "log-row.mjs"), "check"], { encoding: "utf8", env: { ...process.env, VC_MEASURE_OUT: OUT } });
console.log(check.stdout);
