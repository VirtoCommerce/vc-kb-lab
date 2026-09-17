# Import sample — 20 of the 216, for a person to read

Written from a TRIAL import into a copy of the base, not into the base. Nothing here is in
`vc-knowledge` yet. Twenty were picked to cover every shape the parser met, not at random: five
contradictions, five with anchors, five with none, and five awkward ones.

What to check in each: the body is the page's own block verbatim and nothing was cut; the subject
leads with the author's id; `attested: false` with a `whyNot`; `from` points inside the base;
the anchors name places the rule is actually about, and no place it is not.

---

## BL-CART-003 → KB-1390E170

*Picked because:* a contradiction the annex established (KB-13B32D5F), and the one entry whose body carries a "Known behavior" block

```yaml
subject : BL-CART-003 Coupon + sale interaction
plane   : normative
anchors : —
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:35:54.703Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-CART-003: Coupon + sale interaction `[P0-revenue]`

- **Rule:** A percentage coupon applies to the already-discounted (sale) price, not the original list price. A fixed-amount coupon subtracts from the cart total after all line-level discounts. If a coupon's minimum order amount is not met after sale discounts, the coupon must be rejected. Only one coupon per cart unless multi-coupon is explicitly enabled.
- **Verify:** Item at $100 list, $80 sale → apply 10% coupon → discount = $8 (10% of $80), not $10. Apply second coupon → rejected with "Only one coupon allowed" message.
- **Violation signal:** Coupon discount calculated on list price; coupon accepted when min-order threshold not met; multiple coupons applied when multi-coupon is disabled.
- **Agents:** qa-frontend-expert (cart totals), qa-backend-expert (promotion engine API)
- **Known behavior (2026-03-13):** Under `BestRewardPromotionPolicy`, applying a coupon-backed `CartSubtotalReward` **always replaces** an auto-applied cart subtotal reward, even if the coupon discount is smaller. This is by design in `BestRewardPromotionPolicy.cs:79-80` — coupon-backed rewards are explicitly preferred via `FirstOrDefault(x => !x.Coupon.IsNullOrEmpty()) ?? FirstOrDefault()`. Under `CombineStackablePromotionPolicy`, only one `CartSubtotalReward` per priority group is kept. Stacking two cart subtotal discounts requires different priority values. Neither policy is a bug — it's a store configuration choice. See `SBTM-promotions-2026-03-13.md` for full source code analysis.

---

## BL-B2B-005 → KB-B152EF7F

*Picked because:* a contradiction that names NO coordinate — invisible to extraction, seeded by hand from the annex

```yaml
subject : BL-B2B-005 Member role determines feature visibility
plane   : normative
anchors : —
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:36:02.184Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-B2B-005: Member role determines feature visibility `[P1-data]`

- **Rule:** Organization features visible on the storefront depend on the member's role. Org Admins see: member management, quotes, order approval, lists. Buyers see: order placement (within limits), lists, own orders. Members without purchasing role see: catalog browsing only. Feature visibility is controlled by both role permissions and the store's feature flags (`quotesEnabled`, etc.).
- **Verify:** Sign in as Org Admin → see "Members", "Quotes", "Approval" menu items. Sign in as Buyer → see "Orders", "Lists" but NOT "Members." Sign in as view-only member → no cart, no checkout access.
- **Violation signal:** Buyer sees member management; non-purchasing member can add to cart; features visible when feature flag is OFF; role change not reflected until re-login.
- **Data path (VCST-5028):** Permission-gated features read `pageContext.user.permissions`, which MUST be populated from the **active `OrganizationMembership.Roles`** after an org-switch. The global `ApplicationUser.Roles` is no longer the source of truth for org-scoped visibility. (BUG-A: the org-scoped JWT was correct but the `me`/GetPageContext projection returned `permissions:[]`, hiding maintainer actions — see BL-B2B-007.)
- **Org-level roles (VCST-5239):** beyond per-member `OrganizationMembership.Roles`, an org can carry **org-level roles** (`Organization.Roles`) inherited by **all** its members. Effective perms = the **deduped union** of org-level-role ∪ membership-role ∪ global roles (storefront `getContactRoles` unions org+global). Removing a member's own membership-role override MUST preserve the org-inherited perms (verified — no strip-the-base regression).
- **Agents:** qa-frontend-expert (storefront nav), qa-backend-expert (org roles API)

---

## BL-ORD-007 → KB-9D9AFB7A

*Picked because:* a contradiction on order state transitions (KB-4C5627CE)

```yaml
subject : BL-ORD-007 Shipment state machine (detailed)
plane   : normative
anchors : —
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:35:58.337Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-ORD-007: Shipment state machine (detailed) `[P1-data]`

- **Rule:** Live admin Shipment Status dropdown exposes 5 values (verified 2026-04-22 on the environment):
  - `New` → `Pick & Pack` (items being prepared)
  - `Pick & Pack` → `Ready to Send`
  - `Ready to Send` → `Send` (shipped with tracking number — note admin spelling is "Send" not "Sent")
  - `Any state` → `Cancelled`
- **No "Delivered" shipment sub-state.** Delivered/fulfilled semantics are represented at the ORDER level via `OrderStatus = Completed`, not at the shipment level.
- Illegal: `New → Send` (skipping Pick & Pack and Ready to Send); reversing transitions.
- **Verify:** For each illegal transition, attempt via API → expect error. In Admin, verify available actions match current state. Tracking number required for `Send` transition.
- **Violation signal:** State skipped; shipment marked `Send` without tracking number; API allows illegal jump.
- **Storefront label mapping:** per `project_order_status_vocab` memory — admin `Send` → storefront "Shipped"; order-level `Completed` → storefront "Completed" (delivered semantics).
- **Agents:** qa-backend-expert (shipment API), qa-testing-expert (Admin SPA)

---

## BL-AUTH-012 → KB-2E5BD401

*Picked because:* two contradictions at once, and the longest anchor set in the AUTH domain

```yaml
subject : BL-AUTH-012 Org-scoped lockout does not touch the global account
plane   : normative
anchors : GET /api/platform/security/users/{id}/locked, POST /api/customer/organization-memberships/{id}/lock, POST /connect/token
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:36:00.556Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-AUTH-012: Org-scoped lockout does not touch the global account `[P0-revenue]`

