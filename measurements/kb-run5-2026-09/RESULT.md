# Round five — the result

Two arms, one task, on `/api/order`. Arm A first, with no register; arm C with the register in its
context and `kb ask` / `how` / `deliver` switched off. Same prompt, word for word.

```
node measurements/kb-run5-2026-09/score-protocol.mjs \
  --arm-c C:/_VIRTO/_comparison-logs/round5/arm-C-catalog \
  --arm-a C:/_VIRTO/_comparison-logs/round5/arm-A \
  --catalog C:/_VIRTO/_comparison-logs/round5/arm-C-catalog.as-handed.md
```

| | arm A (control) | arm C (register) |
|---|---|---|
| tool calls | 282 | 200 |
| evidence screenshots | 38 | archived |
| kb journal rows | none — no `KB_BASE`, by design | 31 |
| objects created on the stand | 2 promotions, 1 order, all deleted | **none** |

The call difference is **not** a result. The two arms did different work: arm A built its own
promotions and placed an order, arm C found two existing orders that already carried both cases.
That is a strategy difference on one task, and three earlier rounds established that call counts do
not move.

---

## The headline: the licence was taken, twice, and mostly refused

Round four could not test the protocol at all — only one entry it touched was licensed, and nothing
rested on it. This round put 7 licensed entries under the task.

| verdict | count | entries |
|---|---|---|
| **acted** — used without re-verifying, which the protocol permits | **2** | `KB-6AA0D7FB` (on ground), `KB-5ADBFB34` (off ground) |
| **re-verified** — checked anyway before relying on it | 7 | `KB-0C102D97`, `KB-0DD47BD1`, `KB-4982C91F`, `KB-F1542157`, `KB-CA4C93E4`, `KB-358A70CB`, `KB-5F7C8FC4` |
| **untouched** | 4 | `KB-4CCC2DD6`, `KB-FF7E4D5B`, `KB-6E98AA17`, `KB-AFB2D3C5` |

**The stopping rule did not fire.** It was: *the frame fails if arm C acted on zero licensed
entries.* It acted on two, and said so itself in a section headed "Cited without re-verifying
(confirmed entries, per the session protocol)".

**Both acted-on entries held.** Neither is a case of the licence doing harm, which was named in
advance as the worse failure.

**But the ratio is the finding, and it runs against the treatment.** Seven re-verified against two
acted. `KB-0C102D97` was licensed *and* attested — the strongest thing the register can say about an
entry — and the arm checked it anyway, in detail. An agent handed a licence to skip verification
mostly declines it. That is not what the protocol change was designed to produce, and it is the
second round in a row where the register's *permission* half does less than its *list* half.

The verdicts are in `VERDICTS.json`, written by hand from the report, because `acted` and
`re-verified` are the same shape in a log. `score-protocol.mjs` refuses to guess between them.

## The sealed prediction, scored

| predicted | actual |
|---|---|
| 4 of 7 on-ground entries used | **2 of the 4 named** were used; 2 of the 3 named "not used" were used instead |
| 2 of those acted rather than re-verified | **2** — correct |
| 3–8 opens | **2** — wrong, and low |
| 1–3 new entries written | **6** — wrong, and high |
| arm A independently establishes 1–2 of the 7 | **2** — correct |
| question 1 answered "not applicable" | **correct, and both arms said so independently** |

Half right, which is what sealing is for. The two misses are informative: the arm opened almost
nothing (the one-line claims were enough or were re-established from the deployment directly), and
it wrote far more than predicted on ground the register supposedly covered well.

## Tier two, obtained from a run that was happening anyway

Arm A, with no register, independently established two facts the register already held as licensed:

* `KB-5ADBFB34` — read the `BestReward` setting, created two cart-subtotal promotions, saw one
  discount line, then flipped the winner by raising the second from 5% to 30%.
* `KB-F1542157` — Line items header against order total on two independent orders: 348.99 / 0.00 /
  348.99 against 314.09, and 298.00 / 0.00 / 298.00 against 208.60.

Both now carry a `from:` row pointing at the archived report, so the party is an artefact a reader
can open rather than a session that typed a name.

**This is not evidence that the register is useful.** The ground was chosen because the register
covers it, so rediscovery here is commissioned by the ground — `SEALED-RELEVANCE.md` said exactly
that before either arm started. Its value is that the deployment session tier two was going to
require is now partly unnecessary.

**Attested licensed entries: 5 of 22 before the round, 13 of 27 after.**

## The demoted entry was disputed, from the other direction, on the same day

`KB-7E35E6BC` — "Admin renders order timestamps in local time while the API returns UTC" — carried a
confirm that described nothing, written in a batch of three at the end of a pricing task. It was
demoted this morning on the reviewer's argument that a sighting nobody described should not count.

Arm C then **disputed it on the mechanism**: Admin renders from the operator's *platform profile*
timezone (`America/New_York`), not the browser's (UTC+4). The warning was sound; the stated cause
was wrong. It captured the corrected mechanism as `KB-8C3E463D`.

An entry reached by an unattested confirm turned out to be wrong about why. That is one case and it
is not proof of anything, but it is the first time the attestation argument has been paid back.

## What arm C found that the register did not hold

Six new entries: which clock an Admin timestamp is in; order-blade deep links not re-targeting an
open blade and rendering degraded when cold; `coupons` being a storefront-only field absent from the
REST contract; the cancellation reason being customer-facing verbatim; what actually makes a
promotion reach a store; and the scoped discount totals never written for a cart-subtotal reward.

**An eleventh instrument defect, found by the measured party again.** `GET
/api/platform/profiles/currentuser` is served by the deployment and is where the operator's timezone
lives, but the derived plane does not project it, so `validate` reports the anchor as resolving to
nothing. The `/api/platform` namespace is not projected in full, contrary to what the validator's
wording assumes. Note that `pick-namespace.mjs` picked `/api/platform` as the most-walked namespace
— on a projection that is incomplete.

## What this run does not show

* **n = 1 per arm, one task.** No capability claim is made and none is available.
* **The ground was chosen for coverage.** Every rediscovery number here is commissioned.
* **`acted` is 2 out of 13 in play.** It is above the stopping rule and it is small.
* **`KB-6E98AA17` was scored `untouched`** although it appears once as a parenthetical. The verdict
  vocabulary has no "mentioned in passing" and inventing one after seeing the result would be moving
  the bar, so it was counted the way that flatters the treatment least.
* **The pin is still stale.** Arm C observed platform `3.1007.27`, reported it, and its rows carry
  `3.1007.26` anyway, exactly as the brief warned. Nothing here fixes that.
