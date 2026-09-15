# Conditions

What is true of the setup when the arms start. **No prediction and no expected outcome appears on
this page** — those are sealed as a hash, outside both repositories, and published beside the result.

## The corpus, frozen

`VirtoCommerce/vc-knowledge` at commit **`7b66ecb`** — **590 derived + 74 captured (65 active) + 3
flows**. `kb validate` green. The demand loop has no open questions.

**Nothing has been written to the base since 2026-09-14, and nothing will be written between the
arms.** Arm C may write freely, because it runs last.

**One thing I deliberately did not do.** Verifying the shipping value below amounted to an
independent second observation of `KB-6AA0D7FB`, which would ordinarily earn a `kb confirm` and
raise that entry from single-observation to confirmed. `KB-6AA0D7FB` is the entry item **S4** scores.
Raising its trust hours before sealing — however honest the observation — is exactly the kind of act
that makes a result impossible to defend, so the confirm waits until the arms are done. The
observation is recorded here instead.

## What the base holds about this task

Measured by probing a COPY of the corpus, not by recollection:

| entry | plane | what it is |
|---|---|---|
| `KB-EB228603` | flow, confirmed | create a percentage-off promotion and see it apply on the storefront |
| `KB-AFB2D3C5` | flow, confirmed | an order placed on the storefront and read back in Admin — six steps, four amendments |
| `KB-6AA0D7FB` | experiential, single-observation | why every delivery option costs 0.00; cited from inside the flow above |
| `KB-D992AF44` | experiential, confirmed | an order's discount row is a snapshot, not a live reference |
| `KB-23769765` | derived | `OrderPaymentMethodType` |

**The base holds the recipe, not hints.** That is stated here, in the ticket, and on the result page,
rather than left for a reader to discover.

**Tax is a MISS** under every phrasing tried.

**One known retrieval gap sits on item S4.** `"why is the delivery option price zero"` returns
`KB-6AA0D7FB` at rank 1; `"what does shipping cost on this deployment"` MISSES. Same entry, same
corpus. Each arm's exact wording is recorded for that reason.

## The deployment

`vcptcore_stable`, platform 3.1007.26, pin `c2f9c438eba4cd95`.

**Checked today, 2026-09-15, against the oracle's one pre-set expected value:**

    GET /api/platform/settings/VirtoCommerce.Shipping.FixedRateShippingMethod.Ground.Rate
      value=null  defaultValue=0   -> effective 0
    GET /api/platform/settings/VirtoCommerce.Shipping.FixedRateShippingMethod.Air.Rate
      value=null  defaultValue=0   -> effective 0

So **shipping 0.00 holds** and the oracle stands as written.

Two earlier readings of this were **vacuous and were discarded**: `/api/stores/{id}` carries no
`shippingMethods` key at all, and `GET /api/shipping` returns the registry entries with
`settings: null`. Both produced an empty loop and a reassuring "no rate configured" that was
evidence of nothing. An empty read is not a negative result, and the third query is the first one
that actually asked the question.

### Residue a reader should know about

* Orders `CO260913-00001` … `CO260914-00004`, all **Cancelled**. Orders cannot be deleted here.
  Three shipments remain `New`.
* **Three disabled promotions**, from runs 09, 10 and 12. **None of them belongs to any arm.** Run
  12's still describes itself as 10% while its reward is 20%; that mismatch is deliberate evidence
  and is not to be fixed.
* **One permanent product configuration** from run 11, neutralised to `isActive: false,
  sections: []`. Nothing on this platform can delete a configuration.
* An undeletable contact from run 05.

## The arms

| arm | working directory | context | base | order |
|---|---|---|---|---|
| **B** | `C:/_VIRTO/vc-mcp-testing-module` | skills, `.claude/knowledge/`, CLAUDE.md | no | first |
| **A** | `C:/_VIRTO/_arena` | none | no | second, if time allows |
| **C** | `C:/_VIRTO/_arena` | none | **yes** | **last** |

**Sequential, never parallel** — promotions are global on this deployment, so two arms at once would
apply each other's discounts to each other's carts.

**C last**, on the residue the others leave, so nobody can say it had the clean stand.

**150 tool calls each**, counted the way the harness counts them: a batched browser call is one.

### The arena

`C:/_VIRTO/_arena` holds `.mcp.json` (one browser server) and `.env` (URLs, store id, the sign-in
literal). **No `CLAUDE.md`, no `.claude/`, not a git repository.** Emptied of artifacts between arms.

No secret is in that directory. The browser runs with `--secrets`, so an arm types the NAME
`IMPERSONATION_ADMIN_PASSWORD` and never sees a value.

### Arm B runs before `qa-investigate` learns about the base

VCST-5963 teaches that skill to consult the base. Once it does, an arm without a base is neither a
clean B nor the shipped configuration — it is "the repository with a broken base". So the
measurement runs ahead of the construction, deliberately.

## What is not being changed for this comparison

No code in the base or the tool. No entry retired, corrected, re-anchored or confirmed. No catalog
or pricing data. No promotion that existed before an arm arrived.