- **Rule:** Setting `OrganizationMembership.IsLocked = true` for (userId, orgX) MUST NOT set `ApplicationUser.LockoutEnd`. `GET /api/platform/security/users/{userId}/locked` MUST remain `{"locked": false}`, and the user MUST still authenticate into any other organization whose membership is unlocked. (VCST-5028 — the exact regression the feature exists to prevent: the old handler globally locked the shared user.)
- **Verify:** Lock membership in org X via `POST /api/customer/organization-memberships/{id}/lock` → `GET /api/platform/security/users/{userId}/locked` returns `locked: false` → `/connect/token` with `organization_id=X` → HTTP 400 `code: user_is_locked_in_organization` → `/connect/token` with `organization_id=Y` (same user, unlocked) → HTTP 200. **The 400 requires X to be the user's ONLY accessible organization** (or a non-`password` grant): on a `password` grant, a user who also has an accessible org Y is **silently fallen back to Y and gets HTTP 200 with no error** — see BL-AUTH-016. Use a single-org fixture, or assert the refusal on a non-`password` grant, or the step reads as a false PASS/FAIL depending on the fixture's org count. Two further traps: the **no-`organization_id`** variant of the same call returns **HTTP 200 with no organization context** rather than any refusal (the chain resolves nothing — BL-AUTH-015), so a refusal must be asserted on the explicit-org form; and the global-lock state must be read from the `/locked` endpoint, because the by-id platform-user payload can come back successful but **empty**, in which case a test reading `isLockedOut` off it sees `undefined` and passes without proving anything.
- **Violation signal:** Global `locked: true` after an org-scoped lock; login to a non-locked org fails with the same credentials.
- **Agents:** qa-backend-expert (organization-memberships REST, security API)
- **Source:** `vc-module-customer` `OrganizationMembership.cs:16-22` (lock state lives on the membership; `IsCurrentlyLocked` = `IsLocked` && not expired) + `OrganizationMembershipController.cs:118-133` (lock/unlock act on the membership id only) + `OrganizationIdRequestValidator.cs:92,115` (the org-scoped refusal) against the independent global-lock path at `:38-41` and `:129-134` (which reads the platform account's lockout). Live-confirmed on the environment: after an org-scoped lock the global locked flag stayed false for both a single-org and a multi-org fixture, the single-org explicit-org grant returned the org lock code, and the multi-org `password` grant naming the locked org returned 200 on the accessible org. Docs axis: N/A — the published guides document blocking a company member as a user action but nothing about the token endpoint's `organization_id` or lock scope; the contract shipped in the change under audit (waived).
- **Amended:** 2026-08-05 (auto-applied, triangulated — BL-AUDIT-2026-08-05). Rule unchanged and the 2026-08-04 conditional-400 correction independently re-confirmed; `Verify` gained the no-explicit-org variant and the empty-user-payload trap.
- **Amended:** 2026-08-04 (auto-applied, triangulated — BL-AUTH-2026-08-04). Rule unchanged (org lock ≠ global lock still holds); the `Verify` step's unconditional 400 was corrected — it is conditional on grant type + the absence of an accessible fallback org.
- **Source:** `vc-module-customer` `OrganizationIdRequestValidator.cs` `ValidateOrganizationAccessAsync` (the `allowFallback` branch returns `null`, i.e. no error, whenever a fallback org resolves) + `ErrorDescriber.cs` `UserIsLockedInOrganization`; live-confirmed on the environment (a multi-org user's `password` grant naming a blocked org returns 200 on the fallback org). Docs axis: N/A — no published guide describes the token endpoint's `organization_id` parameter or its error codes (waived).

---

## BL-CART-009 → KB-3880EFC1

*Picked because:* a contradiction against an entry AND against a flow (KB-35F20D97, KB-A54C919F)

```yaml
subject : BL-CART-009 Storefront cart enforces a single active coupon slot
plane   : normative
anchors : CartType.coupons, Mutations.removeCoupon, Query.validateCoupon, Mutations.addCoupon
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:35:55.479Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-CART-009: Storefront cart enforces a single active coupon slot `[P1-data]`

- **Rule:** The storefront cart "Discount & coupons" section applies at most ONE coupon at a time across BOTH facets — the preset promotion cards (up to 4, authenticated + marketing-experience module only) and the single "Custom code" input. The applied-coupon slot is shared: exactly one card/input is ever in the "applied" state (button "Remove coupon"), never two simultaneously. Two transition paths exist: (a) clicking "Apply" on a DIFFERENT preset card auto-replaces the current coupon — `applyCoupon(new)` first awaits `removeCoupon(current)`, then `validateCoupon(new)`, then `addCoupon(new)`, in that order; (b) the custom-code input becomes read-only **only when its own bound value equals the currently-applied coupon's code** — i.e. when the applied coupon was entered through that input itself, or the applied coupon is not among the up-to-4 visible preset cards (the input then mirrors the code and locks). When the applied coupon IS one of the visible preset cards, the custom input is reset to empty and stays fully editable: a user can type and submit a different code through it without first clicking "Remove coupon" on the preset card, and the single-slot guarantee still holds because that submission goes through the same `applyCoupon` replacement logic. NOTE: this single-slot guarantee is enforced by the storefront UI only — the platform cart (`CartAggregate.AddCouponAsync`) appends coupons (case-insensitive dedupe) and does not auto-replace, so a non-UI/API caller can hold multiple coupons.
- **Verify:** Apply coupon A → exactly one card/input shows "applied"/"Remove coupon"; `cart.coupons[]` contains one successfully-applied entry (code A). Apply a different preset B → network shows `removeCoupon`(A) 200 → `validateCoupon`(B) → `addCoupon`(B) 200, in order; final applied slot = B only; discount reflects only B's reward (assert against the `AddCoupon` response `discountTotal`, not a computed %, per BL-CHK-006). Via the custom input: if A was applied through a VISIBLE preset card, the custom input resets to empty and remains editable (typing accepted, Apply button enables) — by design, not a violation; if A was applied through the custom input itself, or A is not among the visible presets, the custom input mirrors A and is read-only, offering only "Remove coupon". Anonymous carts render only the custom-code input (no preset cards; `promotionCoupons` not queried).
- **Violation signal:** two cards/inputs simultaneously in the applied state via the storefront UI; a preset "Apply" that adds B without first removing A (cart briefly/permanently holds 2 coupons through the UI); the PRESET card's own input (unconditionally read-only by binding) becoming editable — a binding regression; the custom input showing a stale/mismatched code, or failing to reset to empty+editable once the applied coupon is one of the visible presets; a replacement coupon's discount stacking on top of the prior one. (Separately tracked, not this invariant: an INVALID replacement code silently dropping the prior valid coupon because remove precedes validate — see VCST-5518 / `BUG-invalid-coupon-removes-valid-coupon`; a fix is in flight on `VirtoCommerce/vc-frontend#2422`, not yet merged to `dev` — see the open build-skew item in `reports/ba/bl-proposals-2026-08-05.md`.)
- **Agents:** qa-frontend-expert (coupon section UI state), qa-backend-expert (mutation sequencing & cart coupon state)
- **Docs:** N/A — implementation-detail (coupon-slot UX mechanics; VirtoOZ guides do not narrate the apply/remove sequencing or read-only-input behavior).
- **Source:** vc-frontend `useCoupon.ts` (`applyCoupon` → on `dev` HEAD: `removeCartCoupon`→`validateCartCoupon`→`addCartCoupon` — see the open skew note in Amended), `coupons-section.vue` (`watchEffect` mirrors the applied coupon into `customCode` only when it is absent from the visible `promotionCoupons(first:4)` list, else resets `customCode` to `""`), `coupon-card.vue` (`:readonly="!custom || view === 'applied' || loading"` — preset cards unconditionally read-only; the custom card read-only only when its own bound code equals the applied one); vc-module-x-cart `CartAggregate.AddCouponAsync` (appends, case-insensitive dedupe — no auto-replace).
- **Amended:** 2026-08-05 (auto-applied, triangulated — BL-AUDIT-2026-08-05. Claim A [single active slot] CONFIRMED, docs N/A per §1a. Claim C [custom-input read-only] **DRIFT — corrected**: the blanket "read-only once a coupon is applied" was stale; the real binding is conditional, evidenced by source (`coupon-card.vue` / `coupons-section.vue`) + live (typed into the custom input while a preset-applied coupon was active — text accepted, Apply enabled; the preset card's own input separately confirmed read-only by a real-user edit attempt the driver itself rejected as non-editable). Both axes are unaffected by the in-flight PR below, which touches only `useCoupon.ts`. Claim B [replacement call order] is CONTRADICTORY/build-skew and deliberately held OUT of this edit — `dev` HEAD still orders remove→validate→add, while the build under test runs the open, unmerged `VirtoCommerce/vc-frontend#2422` prerelease, which reorders to validate→remove→add and is itself the VCST-5518 fix. Re-audit trigger: when that PR merges to `dev` — staged in `reports/ba/bl-proposals-2026-08-05.md`.)
- Previously amended: 2026-07-22 (BL-AUDIT-2026-07-22 — reconciled both coupon-UI facets under one single-slot rule; superseded the "Radio-button coupon transition" framing; corrected the batch-1 "no preceding remove" claim).

---

## BL-PRICE-009 → KB-DDCF990E

*Picked because:* anchored on a Type.field the contract projects; the page cites a private const in C#

```yaml
subject : BL-PRICE-009 `discountPercent` is a 4-decimal fraction, rounded away-from-zero, independent of the money rounding policy
plane   : normative
anchors : PriceType.discountPercent
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:35:54.328Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-PRICE-009: `discountPercent` is a 4-decimal fraction, rounded away-from-zero, independent of the money rounding policy `[P2-ux]`

- **Rule:** The `discountPercent` field (backing model `ProductPrice.DiscountPercent`, exposed via GraphQL `PriceType.discountPercent`) is computed as `discountAmount / listPrice`, rounded to exactly **4 decimal places** using **away-from-zero** midpoint rounding — hardcoded, and NOT routed through the pluggable money-rounding-policy extension point (that policy governs currency `MoneyType` amounts only, not this raw decimal fraction). When `listPrice` is zero, the value is `0`. The field is a **fraction** (e.g. `0.1250`), never a whole-number percentage, and is never `null`.
- **Verify:** Query a product's `price { discountPercent }` where a discount is active. Compute `round(discountAmount / listPrice, 4, AwayFromZero)` independently and assert equality. Confirm the value carries up to 4 decimal digits rather than being pre-multiplied by 100 or truncated to fewer decimals. A product with no discount returns `0`, not `null`.
- **Violation signal:** `discountPercent` returned as a whole number instead of a fraction; precision truncated below 4 decimals; a midpoint value rounded to-even instead of away-from-zero; `null` on a no-discount product; or the value changing after a custom money-rounding policy is registered (it must not — this field bypasses that policy entirely).
- **Agents:** qa-backend-expert
- **Docs:** N/A — implementation-detail; no VirtoOZ guide narrates this field's precision or rounding mode (§1a).
- **Source:** vc-module-x-api `src/VirtoCommerce.Xapi.Core/Models/ProductPrice.cs` — `private const int _discountPercentDecimalDigits = 4;` and `GetDiscountPercent() => ListPrice.Amount > 0 ? Math.Round(DiscountAmount.Amount / ListPrice.Amount, 4, MidpointRounding.AwayFromZero) : 0`; wired 1:1 in vc-module-x-catalog `src/VirtoCommerce.XCatalog.Core/Schemas/PriceType.cs` (`Field(d => d.DiscountPercent, nullable: false)`).
- **Amended:** 2026-08-24 (auto-applied, triangulated — BL-AUDIT-2026-08-24; MISSING → new entry. Docs N/A per §1a; Source + Live agree. Note: the shipped implementation deliberately does NOT reuse `IMoneyRoundingPolicy` — a review comment established that cash-rounding intervals would corrupt a percentage ratio.)

---

---

## BL-CART-015 → KB-1960CBCD

*Picked because:* three mutations, all resolved and respelled the way the base spells them

```yaml
subject : BL-CART-015 Configuration items survive a Saved-for-Later round trip
plane   : normative
anchors : Mutations.moveToSavedForLater, Mutations.moveFromSavedForLater, Query.configurationItems
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:35:56.281Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-CART-015: Configuration items survive a Saved-for-Later round trip `[P1-data]`

- **Rule:** Moving a configurable lineItem to Saved for Later (`moveToSavedForLater`) and back into the cart (`moveFromSavedForLater`) MUST preserve its `configurationItems` (customText, selected option/productId, files, section) unchanged. The lineItem is re-created with a new `lineItemId` on each leg, but its configuration payload is not lost, truncated, or reset to defaults.
- **Verify:** Add a configurable product with a Text-section custom value to cart; confirm via the cart's line-item configuration view. Move it to Saved for Later. Move it back to cart. Confirm the configuration view shows the identical custom value on the new lineItem.
- **Violation signal:** The custom text/option/file is blank, reset to a default, or the section is missing entirely after the item returns to cart.
- **Agents:** qa-frontend-expert (storefront round trip), qa-backend-expert (GraphQL fragment/response verification)
- **Source:** vc-frontend `client-app/core/api/graphql/cart/fragments/fullLineItem.graphql` (`configurationItems` block on `LineItemType`); `.../mutations/moveToSavedForLater/moveToSavedForLaterMutation.graphql` and `.../moveFromSavedForLater/moveFromSavedForLaterMutation.graphql` (both return `cart { ...fullCart }`).
- **Docs:** N/A — implementation detail: the user guide documents the Save-for-Later and product-configuration features but not this field-level persistence guarantee across the move mutations (§1a).
- **Amended:** 2026-07-22 (auto-applied, triangulated — BL-AUDIT-2026-07-22; MISSING → new entry, Source + Live agree, Docs N/A per §1a; scoped to single-item move, bulk not independently verified).

---

---

## BL-CAT-008 → KB-6D71C5D0

*Picked because:* the verbless-duplicate case: the page writes both `PUT /api/catalog/measures` and the bare path

```yaml
subject : BL-CAT-008 Unit-of-measure CRUD integrity
plane   : normative
anchors : POST /api/catalog/measures/search, GET /api/catalog/measures/{id}, PUT /api/catalog/measures, PATCH /api/catalog/measures/{id}
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:36:04.936Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-CAT-008: Unit-of-measure CRUD integrity `[P2-ux]`

- **Rule:** Creating, renaming, or deleting a unit-of-measure group or unit in the Catalog module persists atomically and leaves no orphaned data. Deleting a group removes its units; a deleted group/unit no longer appears in the list or in product UoM dropdowns; group integrity is preserved after a unit delete.
- **Verify:** Create UoM group → appears in list (`POST /api/catalog/measures/search`); rename → list reflects new name; delete group → group and its units absent (`DELETE /api/catalog/measures?ids=…`; verify via `GET /api/catalog/measures/{id}`). Create unit in group → appears with name/short-name/conversion-factor; edit → persists; delete unit → removed, group intact (`GET /api/catalog/measures/{id}`). Note: units are **nested inside** the Measure (group) entity and saved via the group (`POST`/`PUT /api/catalog/measures`, partial `PATCH /api/catalog/measures/{id}`) — there is no separate unit endpoint.
- **Violation signal:** Group/unit not created; edit not persisted; delete leaves orphaned units or stale API data; group integrity broken after a unit deletion.
- **Agents:** qa-backend-expert (Admin SPA + REST `/api/catalog/measures`; permissions `Measures*`)

---

## BL-GQL-004 → KB-7476468F

*Picked because:* four Query roots; lands beside three cart observations

```yaml
subject : BL-GQL-004 GraphQL resolver auth gating
plane   : normative
anchors : Query.slugInfo, Query.orders, Query.cart, Query.contact
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:36:16.834Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-GQL-004: GraphQL resolver auth gating `[P0-security]`

- **Rule:** GraphQL resolvers enforce authentication and authorization at the resolver level, not the transport level. (a) **Public ops** (`categories(storeId:X)`, `__schema`, `slugInfo`): accessible without a Bearer token. (b) **Soft-gated ops** (`me`): callable anonymously but returns `{ memberId: null, contact: null }` for anonymous callers — no error, no leak. (c) **Hard-gated ops** (`orders`, profile reads, cart mutations): return `errors[].extensions.code = "Unauthorized"` for anonymous callers, `data: null`. (d) **Cross-user reads**: an authenticated user cannot read another user's `orders` / `cart` — resolver returns `Forbidden` or empty result.
- **Verify:** Same op called (1) without token → expected gate response, (2) with `ORG_USER` token → real data with valid `memberId`. `errors[0].extensions.code` checked explicitly via `[DATA label=X] errors[0].extensions.code = Unauthorized` (graphql-runner supports `errors`/`extensions` path routing).
- **Violation signal:** Anonymous `orders()` returns real data; `me()` returns another user's `memberId` or `contact`; `extensions.code` missing or wrong on rejected op; HTTP 401/403 returned instead of structured GraphQL error.
- **Agents:** qa-backend-expert (xAPI security), qa-testing-expert (cross-user negative cases).
- **Suite coverage:** `050g` XCC-GQL-016 (direct test of all four sub-rules); ~82 references mark every operation that requires `[AUTH role=ORG_USER]` prelude (all xCart/xProfile/xMarketing mutation cases).
- **Promoted:** 2026-05-15.

---

---

## BL-SR-014 → KB-A2DAE212

*Picked because:* a module the base does NOT record as installed (vc-module-sales-rep) — imported, flagged

```yaml
subject : BL-SR-014 Embedded Sales Rep Admin app gates on customer-member + platform-security permissions, not on `sales-rep:access`
plane   : normative
anchors : POST /api/sales-rep/search, PUT /api/sales-rep
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:36:26.476Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-SR-014: Embedded Sales Rep Admin app gates on customer-member + platform-security permissions, not on `sales-rep:access` `[P1-data]`

- **Rule:** The embedded Sales Rep Admin app (`api/sales-rep`) is gated by the **customer module's member permissions + platform security permissions**, NOT by `sales-rep:access` (which only defines a storefront rep) and NOT merely by the module being installed. The exact matrix (`[Authorize]` attributes; **multiple attributes = AND — all required**):
  - **Read** (`search`, `roles`, `dictionaries`, `GET {id}`) → **`customer:read`**.
  - **Create** → **`customer:create` AND `platform:security:create`**.
  - **Update** → **`customer:update` AND `platform:security:update`**.
  - **Delete** → **`customer:delete` AND `platform:security:delete`**.
  - **Account-only ops** (`{id}/block`, `{id}/unblock`, `{id}/password`) → **`platform:security:update` only** (NOT `customer:update`) — a distinct mutate class from entity CRUD.
  - An `isAdministrator` account bypasses all checks.
- **Verify:** a back-office Manager (`isAdministrator=false`) **without `customer:read`** gets the menu entry hidden and `POST /api/sales-rep/search` → 302 → AccessDenied; a Manager with **`customer:read` only** opens the app and lists reps (search → 200) but Add/Delete/Save are hidden and `POST`/`PUT /api/sales-rep` → **403**; block/unblock/reset-password succeed only with `platform:security:update` (independent of `customer:update`).
- **Violation signal:** a Manager lacking `customer:read` reaches the rep list; a `customer:read`-only Manager creates/edits/deletes a rep (UI action present or create/update API 2xx); or block/unblock/set-password succeeds without `platform:security:update`.
- **Agents:** qa-backend-expert.
- **Source:** `vc-module-sales-rep` `SalesRepController.cs` (`dev`, `api/sales-rep`) — per-endpoint `[Authorize]` map (`CustomerModule…Permissions.Read/Create/Update/Delete` + `Platform…Permissions.SecurityCreate/Update/Delete`); `useSalesRepPermissions/index.ts` (frontend UI gate — CRUD subset, no account-ops class); `ModuleConstants.cs` (`sales-rep:access` = rep definition only). VCST-5293.
- **Note:** the read-only edit blade also needs store/org read for its dropdowns (a separate `store:*`/org-read dependency surfaced live) — a UI-completeness dependency, not part of the RBAC gate.
- **Promoted:** 2026-07-24 (TLC-2026-07-24-1906; BL-AUDIT-2026-07-24 — ex-BL-SREP-003). Evidence bar: **applicable-axes** — live (SR-ADM-023 **5-account API matrix** — no-access / read-only / account-ops / member-only / full-non-admin — every cell matched: `customer:read` read gate; account-ops = `platform:security:update` only (204); create/update/delete = customer:* AND platform:security:* (403 when either half is missing); FULL non-admin clears every gate — real `[Authorize]` chain, not admin bypass) + source (controller `[Authorize]` map) CONFIRM; **docs N/A** (module pre-GA / undocumented). Sibling BL-SR-011 (hub org-membership carve-out) promoted on source authority (live-verify pending deploy).

---

---

## BL-PRICE-003 → KB-4C5316B9

*Picked because:* no coordinate, and rightly: "money rounds half-up to two decimals" is about the platform

```yaml
subject : BL-PRICE-003 Price rounding
plane   : normative
anchors : —
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:35:53.574Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-PRICE-003: Price rounding `[P0-revenue]`

- **Rule:** All monetary amounts round half-up to 2 decimal places in the display currency. Intermediate calculations may use higher precision, but all customer-visible prices (line totals, subtotal, tax, grand total) display exactly 2 decimals.
- **Verify:** No prices display with 0, 1, or 3+ decimal places. Check edge cases: items at $X.X95 should round to $X.X0 (half-up).
- **Violation signal:** Price displays like "$12.5" or "$12.456", or rounding inconsistency between line total and cart subtotal.
- **Agents:** qa-frontend-expert (UI display), ui-ux-expert (price formatting)

---

## BL-CROSS-002 → KB-1E428341

*Picked because:* no coordinate; a timing rule about the search index

```yaml
subject : BL-CROSS-002 Catalog change → search lag → cart price mismatch window
plane   : normative
anchors : —
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:36:06.001Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-CROSS-002: Catalog change → search lag → cart price mismatch window `[P0-revenue]`

- **Rule:** After a product price or availability is changed in Admin, there is a 30-60 second window where the Elasticsearch index still reflects old data. During this window, the storefront may show stale prices. However, the cart/checkout must always use the server-side (current) price — not the cached search index price.
- **Verify:** Change price in Admin → immediately check storefront listing (may show old price) → add to cart → cart must show the NEW price. After reindex → listing matches cart.
- **Violation signal:** Cart uses stale price from search index; order placed at old price after admin price increase; price mismatch between listing and cart persists beyond reindex window.
- **Agents:** qa-frontend-expert (price display), qa-backend-expert (search index, pricing), qa-testing-expert (timing scenario)

---

## BL-NOTIF-001 → KB-C772609B

*Picked because:* no coordinate; the Source: line names a C# handler and stays in the body verbatim

```yaml
subject : BL-NOTIF-001 Order confirmation email sent exactly once
plane   : normative
anchors : —
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:36:11.383Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-NOTIF-001: Order confirmation email sent exactly once `[P1-data]`

- **Rule:** When an order is successfully placed, exactly one order confirmation email is sent to the customer's email address. Duplicate emails (due to retries, webhooks, or event duplication) are a bug. If the email service is temporarily unavailable, the email must be queued for retry — not silently dropped. Failed notifications are visible in Admin → Notification activity feed.
- **Verify:** Place order → check email inbox → exactly 1 confirmation received. Check Admin → Notification feed → sent status shown. Simulate email service failure → retry mechanism sends email after service recovery → still only 1 email total.
- **Violation signal:** 0 or 2+ confirmation emails; email silently dropped on service failure; no retry mechanism; notification feed shows no record.
- **Agents:** qa-backend-expert (notification API), qa-testing-expert (email verification)
- **Source:** vc-module-order `SendNotificationsOrderChangedEventHandler.Handle(OrderChangedEvent)` — `SendOrderNotifications`-gated, `IsNewlyAdded` → one `OrderCreateEmailNotification` via `BackgroundJob.Enqueue` → `ScheduleSendNotificationAsync`; failures surface in the Admin Notification activity feed (attempt count / status).
- **Amended:** 2026-07-22 (triangulated — BL-AUDIT-2026-07-22; CONFIRMED 3/3, Source anchor recorded, Rule unchanged)

---

## BL-A11Y-001 → KB-504415B1

*Picked because:* no coordinate; an accessibility rule, the furthest thing from a route

```yaml
subject : BL-A11Y-001 Keyboard operability and focus management
plane   : normative
anchors : —
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:36:31.308Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-A11Y-001: Keyboard operability and focus management `[P1-data]`

- **Rule:** On the accessibility-gated storefront themes, every interactive element MUST be reachable and operable via keyboard alone, in a logical DOM/tab order, with a visible focus indicator on the currently focused element (WCAG 2.1.1, 2.4.3, 2.4.7). A modal/dialog overlay MUST contain keyboard focus within itself while open — Tab from its last focusable element cycles to its first, Shift+Tab from the first cycles to the last — and closing it (via Escape or an explicit close control) MUST release the trap and return focus to the triggering control.
- **Verify:** From a neutral starting point, Tab through the surface and confirm every interactive element receives focus in DOM order with a visible focus ring. Open a modal, Tab to its last focusable element and confirm wrap to the first (Shift+Tab from the first wraps to the last). Close it and confirm focus returns to the trigger and Tab no longer reaches the closed modal's contents.
- **Violation signal:** An element skipped by Tab; `outline:none` with no visible replacement; Tab exits an open modal to page content behind it; focus remains trapped, or does not return to the trigger, after close.
- **Agents:** ui-ux-expert (component/Storybook keyboard audits), qa-frontend-expert (storefront revenue flows — checkout, BOPIS, payment)
- **Docs:** N/A — project-specific: a QA-authored accessibility-methodology invariant grounded in the external WCAG 2.1/2.2 success criteria rather than in Virto documentation, which states no storefront conformance target (bl-audit-criteria §1a class 2; same basis as BL-UI-006/BL-UI-007).
- **Source:** `client-app/ui-kit/composables/useFocusManagement.ts` — the focusable-elements selector and the Tab-cycle keydown handler that wraps focus at the first/last element when `trapFocus` is enabled; wired into `client-app/ui-kit/components/molecules/dialog/vc-dialog.vue`.
- **Severity rationale:** P1 (not P2) on the same basis as BL-UI-006/007 — a keyboard trap (WCAG 2.1.2, Level A) or an unreachable/invisible-focus control blocks a whole class of keyboard-only users outright rather than degrading appearance.
- **Suite coverage:** `045-accessibility-tests.csv` A11Y-KB-001…005.
- **Promoted:** 2026-08-06 (auto-applied, triangulated — BL-AUDIT-2026-08-06; source + live CONFIRM, docs N/A).

---

## BL-SR-005 → KB-0A1EE3DC

*Picked because:* no coordinate; a long body with an explicit contrast against another rule

```yaml
subject : BL-SR-005 Statistics scope excludes flag-cancelled / prototype orders unconditionally
plane   : normative
anchors : —
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:36:24.293Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-SR-005: Statistics scope excludes flag-cancelled / prototype orders unconditionally `[P1-data]`

- **Rule:** The statistics scope (`salesRepCustomerOrderStatistics` / `salesRepCustomerCartStatistics`) excludes orders and carts flagged prototype or cancelled **at the entity level** (`IsPrototype` / `IsCancelled`) — unconditionally, and this does NOT loosen under any named filter. This differs from the order-*list* scope, which deliberately includes cancelled orders so that `Cancelled` is a real list filter (BL-SR-009). An order whose `Status` field merely reads a cancelled-like value **without** the `IsCancelled` flag (e.g. written directly by an external/ERP integration bypassing the platform cancel workflow) is NOT excluded by this scope and correctly counts toward every statistics figure, including the baseline/all-status one.
- **Verify:** A customer with a genuinely cancelled order (`IsCancelled=true`) → every statistics figure excludes it under any filter, including `filter:"Cancelled"`. A customer with a `Status`-only cancelled-looking order (`IsCancelled=false`) → the baseline/all-status figure INCLUDES it.
- **Violation signal:** Flag-cancelled/prototype orders inflate the baseline totals/counts; OR a flag-less, status-only cancelled-looking order is wrongly excluded from the baseline (scope matching on the `Status` string instead of the `IsCancelled`/`IsPrototype` flags).
- **Agents:** qa-backend-expert
- **Docs:** N/A — pre-GA module, no VirtoOZ coverage (§1a).
- **Source:** vc-module-sales-rep `RepOrderScopeQueryExtensions.ApplyRepScope` (default `includeCancelled=false` → filters `!IsPrototype && !IsCancelled`); `CustomerOrderStatisticsService.BuildQuery` calls it with no `includeCancelled` argument, so the exclusion is unconditional regardless of any status filter. Contrast `SalesRepOrderStatusService.BuildQuery`, which passes `includeCancelled: true` for the list scope (BL-SR-009).
- **Amended:** 2026-08-24 (auto-applied, triangulated — BL-AUDIT-2026-08-24; DRIFT — resolves the conflict between the prior text and the shipped statistics scope. Docs N/A per §1a; Source + Live agree. Live axis caveat: the field shape was observed this run, but the flag-vs-status distinction is corroborated from a captured payload rather than independently reproduced — the environment's fixtures cannot write a `Status`-only cancelled order.)
- **Promoted:** 2026-07-23 (TLC-2026-07-23-1943); restored 2026-07-28.

---

## BL-PROFILE-001 → KB-A94ADBF9

*Picked because:* the one entry that splits itself into read-path and write-path Rule/Verify bullets

```yaml
subject : BL-PROFILE-001 Silent duplicate-skip on `updateMemberAddresses` and matching `checkDuplicateAddress` detection
plane   : normative
anchors : Mutations.updateMemberAddresses
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:36:14.533Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-PROFILE-001: Silent duplicate-skip on `updateMemberAddresses` and matching `checkDuplicateAddress` detection `[P1-data]`

- **Rule (write path — `updateMemberAddresses`):** When `updateMemberAddresses` is called with an address whose key fields — `firstName` + `lastName` + `city` + `line1` + `line2` + `countryCode` + `regionId` + `postalCode` + `phone` + `email` (compared case-insensitively; `addressType` and the auto-computed `name` are **NOT** part of the dedup key) — exactly match an already-saved address on the same member, the server MUST silently skip the insert. No new record is created, no error is raised in `errors[]`, and the member's total address count (`currentCustomerAddresses.totalCount`) MUST remain unchanged. This holds regardless of the size of `addresses[]` (one or many) AND regardless of `memberType` (Contact or Organization — same endpoint, same dedup semantics). The dedup check is **against the member's stored collection**, not only within the incoming batch, and must NOT depend on auto-computed fields like `name` that the client submits as null.
- **Rule (read path — `checkDuplicateAddress`):** `checkDuplicateAddress(memberId, address)` MUST return `isDuplicated: true` if and only if an existing stored address on `memberId` matches the submitted address by the same key fields listed above. Novel addresses return `isDuplicated: false`; exact matches return `true`. The detection contract MUST agree with the write-path dedup contract — whatever `updateMemberAddresses` silently skips, `checkDuplicateAddress` must flag. The query MUST require authentication (no anonymous access) and MUST enforce same-member / same-org authorization (no cross-member probing).
- **Verify (write path):** Capture totalCount = N and the full field set of an existing address. Call `updateMemberAddresses(command: { memberId, addresses: [{…same fields}] })` with exactly one byte-identical element. Re-query totalCount → must equal N. Count rows in `items[]` matching the duplicate's line1 + firstName + lastName → must equal 1 (not 2). `errors[]` must be empty. Repeat with a 2-element `addresses[]` where one element is identical-to-existing and one is novel → novel row is added, duplicate is skipped, totalCount = N+1. Repeat both scenarios for a Contact memberId AND an Organization memberId.
- **Verify (read path):** With a valid bearer token, call `checkDuplicateAddress(memberId: <own>, address: {…byte-identical fields of an existing saved address})` → `isDuplicated: true`. Call with a novel address → `isDuplicated: false`. Call anonymously (no Authorization header) → request rejected with 401 or equivalent authz error; not HTTP 200. Call with a foreign memberId (different user) → authz error, no data returned.
- **Violation signal:** `totalCount` = N+1 after single-element submission; two rows with identical key fields appear in `items[]`; the mutation raises an error instead of silently skipping. For the read path: `checkDuplicateAddress` returns `isDuplicated: false` for an address that clearly exists on the member; or returns data to an unauthenticated caller (HTTP 200 without 401); or returns data when a foreign memberId is used.
- **Agents:** qa-backend-expert (GraphQL direct — see GQL-056, and planned GQL-060/061 for checkDuplicate detection), qa-frontend-expert (storefront UI — see B2C-SHIP-014), test-management-specialist (cross-layer coverage audit)
- **Origin:** PR [VirtoCommerce/vc-module-profile-experience-api#129](https://github.com/VirtoCommerce/vc-module-profile-experience-api/pull/129) — adds both `MemberAggregateRootBase.UpdateAddresses` dedup AND the `checkDuplicateAddress` query, implemented once in the shared base aggregate (no per-member-type override), so the Contact and Organization paths use identical logic and the write-path silent-skip and read-path detection share one method (`IsDuplicateAddress`). The previously-reported Organization-path write-dedup miss and `checkDuplicateAddress`-always-false defects are **no longer reproducible in current source** (both resolved via the unified base aggregate); live-reconfirmed on the Contact path.
- **Promoted:** 2026-04-23 (from `PROPOSED-BL-PROFILE-001` in `reports/test-lifecycle/TLC-2026-04-23-1700/bl-proposals.md`).
- **Source:** `vc-module-profile-experience-api` `MemberAggregateRootBase.cs` (address comparer + `IsDuplicateAddress`), `CheckDuplicateAddressQueryHandler.cs` (delegates to the same method), `OrganizationAggregate.cs` / `ContactAggregate.cs` (no override — inherit the shared logic).
- **Amended:** 2026-07-22 (approved from bl-proposals-2026-07-22 — BL-AUDIT-2026-07-22: refreshed the stale Origin footnote — the Organization-path + `checkDuplicateAddress` defects are fixed in current source, triangulated source + live Contact path; Rule/Verify unchanged).

---

---

## BL-CART-001 → KB-8B9AE2D8

*Picked because:* the longest body in the file — check nothing was truncated

```yaml
subject : BL-CART-001 Max quantity enforcement
plane   : normative
anchors : —
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:35:54.450Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-CART-001: Max quantity enforcement `[P0-revenue]`

- **Rule:** Per-product max quantity is enforced by available stock (or configured min/max). There is no automatic silent cap to available stock on either surface — but the two entry surfaces differ in where the enforcement lands, because the platform backend never refuses to persist an out-of-range quantity; it always accepts the requested value and attaches an advisory per-line validation error. **On the Product Detail Page quantity control** (a product not yet in the cart, or its own stepper), the storefront enforces the limit client-side before any mutation commits: entering a quantity outside the allowed range disables the Increase control, replaces it with an inline range affordance (e.g. "Order from X to Y item(s)"), and no line is added — the cart item count is unchanged. **On an existing cart-line quantity input** (the cart page), the storefront submits whatever quantity is entered via the quantity-change mutation, and the backend persists it as entered — the line's quantity, line total, and cart subtotal/tax/total all reflect the out-of-range value — while attaching a per-line validation message (e.g. "You can order maximum N item(s)") that the storefront renders inline and that keeps "Place order" disabled until the quantity is corrected. This out-of-range state survives a full page reload (it is server-persisted, not merely an optimistic client artifact).
- **Verify:** PDP: for a product not yet in cart, enter a quantity above available stock → assert the inline range message, Increase disabled, and cart item count unchanged (no line committed). Cart page: for an existing line, enter a quantity above available stock into the line's quantity input and submit → assert the persisted quantity equals the entered value (not capped), line total = qty × unit price, cart subtotal reflects it, an inline validation message renders, and "Place order" stays disabled; reload the page → assert the same out-of-range quantity, total, and message persist.
- **Violation signal:** On either surface, the quantity is silently capped to available stock with no error/message; OR the out-of-range quantity is accepted with no validation signal and "Place order" becomes enabled; OR the PDP path lets an over-limit line commit; OR an order is placed for more units than in inventory.
- **Agents:** qa-frontend-expert (PDP stepper + cart-line UI), qa-backend-expert (`addItem`/`changeCartItemQuantity` mutation response, per-line validation)
- **Docs:** N/A — implementation-detail (quantity-reject-vs-auto-cap UX mechanics; VirtoOZ guides do not narrate this, per §1a).
- **Source:** vc-module-x-cart `CartLineItemValidator.ValidateMinMaxQuantity` → `CartErrorDescriber.ProductMinMaxQuantityError`/`ProductMaxQuantityError`/`ProductQtyChangedError` (FluentValidation `AddFailure` — attaches a per-line validation error but does not block the mutation). `AddCartItemCommandHandler.Handle` and `ChangeCartItemQuantityCommandHandler.Handle` (`src/VirtoCommerce.XCart.Data/Commands/`) both call `cartAggregate.AddItemAsync`/`ChangeItemQuantityAsync` with the requested quantity and save **unconditionally**, with no branch on the validator's outcome — the backend never refuses to persist an out-of-range quantity on either mutation. vc-frontend `locales/en.json` `validation_error.PRODUCT_MAX_QTY`/`PRODUCT_MIN_MAX_QTY`/`PRODUCT_QTY_CHANGED` (rendered inline via the error translator).
- **Amended:** 2026-07-27 (auto-applied, triangulated — BL-AUDIT-2026-07-27; DRIFT — corrected: the backend does not reject/refuse persistence on either surface; distinguished the PDP client-side pre-commit block from the cart-line accept-persist-flag-and-block-completion behavior, independently reconfirmed live including across a page reload; source + live agree, both fresh this run; docs N/A per §1a). Supersedes the 2026-07-22 amendment, which attributed a backend "reject" behavior to `CartLineItemValidator`/`CartErrorDescriber.ProductQtyChangedError` — that source anchor is real but only emits an advisory validation error; it does not block a mutation from persisting.

---

## BL-LOY-010 → KB-ADCFB593

*Picked because:* vc-module-loyalty, not installed here; anchored on CartType.validationErrors

```yaml
subject : BL-LOY-010 Mixed Cart — a points-only cart is rejected; at least one cash line is required
plane   : normative
anchors : CartType.validationErrors
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:36:19.032Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-LOY-010: Mixed Cart — a points-only cart is rejected; at least one cash line is required `[P1-data]`

- **Rule:** A cart whose lines are **entirely** loyalty-currency (points-priced), with no cash-currency line, MUST surface a `LOYALTY_ONLY_POINT_PRODUCTS_NOT_ALLOWED` validation error and MUST NOT be checked out. Adding at least one cash-currency line MUST clear that specific error (the cart becomes valid if no other rule fires). Implements the VCST-5103 AC "at least one common (cash) product must be in the cart, otherwise error."
- **Verify:** Auth as a loyalty user in a Mixed-Cart store; build a cart with only a PTS line → `cart.validationErrors` contains `LOYALTY_ONLY_POINT_PRODUCTS_NOT_ALLOWED`; add a cash line and re-read → that error code is gone.
- **Violation signal:** A points-only cart validates clean / is allowed to check out; or the error fails to clear after a cash line is added.
- **Agents:** qa-backend-expert
- **Source:** vc-module-loyalty #10 `LoyaltyCartValidator.cs` rule 2; VCST-5103 AC. Covered by suite 075b MCO-GQL-006. Live-verified PASS 5/5 on the environment 2026-06-24.
- **Promoted:** 2026-06-24. *(NOTE: PROPOSED-BL-LOY-011 — points-priced products only allowed in Mixed Cart mode, rule 1 — is reserved/pending live verification via the MCO-GQL-007 store-mode flip; see TLC-2026-06-24-1121 bl-proposals.md.)*

---

## BL-CR-001 → KB-BF9D0424

*Picked because:* customer reviews; eight rules cite a module installed at 3.1000.0

```yaml
subject : BL-CR-001 New review defaults to unmoderated "New" status, never auto-approved
plane   : normative
anchors : —
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:36:32.349Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-CR-001: New review defaults to unmoderated "New" status, never auto-approved `[P1-data]`

- **Rule:** A review created by an eligible purchaser via the create-review mutation is persisted with review status "New" (never "Approved") and is returned with a non-empty id and no validation errors. The review is NOT immediately visible to other storefront visitors — it becomes visible only after an admin moderation action changes its status.
- **Verify:** As an eligible buyer, submit a review for a purchased product → mutation returns a non-empty id with no validation errors → in Admin, the new review appears in the review list with Status = New → the review is absent from the public storefront review list until approved.
- **Violation signal:** A submitted review appears already Approved in Admin without any moderation action; the review is immediately visible on the storefront before approval; the create call returns a null id with no validation errors on a genuinely eligible purchase.
- **Agents:** qa-backend-expert (GraphQL mutation, Admin list), qa-frontend-expert (storefront visibility), qa-testing-expert (end-to-end submit→moderate→publish)
- **Docs:** PlatformUserGuide "Manage Reviews > Moderate reviews" ("Approve review to publish the review and include it in the rating calculation") + "Overview > Key features" ("Moderation and validation of reviews").
- **Source:** vc-module-customer-review `CustomerReviewStatus.cs` (`New = 0` — the C# default enum value) + `CreateReviewCommandHandler.cs` (persists the mapped review without setting a status, so it lands on the default) + `ReviewValidator.cs` (purchase-eligibility gate runs before persistence).
- **Amended:** 2026-08-24 (auto-applied, triangulated — BL-AUDIT-2026-08-24; MISSING → new entry at a cited id. Docs + Source + Live agree.)

---

## BL-STORE-001 → KB-7535C57F

*Picked because:* the last domain, one rule, and the least-exercised path through the parser

```yaml
subject : BL-STORE-001 Store configuration is independent per store, keyed by store id
plane   : normative
anchors : —
scope   : —
evidence: {"method":"observation","at":"2026-09-17T05:36:35.713Z","by":"session:df82f5d6","from":"sources/business-logic-2026-09-17.md","attested":false,"whyNot":"transcribed from sources/business-logic-2026-09-17.md; nobody has yet watched this rule hold on a deployment"}
```

BL-STORE-001: Store configuration is independent per store, keyed by store id `[P1-data]`

- **Rule:** The platform supports any number of stores, and each store's configuration — languages, currencies, default language and currency, catalog assignment, storefront URLs, SEO link type, tax/rounding/anonymous-access/email-verification policy, feature toggles, aggregation properties and module settings — is stored against that store's own id and resolved independently of every other store. Changing a setting on one store does not alter another store's configuration or storefront behaviour, even when both stores share the same platform instance, module set, or catalog.
- **Verify:** Open two different stores in the Admin store list → confirm each shows its own independent value for a shared-shape field (default language, SEO link type, or a feature toggle). Change a setting on the first store and save → reopen the second → its value for the same setting is unchanged. Query the storefront xAPI store query for two different store ids → each returns its own settings block.
- **Violation signal:** A setting change on one store is visible on another store's storefront or Admin blade; the store query returns identical settings for two differently-configured store ids; a newly created store inherits a setting value from another store rather than a documented default.
- **Agents:** qa-backend-expert (Admin SPA Stores module, xAPI store query), qa-frontend-expert (multi-store storefront behaviour)
- **Docs:** PlatformUserGuide "Getting Started" — the platform "is multi-language, multi-currency, multi-theme, and multi-store… allows users to operate multiple stores seamlessly"; "General Guidelines" — store-specific (tenant) settings "must be configured within the settings of the corresponding store".
- **Source:** vc-module-store `src/VirtoCommerce.StoreModule.Core/Model/Store.cs` — every store-level field (`Languages`, `Currencies`, `DefaultLanguage`, `DefaultCurrency`, `Catalog`, `Url`, `SecureUrl`, `Settings` via `IHasSettings`, `DynamicProperties`) is a property on the per-instance `Store` entity, not a shared or global record.
- **Amended:** 2026-08-24 (auto-applied, triangulated — BL-AUDIT-2026-08-24; MISSING → new entry. Docs + Source + Live agree — multiple independently-configured stores coexist on one platform instance, each exposing its own settings.)

---

---
