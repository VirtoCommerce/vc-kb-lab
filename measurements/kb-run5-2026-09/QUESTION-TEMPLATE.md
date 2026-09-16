# The five questions, frozen before the ground is chosen

**This file is committed before `pick-namespace.mjs` is run.** That ordering is the point and it is
checkable in the git history: if the questions are written after the namespace is known, they can be
shaped to what the register happens to hold, which is the commissioning the second review caught in
round three's oracle and again, smaller, in round four.

Round four's residue was not the namespace — that was picked by a rule that never opens
`captured/`. It was the **questions**. Question 3 ("what happens when a promotion also applies") and
question 5 ("one thing the contract would lead you to expect") were written by somebody who knew the
register held 19 promotion entries, and the sealed list predicted five of them for question 3.
Predicted and used came out 5 of 8. That is the same reflection at one remove.

So the questions are frozen here, parameterised by exactly two things:

* `{{NAMESPACE}}` — the REST namespace `pick-namespace.mjs` returns, e.g. `/api/pricing`
* `{{SUBJECT}}` — the ordinary English noun for what that namespace is about, taken from the
  contract's own vocabulary and not invented
* `{{STORE}}` — the store the work is done against

Nothing else may be substituted, and no sixth question may be added. If a question does not fit the
namespace, it is answered "not applicable here, because …" and that is a result.

---

## The template

> ### The job
>
> A shopper on the B2B storefront and an operator in Admin are looking at the same {{SUBJECT}} and
> disagreeing about it. Work out what this deployment actually does with {{SUBJECT}}, and write down
> what you find.
>
> Answer these, on `{{DEPLOYMENT}}`, store `{{STORE}}`:
>
> 1. **Which {{SUBJECT}} objects exist, and which of them apply to this store?** Name them and say
>    what makes one apply — the assignment, its priority, its dates, its conditions, whichever it
>    turns out to be.
> 2. **For one of them that is visible on more than one surface**: what does the storefront show,
>    and what does Admin show? If they differ, say why.
> 3. **What happens when something else applies at the same time** — a promotion, a second object of
>    the same kind, a rule from elsewhere? Say what takes precedence and whether anything underneath
>    is changed.
> 4. **What decides this for a customer who belongs to an organization** — is there anything
>    org-specific in this path at all on this deployment, or is it handled somewhere else?
> 5. **Name one thing here that the contract or the code would lead you to expect, and that this
>    deployment does not do.** If you find none, say so plainly; a null answer is a result.
>
> ### Rules
>
> * **Read-only on data that matters.** You may create an object if you need one to answer a
>   question; if you do, name it with the prefix `KB-LAB run5` and delete it before you finish.
>   Change nothing that already exists.
> * Nobody is signed in as, invited, blocked or deleted.
> * Say **established** or **likely** for every claim, and say which surface you read it from. A
>   confident wrong answer costs more here than an admitted gap.
>
> ### What to hand in
>
> `REPORT.md` in your artifacts directory, answering 1–5, with the evidence for each.

---

## What this does and does not buy

**Buys:** the questions are no longer a channel through which the register's contents reach the
task. Both arms get the same five, and so will round six.

**Does not buy:** the questions are still *this project's* questions, written originally against
pricing, and a template frozen once by the same author is not an independent instrument. It removes
the per-run shaping, not the original shaping. If round six's result turns on question 3 again, that
is the thing to suspect.

**The known cost:** questions 1 and 4 assume the namespace has objects that can "apply to a store"
and a possible organization dimension. On a namespace where neither is true, two of five questions
collapse into "not applicable", and the run is thinner than round four's. That is accepted rather
than fixed, because fixing it means editing the template after seeing the namespace, which is the
whole thing this file exists to prevent.
