# Round four — the task

**Where this task comes from, and why that matters.** It was chosen by
`pick-task.mjs`, which reads the deployment's published REST contract and all 22 archived tool logs
and asks one question: *which namespaces has no run ever touched?* It never opens `captured/`.

`/api/pricing` came out first — 16 routes, walked by nobody.

The three previous rounds chose their oracles the other way round. `ORACLE-EXPLAIN.md` opens with a
section headed *"Coverage, measured before writing the task"* and maps each item to the corpus entry
that answers it, so every fact an arm established had been asked for **because the base held it**.
That made the outcome measure report the oracle. This task is set on ground the base was not
consulted about.

---

## The job

A shopper on the B2B storefront and an operator in Admin are looking at the same product and
disagreeing about its price. Work out what this deployment actually does with prices, and write down
what you find.

Answer these, on `vcptcore-stable`, store `B2B-store`:

1. **Which price lists exist, and which of them apply to this store?** Name them and say what makes
   one apply — the assignment, its priority, its dates, its conditions, whichever it turns out to be.
2. **For one product of your choosing that carries a price in more than one list**: which list's
   price does the storefront show, and which does Admin show? If they differ, say why.
3. **What happens to the price a shopper sees when a promotion also applies?** Is the discount taken
   off the list price, and is the list price itself ever changed?
4. **What decides the price for a customer who belongs to an organization** — is there anything
   org-specific in the pricing path at all on this deployment, or is that handled somewhere else?
5. **Name one thing about pricing here that the contract or the code would lead you to expect, and
   that this deployment does not do.** If you find none, say so plainly; a null answer is a result.

## Rules

* **Read-only on data that matters.** You may create a price list or an assignment if you need one
  to answer a question; if you do, name it with the prefix `KB-LAB run4` and delete it before you
  finish. Change no existing price list, no existing assignment, and no product.
* Nobody is signed in as, invited, blocked or deleted.
* Say **established** or **likely** for every claim, and say which surface you read it from. A
  confident wrong answer costs more here than an admitted gap.

## What to hand in

`REPORT.md` in your artifacts directory, answering 1–5, with the evidence for each.
