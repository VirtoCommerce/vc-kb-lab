# Rediscovery — and the headline this page had to retract within a day

```
node measurements/kb-rediscovery-2026-09/rediscovery.mjs [--base <copy WITH its .git>] [--why]
```

Read-only. Touches no deployment. Proposed by the second independent review after three controlled
comparisons found no capability difference on tool calls.

## Why this instead of call counts

The base's own protocol tells its reader to treat it as *a lens, never ground truth* and to verify in
proportion to blast radius. **A corpus that instructs re-verification cannot save its reader calls.**
Round three arm C is the clean demonstration: it asked at call 2, was served `KB-27B4CD10`, then
spent six source calls and a bundle download establishing the same fact — rational under the protocol
as written. What a corpus *can* do is stop a fact from being discovered twice.

---

## RETRACTED: "15 events, 7 facts — the one number no design decision can flatter"

That is what this page said. **The task design flattered it.**

`ORACLE-EXPLAIN.md` opens with a section headed *"Coverage, measured before writing the task"* and
maps each oracle item to the corpus entry that answers it — `KB-6AA0D7FB` "states it exactly",
`KB-0DD47BD1` "states it exactly". `ORACLE-MEMBERS.md` does the same for the Active column and the
pending invitation. The tasks asked for those facts **because the corpus held them**, so an armless
arm that answers the task establishes them by construction.

| armless events | 15 |
|---|---|
| **commissioned** — an oracle item chosen because the corpus held it | **15** |
| **incidental** — established without being asked | **0** |

The shape of the measure is right. That value was the oracle's own coverage table read back through
the reports. Found by the second review; the script now prints the split and the headline is gone.

**Fixed for the next run by run condition 1:** draw the oracle from outside the corpus, and seal a
relevance list before the arm runs.

---

## The number that is worth quoting

| parties that had the base | |
|---|---|
| events | 34 over 22 distinct facts |
| the base **served** the fact first, and the party confirmed it | 22 |
| **held and never offered** — the base had it, put it in front of nobody, the party established it and then confirmed it by id | **12** |

```
run-02  KB-D4A064A5  promotion discount rounding on the cart
run-05  KB-27B4CD10  storefront members Active column reads contact status not account state
run-05  KB-4B889114  company members Active column vs account locked state
run-05  KB-06409954  three independent fields represent a blocked organization member
run-08  KB-0DD47BD1  the amount a payment is for is not the payment's total
run-08  KB-4CCC2DD6  what Cancel document on an order actually cancels
run-09  KB-35A09C64  promotion re-evaluation on cart read
run-09  KB-4982C91F  order-discount-amount-rounding-split
run-09  KB-4CCC2DD6  what Cancel document on an order actually cancels
run-09  KB-6E98AA17  admin order operations tree staleness after cancel
run-10  KB-996BDF08  cart-level promotion reward placement
run-10  KB-35A09C64  promotion re-evaluation on cart read
```

**A confirm that follows a serve is the loop closing, not waste.** Counting those 22 as waste would
mean the better the loop works, the worse this reads — the review's correction, and it is right. The
retrieval-and-arrival failure is the other column: the fact was in the base, nothing put it in front
of anybody, and somebody paid for it anyway. No oracle commissioned that one.

## How each row is judged

* **`from:` rows in the corpus** — an evidence row naming the report a claim was read out of.
  Relabelled 2026-09-16; before that they said `by: round2-arm-B`, naming a witness that had never
  written anything.
* **`RESTATED` in the script** — party, entry, report section, what that section says, and the oracle
  item that commissioned it. A row is disputed by opening that section.
* **journals** — a `confirm` written by the tool, not by the party.

## Limits

* **Every number is a floor.** A party that rediscovered a fact and did not write it into its report
  leaves no trace.
* **The judgement table was built by one person**, the same one who built everything else.
* **The two populations are not a controlled comparison.** n = 1 per arm, different tasks.
* **Run it against a copy that keeps its `.git`.** Without history the birth rule refuses outright
  rather than falling back to the typed `at:` field, which is the field it exists to distrust. Pass
  `--trust-typed-dates` only if you mean it.
