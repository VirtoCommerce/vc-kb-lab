# Rediscovery — the first outcome measure in this project that is not null

```
node measurements/kb-rediscovery-2026-09/rediscovery.mjs [--base <copy>] [--why]
```

Read-only. Touches no deployment. Proposed by the second independent review after three controlled
rounds found no capability difference on tool calls.

## Why this instead of call counts

The base's own protocol tells its reader to treat it as *a lens, never ground truth* and to verify
in proportion to blast radius. **A corpus that instructs re-verification cannot save its reader
calls.** Three rounds measured a quantity the design forbids the base from moving. Round three arm C
is the clean demonstration: it asked at call 2, was served `KB-27B4CD10`, and then spent six source
calls and a bundle download establishing the same fact — rational under the protocol as written.

What a corpus *can* do is stop a fact from being discovered twice. That is computable from the
archive today, with no run.

## The result

| population | events | distinct facts |
|---|---|---|
| **parties that never had the base** | **15** | **7** |
| parties that had the base | 34 | 22 |

### The seven, and who paid to find them again

| fact | found again by |
|---|---|
| `KB-6AA0D7FB` fixed rate shipping method option pricing | **4** — r1 A, r1 B, r2 A, r2 B |
| `KB-4CCC2DD6` what Cancel document on an order actually cancels | 2 — r2 A, r2 B |
| `KB-0DD47BD1` the amount a payment is for is not the payment's total | 2 — r2 A, r2 B |
| `KB-27B4CD10` storefront members Active column reads contact status | 2 — r3 A, r3 B |
| `KB-4B889114` company members Active column vs account locked state | 2 — r3 A, r3 B |
| `KB-4D082C89` a pending invitation is a locked account with no status | 2 — r3 A, r3 B |
| `KB-4982C91F` order-discount-amount-rounding-split | 1 — r1 B |

One fact was re-established by four separate parties across two rounds. **Seven facts, fifteen
payments to learn them.** These parties could not have consulted the base whatever it looked like,
so no design decision of this project can flatter the number.

Every one of the seven is a **deployment-specific surprise** — a thing the contract and the code
would lead you to expect otherwise. None is derivable by reading a schema.

## Rediscovery is not convergent discovery, and the difference is the whole point

The review cites `KB-5ADBFB34` as rediscovered by three arms. It is not in the table above, and
should not be: that entry was **born after all three rounds ran**, written out of their reports.
Three parties independently *discovered* it. That is evidence a fact is worth holding; it is not
evidence that holding it paid.

The birth filter removes this class mechanically — the same rule as the arrival replay, shared from
`../lib/birth.mjs`. `KB-0C102D97`, `KB-132A40B3` and `KB-BF730613` are excluded for the same reason.
Counting them would credit the base for facts it learned from the party it is being measured
against.

## What the second population says

34 events over 22 facts, by parties that **had** the base — and in 22 of the 34 the base had already
served the entry before the party went and established it anyway. That is not a defect in the
retrieval: it is the protocol working exactly as written. It is also the clearest statement yet of
why no round moved a call count, and it will not change until confirmation is strong enough for the
protocol to say *act on a `confirmed` entry without re-checking*.

## How each row is judged, and how to dispute one

Two sources, neither of them free-text matching:

* **`from:` rows in the corpus.** An evidence row naming the report it was read out of. These were
  relabelled on 2026-09-16; before that they said `by: round2-arm-B`, naming a witness that had
  never written anything.
* **`RESTATED` in the script.** A judgement table: party, entry, the report section, and what that
  section says. Each row was read out of the named section and checked against the entry's own
  claim. Disputing one means opening that section and disagreeing — which is why the section is
  named rather than summarised.

## Limits

* **Every number is a floor.** A party that rediscovered a fact and did not write it into its report
  leaves no trace here.
* **The judgement table was built by one person**, the same one who built everything else. The
  reports are on disk and each row cites a section; that is the only defence offered.
* **The two populations are not a controlled comparison.** Rounds differ in task, and n = 1 per arm.
  What the number establishes is that rediscovery happens and is measurable — not its rate.
