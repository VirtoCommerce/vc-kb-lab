# How to run round five

**Two arms, arm A first.** Both run in fresh sessions that have never seen this directory — the
sealed prediction, the conditions and the stopping rule all live here, and an arm that reads them is
grading itself. Arm C's generated brief says so to the agent as well.

**Why arm A first.** Arm A is the arm that must not be contaminated, and the operator is a channel.
Having just watched arm C cite `KB-4CCC2DD6`, it is hard to stay silent during arm A. Run the
control while nobody knows what the treated arm did.

---

## 1. Before either launch

```bash
git -C C:/_VIRTO/vc-knowledge status --porcelain
```

Must print nothing. The corpus is the treatment; a dirty tree means the arms read something other
than what `CONDITIONS.md` says they read.

**The pre-flight checks the arena as it is now, so stage the arm first and run it second.** Written
the other way round it fails every time on `arm A must not have KB_BASE` — the arena is left holding
whichever arm ran last. Step 2 below stages arm A; run the pre-flight after it.

Then check the arena is clean:

```bash
ls C:/_VIRTO/_arena/artifacts/
```

Empty, or clear it. No order, no promotion and no price list named `KB-LAB run5` left from a
previous attempt.

---

## 2. Arm A — the control, no register

```powershell
Remove-Item C:/_VIRTO/_arena/CLAUDE.md -ErrorAction SilentlyContinue
Copy-Item C:/_VIRTO/vc-kb-lab/measurements/kb-comparison-2026-09/arena-settings/settings.arm-a.json C:/_VIRTO/_arena/.claude/settings.json -Force
```

`CLAUDE.md` must be **gone**, not empty — an empty one still tells the agent a register exists.

```bash
ls C:/_VIRTO/_arena/CLAUDE.md
node C:/_VIRTO/vc-kb-lab/measurements/kb-comparison-2026-09/preflight.mjs A
```

The first must say the file does not exist. The second must report **READY** — 11 checks, exercised
rather than read. It verifies among other things that arm A has no `KB_BASE`, which is what makes it
the control.

*(As of this page being written the arena is already staged for arm A and the pre-flight reports
READY. Re-run it anyway: the arena is shared and the last thing to touch it wins.)*

**Working directory:** `C:/_VIRTO/_arena`. New session. Paste **PROMPT A** below, verbatim.

When it finishes, archive the whole run before touching anything:

```powershell
New-Item -ItemType Directory -Force C:/_VIRTO/_comparison-logs/round5/arm-A
Copy-Item C:/_VIRTO/_arena/artifacts/REPORT.md C:/_VIRTO/_comparison-logs/round5/arm-A/ -Force
```

The tool log and kb journal land in the log directory the settings file names; check they are there.

---

## 3. Arm C — the register in the session's context

**Not onto its disk — into its context.** That distinction is the treatment. `CLAUDE.md` is loaded
into the session automatically, without the agent choosing to open anything.

```powershell
node C:/_VIRTO/vc-kb-lab/measurements/kb-run5-2026-09/make-brief.mjs --out C:/_VIRTO/_arena/CLAUDE.md
Copy-Item C:/_VIRTO/vc-kb-lab/measurements/kb-comparison-2026-09/arena-settings/settings.arm-c-catalog.json C:/_VIRTO/_arena/.claude/settings.json -Force
Copy-Item C:/_VIRTO/_arena/CLAUDE.md C:/_VIRTO/_comparison-logs/round5/arm-C-catalog/CLAUDE.md.as-handed -Force
```

**Archive the brief as handed.** The corpus moves during a run — round four's first scorer counted
one of the arm's own new entries back to it, and reported the run as a failure.

Verify the treatment is one line and nothing else:

```bash
diff <(node -e "const j=require('C:/_VIRTO/vc-kb-lab/measurements/kb-comparison-2026-09/arena-settings/settings.arm-c.json');delete j._comment;delete j.env.VC_MEASURE_OUT;console.log(JSON.stringify(j,null,1))") <(node -e "const j=require('C:/_VIRTO/vc-kb-lab/measurements/kb-comparison-2026-09/arena-settings/settings.arm-c-catalog.json');delete j._comment;delete j.env.VC_MEASURE_OUT;console.log(JSON.stringify(j,null,1))")
```

