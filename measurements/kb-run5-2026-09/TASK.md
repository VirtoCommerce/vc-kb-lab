# Round five — the task

**Where this task comes from.** The five questions were frozen in `QUESTION-TEMPLATE.md` and
committed in `f0386d0`, before any namespace was known. The namespace comes from
`pick-covered-namespace.mjs`, a committed rule that returns the namespace with the most entries an
agent may act on without re-verifying: `/api/order`, with 7.

**What that means and what it costs.** Round four's ground was picked blind to the corpus, and the
register held nothing there — so the licence to act on a confirmed entry unverified was exercised
zero times and the protocol went untested. This round drops the blind pick to get covered ground.
The consequence is named rather than hidden: **rediscovery here is commissioned by the ground.** If
the control arm re-establishes one of these 7 facts, that is not a finding about the register. The
headline is the protocol, and the questions below were not derived from those 7 entries.

Below is the template with `{{NAMESPACE}}` = `/api/order`, `{{SUBJECT}}` = *orders*,
`{{DEPLOYMENT}}` = `vcptcore_stable`, `{{STORE}}` = `B2B-store`. Nothing else was substituted and no
question was added, removed or reworded after the namespace was known.

---

## The job

A shopper on the B2B storefront and an operator in Admin are looking at the same order and
disagreeing about it. Work out what this deployment actually does with orders, and write down what
you find.

Answer these, on `vcptcore_stable`, store `B2B-store`:

1. **Which order objects exist, and which of them apply to this store?** Name them and say what
   makes one apply — the assignment, its priority, its dates, its conditions, whichever it turns out
   to be.
2. **For one of them that is visible on more than one surface**: what does the storefront show, and
   what does Admin show? If they differ, say why.
3. **What happens when something else applies at the same time** — a promotion, a second object of
   the same kind, a rule from elsewhere? Say what takes precedence and whether anything underneath
   is changed.
4. **What decides this for a customer who belongs to an organization** — is there anything
   org-specific in this path at all on this deployment, or is it handled somewhere else?
5. **Name one thing here that the contract or the code would lead you to expect, and that this
   deployment does not do.** If you find none, say so plainly; a null answer is a result.

A question that does not fit is answered **"not applicable here, because …"** and that is a result.
Question 1 in particular was written for objects that are *assigned* to a store; if orders are not
that kind of object, say so in one line and move on rather than inventing an answer.

## Rules

* **Read-only on data that matters.** You may create an object if you need one to answer a question;
  if you do, name it with the prefix `KB-LAB run5` and delete it before you finish. Change nothing
  that already exists.
* Nobody is signed in as, invited, blocked or deleted.
* Say **established** or **likely** for every claim, and say which surface you read it from. A
  confident wrong answer costs more here than an admitted gap.

## What to hand in

`REPORT.md` in your artifacts directory, answering 1–5, with the evidence for each.
