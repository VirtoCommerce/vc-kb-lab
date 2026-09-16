# How to run round four

One arm. **It runs in a fresh session that has never seen this directory** — the sealed prediction,
the conditions and the stopping rule all live here, and an arm that reads them is grading itself.
The generated brief says so to the agent as well.

---

## 1. Before you launch

```bash
git -C C:/_VIRTO/vc-knowledge status --porcelain
```

Must print nothing. The corpus is the treatment; a dirty tree means the arm is reading something
other than what `CONDITIONS.md` says it read.

```bash
node C:/_VIRTO/vc-kb-lab/measurements/kb-comparison-2026-09/preflight.mjs C
```

Must report **READY**. It exercises the environment rather than reading it. Two earlier launches
died on configuration that had been written and never run.

Then check the arena is clean and the deployment is quiet:

```bash
ls C:/_VIRTO/_arena/artifacts/     # empty, or clear it
```

No cart, and no price list or assignment named `KB-LAB run4` left from a previous attempt.

## 2. Put the register into the session's context

**Not onto its disk — into its context.** This is the whole treatment, and the distinction is the
one the second review drew: the QA-repository arm had its material as *files* and never opened them.
`CLAUDE.md` is loaded into the session automatically, without the agent choosing to.

```powershell
node C:/_VIRTO/vc-kb-lab/measurements/kb-run4-2026-09/make-brief.mjs --out C:/_VIRTO/_arena/CLAUDE.md
Copy-Item C:/_VIRTO/vc-kb-lab/measurements/kb-comparison-2026-09/arena-settings/settings.arm-c-catalog.json C:/_VIRTO/_arena/.claude/settings.json -Force
```

Verify the treatment is one line and nothing else:

```bash
diff <(node -e "const j=require('C:/_VIRTO/vc-kb-lab/measurements/kb-comparison-2026-09/arena-settings/settings.arm-c.json');delete j._comment;delete j.env.VC_MEASURE_OUT;console.log(JSON.stringify(j,null,1))") \
     <(node -e "const j=require('C:/_VIRTO/vc-kb-lab/measurements/kb-comparison-2026-09/arena-settings/settings.arm-c-catalog.json');delete j._comment;delete j.env.VC_MEASURE_OUT;console.log(JSON.stringify(j,null,1))")
```

Expect exactly `KB_RETRIEVAL_OFF: "1"` and nothing more. The arm-C file's own comment once claimed
the same thing and was false for two rounds — verify with the diff, never with the sentence.

## 3. Launch

**Working directory:** `C:/_VIRTO/_arena`. Start a new session and paste **PROMPT** below, verbatim.

Nothing else. No follow-up steering, no hints, no answering questions about the platform or about the
register. If the arm asks you something, the honest reply is *"everything you need is in the task"*.

## 4. Afterwards

```powershell
Remove-Item C:/_VIRTO/_arena/CLAUDE.md
node C:/_VIRTO/vc-kb-lab/measurements/kb-run4-2026-09/score-opens.mjs --log C:/_VIRTO/_comparison-logs/round4/arm-C-catalog
```

Copy the arm's `REPORT.md` out of `C:/_VIRTO/_arena/artifacts/` into the log directory beside its
tool log, so the run can be read without the arena.

---

## PROMPT — paste verbatim

> You are a QA engineer working on a Virto Commerce B2B deployment.
>
> A shopper on the storefront and an operator in Admin are looking at the same product and disagreeing about its price. **Work out what this deployment actually does with prices, and write down what you find.**
>
> Answer these, on store `B2B-store`:
>
> 1. **Which price lists exist, and which of them apply to this store?** Name them, and say what makes one apply — the assignment, its priority, its dates, its conditions, whichever it turns out to be.
> 2. **For one product of your choosing that carries a price in more than one list:** which list's price does the storefront show, and which does Admin show? If they differ, say why.
> 3. **What happens to the price a shopper sees when a promotion also applies?** Is the discount taken off the list price, and is the list price itself ever changed?
> 4. **What decides the price for a customer who belongs to an organization** — is there anything org-specific in the pricing path at all on this deployment, or is that handled somewhere else?
> 5. **Name one thing about pricing here that the contract or the code would lead you to expect, and that this deployment does not do.** If you find none, say so plainly; a null answer is a result.
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
> | Admin and REST — the Pricing module, the product blade, the API | secret name `ADMIN` | secret name `ADMIN_PASSWORD` |
>
> No password is written down anywhere and you must not ask for one. The browser is started with a secrets file: type the secret NAME into the field and the value is substituted for you. That is true of the admin USERNAME as well — type `ADMIN`, not a literal. You will never see any of these values, and none of them may appear in anything you write.
>
> **Rules**
>
> * **Read-only on anything that already exists.** You may create a price list or an assignment if you need one to answer a question; name it with the prefix `KB-LAB run4` and delete it before you finish. Change no existing price list, no existing assignment, and no product.
> * Nobody is signed in as, invited, blocked or deleted.
> * Say **established** or **likely** for every claim, and say which surface you read it from. A confident wrong answer costs more here than an admitted gap.
>
> **Hand in** `REPORT.md` in `artifacts/`, answering 1–5 with the evidence for each.
