#!/usr/bin/env node
/**
 * Pre-flight for an arm. EXERCISES the environment; does not read it and hope.
 *
 *   node preflight.mjs B      the QA repository arm
 *   node preflight.mjs A|C    the arena arms
 *
 * Written after two launches in a row died on configuration I had hand-written and never run:
 * a brief naming one identity where the task needs two, and an .mcp.json whose backslashes a
 * quoted heredoc had eaten. Both were visible in thirty seconds to anything that actually tried
 * the thing rather than reading it.
 *
 * Every check either PASSES on evidence or FAILS loudly. There is no "looks fine": a check that
 * cannot run reports SKIPPED and the whole run reports NOT READY, because an unrun check is not
 * a passed one — the same rule the extractor has lived under since step 1.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const arm = (process.argv[2] ?? '').toUpperCase();
if (!['A', 'B', 'C'].includes(arm)) {
  console.error('usage: preflight.mjs A|B|C');
  process.exit(2);
}

const ARENA = 'C:/_VIRTO/_arena';
const REPO = 'C:/_VIRTO/vc-mcp-testing-module';
const LAB = 'C:/_VIRTO/vc-kb-lab';
const BASE = 'C:/_VIRTO/vc-knowledge';
const KB = `${LAB}/bin/kb.mjs`;

const rows = [];
const ok = (name, detail) => rows.push({ state: 'PASS', name, detail });
const bad = (name, detail) => rows.push({ state: 'FAIL', name, detail });
const skip = (name, detail) => rows.push({ state: 'SKIP', name, detail });
const check = (name, fn) => {
  try { fn(ok.bind(null, name), bad.bind(null, name)); }
  catch (e) { bad(name, e.message); }
};

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ---- configuration parses, and every path it names exists ---------------------------------
const dir = arm === 'B' ? REPO : ARENA;

check('working directory exists', (pass, fail) =>
  existsSync(dir) ? pass(dir) : fail(`${dir} is not there`));

if (arm === 'B') {
  check('repository is on main with the tool absent', (pass, fail) => {
    const b = spawnSync('git', ['-C', REPO, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' });
    const branch = (b.stdout || '').trim();
    const ported = existsSync(`${REPO}/plugins/vc-kb`);
    if (branch !== 'main') return fail(`on ${branch}, not main`);
    if (ported) return fail('plugins/vc-kb is present — this arm would find the tool');
    pass('main, plugins/vc-kb absent');
  });
} else {
  check('.mcp.json parses', (pass, fail) => {
    const p = `${ARENA}/.mcp.json`;
    let cfg;
    try { cfg = readJson(p); } catch (e) { return fail(`${e.message} — the browser server will not load`); }
    const args = cfg.mcpServers?.['playwright-chrome']?.args ?? [];
    const missing = [];
    for (const flag of ['--secrets', '--output-dir']) {
      const v = args[args.indexOf(flag) + 1];
      if (!v) missing.push(`${flag} has no value`);
      else if (flag === '--secrets' && !existsSync(v)) missing.push(`${flag} -> ${v} does not exist`);
    }
    missing.length ? fail(missing.join('; ')) : pass('valid, and every path it names is there');
  });

  check('settings.json parses and carries the instrument', (pass, fail) => {
    const s = readJson(`${ARENA}/.claude/settings.json`);
    const hook = s.hooks?.PostToolUse?.[0]?.hooks?.[0]?.command ?? '';
    if (!hook.includes('tool-log.mjs')) return fail('no PostToolUse logging hook — the run would not be counted');
    const out = s.env?.VC_MEASURE_OUT;
    if (!out) return fail('VC_MEASURE_OUT unset — the log has nowhere to go');
    const wantBase = arm === 'C';
    const hasBase = Boolean(s.env?.KB_BASE);
    if (wantBase !== hasBase) return fail(`arm ${arm} ${wantBase ? 'needs' : 'must not have'} KB_BASE, and ${hasBase ? 'has' : 'has not'} got it`);
    if (!s.permissions?.deny?.some((d) => d.includes('browser_evaluate')))
      return fail('browser_evaluate is not denied — arm B could not script the page and this one could');
    pass(`log -> ${out}${hasBase ? `, KB_BASE -> ${s.env.KB_BASE}` : ', no KB_BASE'}`);
  });

  check('no project context leaked into the arena', (pass, fail) => {
    const bad = ['CLAUDE.md', '.git', '.claude/skills', '.claude/knowledge', '.claude/rules']
      .filter((f) => existsSync(`${ARENA}/${f}`));
    bad.length ? fail(`present: ${bad.join(', ')}`) : pass('no CLAUDE.md, no skills, no rules, not a git repo');
  });

  // The arena is an arm's WORKING DIRECTORY: anything in it is readable, and another arm's report
  // carries every answer this one is supposed to find. The logs used to live in ./logs and were
  // moved out entirely; this check exists so they cannot drift back.
  check('no other arm material is readable from the arena', (pass, fail) => {
    const leftovers = [];
    const walk = (d, depth = 0) => {
      if (depth > 3) return;
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (e.name === 'artifacts' || e.name === 'node_modules') continue;
        const full = `${d}/${e.name}`;
        if (e.isDirectory()) { walk(full, depth + 1); continue; }
        if (/report|tool-log|kb-log|oracle|condition|predict|arm-[ABC]/i.test(e.name)) {
          leftovers.push(full.replace(ARENA + '/', ''));
        }
      }
    };
    walk(ARENA);
    leftovers.length
      ? fail(`an arm could read: ${leftovers.join(', ')} — another arm's report holds every answer this one must find`)
      : pass('nothing from any arm is reachable from the working directory');
  });
}

// ---- the instrument actually writes ---------------------------------------------------------
check('the logging hook runs and is fail-open', (pass, fail) => {
  const r = spawnSync(process.execPath, [`${LAB}/vendor/agent-log/tool-log.mjs`], {
    input: '{}', encoding: 'utf8', timeout: 15000,
  });
  if (r.status !== 0) return fail(`exited ${r.status} on an empty payload — a hook that can fail blocks the work it measures`);
  pass('exit 0 on an empty payload');
});

// ---- the secrets the brief names ------------------------------------------------------------
check('the browser can substitute every secret the brief names', (pass, fail) => {
  const p = `${REPO}/.env.playwright.local`;
  if (!existsSync(p)) return fail(`${p} is missing`);
  const names = new Set([...readFileSync(p, 'utf8').matchAll(/^([A-Z_0-9]+)=/gm)].map((m) => m[1]));
  const need = ['ADMIN', 'ADMIN_PASSWORD', 'IMPERSONATION_ADMIN_PASSWORD'];
  const missing = need.filter((n) => !names.has(n));
  missing.length ? fail(`not in the secrets file: ${missing.join(', ')}`) : pass(need.join(', '));
});

// ---- the deployment answers -----------------------------------------------------------------
const reach = async (url) => {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15000);
    const r = await fetch(url, { signal: ac.signal, redirect: 'manual' });
    clearTimeout(t);
    return r.status;
  } catch (e) { return `unreachable (${e.name})`; }
};

const storefront = await reach('https://vcptcore-stable-storefront.govirto.com/');
const admin = await reach('https://vcptcore-stable.govirto.com/');
(typeof storefront === 'number' ? ok : bad)('storefront answers', `HTTP ${storefront}`);
(typeof admin === 'number' ? ok : bad)('platform answers', `HTTP ${admin}`);

// ---- the base, for arm C --------------------------------------------------------------------
if (arm === 'C') {
  check('the base is where KB_BASE says, and is clean', (pass, fail) => {
    if (!existsSync(`${BASE}/kb.json`)) return fail(`${BASE} carries no kb.json — it is not a base`);
    const st = spawnSync('git', ['-C', BASE, 'status', '--porcelain'], { encoding: 'utf8' });
    const dirty = (st.stdout || '').trim().split('\n').filter(Boolean);
    const counts = `${readdirSync(`${BASE}/captured`).filter((f) => f.endsWith('.md')).length} captured, ` +
      `${readdirSync(`${BASE}/flows`).filter((f) => f.endsWith('.md')).length} flows`;
    dirty.length
      ? fail(`${dirty.length} modified file(s) — snapshot the base before the arm, or its writes cannot be told apart: ${dirty.join(' ')}`)
      : pass(`${counts}, working tree clean`);
  });

  check('kb answers from the arena, against a COPY', (pass, fail) => {
    const copy = 'C:/_VIRTO/_arena/.preflight-base';
    spawnSync('cmd', ['/c', 'rmdir', '/s', '/q', copy.replace(/\//g, '\\')], { encoding: 'utf8' });
    const cp = spawnSync('cmd', ['/c', 'xcopy', BASE.replace(/\//g, '\\'), copy.replace(/\//g, '\\'), '/E', '/I', '/Q', '/Y'], { encoding: 'utf8', timeout: 120000 });
    if (cp.status !== 0) return fail('could not copy the base to probe it without writing to the live one');
    const r = spawnSync(process.execPath, [KB, 'how', 'place an order on the storefront', '--base', copy], {
      cwd: ARENA, encoding: 'utf8', timeout: 60000,
    });
    spawnSync('cmd', ['/c', 'rmdir', '/s', '/q', copy.replace(/\//g, '\\')], { encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || '');
    if (!/^KB-[0-9A-F]+/m.test(out)) return fail(`kb returned no entry:\n${out.slice(0, 300)}`);
    pass(`served ${out.match(/^KB-[0-9A-F]+/m)[0]} — probed against a copy, the live base untouched`);
  });
}

// ---- report ----------------------------------------------------------------------------------
const w = Math.max(...rows.map((r) => r.name.length));
console.log(`\nPRE-FLIGHT — arm ${arm}\n`);
for (const r of rows) console.log(`  ${r.state}  ${r.name.padEnd(w)}  ${r.detail}`);
const failed = rows.filter((r) => r.state !== 'PASS');
console.log(failed.length
  ? `\nNOT READY — ${failed.length} check(s) did not pass. An unrun check is not a passed one.\n`
  : `\nREADY — ${rows.length} checks, all exercised rather than read.\n`);
process.exit(failed.length ? 1 : 0);