Expect exactly `KB_RETRIEVAL_OFF: "1"` and nothing more. Verify with the diff, never with the
comment in the file — that comment was false for two rounds.

**Working directory:** `C:/_VIRTO/_arena`. New session. Paste **PROMPT C** below, verbatim.

---

## 4. During either run

Nothing. No follow-up steering, no hints, no answering questions about the platform, the register or
the task. If an arm asks, the honest reply is *"everything you need is in the task"*.

## 5. After both

```bash
node C:/_VIRTO/vc-kb-lab/measurements/kb-run5-2026-09/score-protocol.mjs \
  --arm-c C:/_VIRTO/_comparison-logs/round5/arm-C-catalog \
  --arm-a C:/_VIRTO/_comparison-logs/round5/arm-A \
  --catalog C:/_VIRTO/_comparison-logs/round5/arm-C-catalog/CLAUDE.md.as-handed
```

It will report every licensed entry as **unscored** and refuse to print a headline. That is
deliberate: `acted` and `re-verified` both look like an id in prose, and round four published a
number a regex had guessed. Read arm C's report, write `VERDICTS.json`, then re-run.

---

## The prompt — IDENTICAL for both arms

The task lives in the prompt, not in `CLAUDE.md`. `make-brief.mjs` composes the register and the
protocol and nothing else, so arm C's only extra is the register in its context — which is the
treatment and the whole point.

**Paste the block below verbatim to both arms.** Not a word different between them.

> You are a QA engineer working on a Virto Commerce B2B deployment.
>
> A shopper on the storefront and an operator in Admin are looking at the same order and disagreeing about it. **Work out what this deployment actually does with orders, and write down what you find.**
>
> Answer these, on store `B2B-store`:
>
> 1. **Which order objects exist, and which of them apply to this store?** Name them and say what makes one apply — the assignment, its priority, its dates, its conditions, whichever it turns out to be.
> 2. **For one of them that is visible on more than one surface:** what does the storefront show, and what does Admin show? If they differ, say why.
> 3. **What happens when something else applies at the same time** — a promotion, a second object of the same kind, a rule from elsewhere? Say what takes precedence and whether anything underneath is changed.
> 4. **What decides this for a customer who belongs to an organization** — is there anything org-specific in this path at all on this deployment, or is it handled somewhere else?
> 5. **Name one thing here that the contract or the code would lead you to expect, and that this deployment does not do.** If you find none, say so plainly; a null answer is a result.
>
> A question that does not fit is answered **"not applicable here, because …"** and that is a result. Question 1 was written for objects that are *assigned* to a store; if orders are not that kind of object, say so in one line and move on rather than inventing an answer.
>
> **The deployment**
>
> | | |
> |---|---|
> | storefront | `https://vcptcore-stable-storefront.govirto.com` |
> | Admin / platform / REST | `https://vcptcore-stable.govirto.com` |
> | store | `B2B-store` |
>
> **There are TWO identities and you may need both.** They are different accounts with different scopes:
>
> | for | username | password |
> |---|---|---|
> | shopping — the storefront, the cart, what a customer sees | `agent-test-impersonator@virtoworks.com` | secret name `IMPERSONATION_ADMIN_PASSWORD` |
> | Admin and REST — the Orders module, the order blade, the API | secret name `ADMIN` | secret name `ADMIN_PASSWORD` |
>
> No password is written down anywhere and you must not ask for one. The browser is started with a secrets file: type the secret NAME into the field and the value is substituted for you. That is true of the admin USERNAME as well — type `ADMIN`, not a literal. You will never see any of these values, and none of them may appear in anything you write.
>
> **Rules**
>
> * **Read-only on anything that already exists.** You may place an order, or create a promotion, if you need one to answer a question; name anything you create with the prefix `KB-LAB run5` and delete it before you finish. Change no existing order, no existing promotion, and no product.
> * Nobody is signed in as, invited, blocked or deleted.
> * Say **established** or **likely** for every claim, and say which surface you read it from. A confident wrong answer costs more here than an admitted gap.
>
> **Hand in** `REPORT.md` in `artifacts/`, answering 1–5 with the evidence for each.

**The one asymmetry, and it is the treatment:** arm C's session also loads `CLAUDE.md`, which holds
the register and the protocol. Arm A has no `CLAUDE.md` at all. Nothing else differs — not the task,
not the deployment block, not the rules.
