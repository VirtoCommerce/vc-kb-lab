# Overlap evidence: vc-knowledge captured entries vs vc-fix shipped knowledge

Read-only review, 2026-09-16. Sources read:

- (1) `C:/_VIRTO/vc-knowledge/captured/*.md` — 100 files, 88 `status: active`, 12 `status: retired` (skipped); `C:/_VIRTO/vc-knowledge/flows/*.md` — 3 procedures. Every active entry and flow was read in full (frontmatter + body + dispute/amendment notes).
- (2) `C:/_VIRTO/vc-mcp-testing-module/plugins/vc-fix/knowledge/**/*.md` — 34 files, ~1.2 MB. For every captured entry the distinctive coordinates (routes, GraphQL type/field names, setting names, UI labels) were grepped across (2) and the surrounding section was read, not just the grep line. Sections read in full: `oracles/business-logic.md` domains BL-PRICE, BL-CART, BL-ORD, BL-AUTH, BL-B2B, BL-GQL and the individual invariants named below; `oracles/vc-bug-catalog.md` in full (headings + the CART, CAT, PROMO, CFG, B2B, LIST, AUTH, CHECKOUT, ORDERS, API sections); `oracles/e-commerce-edge-cases-library.md` §1.3, §2.3, §4.3, §6.2, §10.3, §13.1, §14.1–14.5, §14.10; `api/api-auth.md`, `api/graphiql-interaction.md`, `api/graphql-schema.md` (type tables), `api/order-creation-matrix.md`; `domain/products.md` §2, §6; `domain/store-settings.md` feature-flag table; `architecture/vc-module-architecture.md` §2; `automation/storefront-selectors.md` §4; `automation/storefront-config-flags.md` checkout flags.

Verdict rules applied: DUPLICATE only when (2) states the entry's central claim (same mechanism/behaviour). RELATED when (2) covers the same coordinate/feature but states a more general rule, a different fact, or the universal rule where the entry records a deployment observation — and always when (2) *contradicts* the entry (a contradiction is coverage of the coordinate, not of the fact). ABSENT when nothing in (2) touches the fact; a bare field name inside a `graphql-schema.md` field list is treated as ABSENT unless the field list itself carries the entry's point.

Fact-class rules: UNIVERSAL = platform behaviour that would hold on any deployment of this version; DEPLOYMENT = this stand's config/data/module mix (including behaviour that vc-fix documents as a *different* model, i.e. module-version-dependent); CONTRACT = a field/route presence-or-absence fact derivable from swagger or GraphQL introspection; SOURCE = derivable by reading one named source file (and the entry itself is grounded that way); PROCEDURE = how-to; TOOLING = about the agent's own tooling.

---

## A. Entry-by-entry overlap (88 active captured entries + 3 flows)

| id | subject | fact class | verdict | where in vc-fix (file + id/heading) | note |
|---|---|---|---|---|---|
| KB-02238DE5 | storefront org-role gating granularity | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-B2B-005 | BL-B2B-005 asserts nav-level gating ("Buyers see Orders, Lists but NOT Members"); the entry observed the opposite — an employee still loads `/company/members` read-only and only the controls are removed. Same feature, contradicting rule. |
| KB-032FBB96 | SharingSettingType access is computed per caller | UNIVERSAL | ABSENT | — (`api/graphql-schema.md` lists only `sharedWishlist(sharingKey)`; `SharingSettingType` appears nowhere) | |
| KB-055845A3 | cart line can serve a stale unit price | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-CROSS-002; `oracles/e-commerce-edge-cases-library.md` §14.4 "Stale price in mini-cart" | BL-CROSS-002 states the rule the entry saw violated (cart must always use the current server-side price). ECL row names the symptom generically. |
| KB-06409954 | three independent fields represent a blocked member | DEPLOYMENT | RELATED | `oracles/business-logic.md` BL-B2B-013 (status axis vs lock axis), BL-AUTH-012 | vc-fix documents the VCST-5028 per-org membership model where an org block MUST NOT set the global `LockoutEnd`; the entry observed `lockOrganizationContact` setting the account lockout. Module-version-dependent, hence DEPLOYMENT. |
| KB-068517DF | opening an Admin order blade by URL | UNIVERSAL | ABSENT | — (`automation/browser-quirks.md` has nothing on Admin deep links or the localization race) | |
| KB-0B6067F8 | UserType.lockedState is the storefront-reachable sign-in state | CONTRACT | ABSENT | — (`api/graphql-schema.md` ContactType lists `securityAccounts` but `UserType` and `lockedState` are not documented) | |
| KB-0C102D97 | cancelling an order cascades to the payment, never to the shipment | SOURCE | RELATED | `oracles/business-logic.md` BL-ORD-007 ("Any state → Cancelled" for shipment), BL-ORD-002; `oracles/e-commerce-edge-cases-library.md` §13.1 "Order cancellation after partial ship" | vc-fix has the state machines and a generic "inconsistent state after cancel" row; the cascade asymmetry and `CancelPaymentOrderChangedEventHandler` are not stated. |
| KB-0C163966 | storefront product page of a configurable product | UNIVERSAL | RELATED | `oracles/vc-bug-catalog.md` VC-CART-006 (stepper is add-to-cart); `oracles/business-logic.md` BL-CAT-006; `oracles/e-commerce-edge-cases-library.md` §14.5 row 1; `domain/products.md` §6 ("isRequired false → None option") | The None-option clause is duplicated by products.md §6; the stepper clause by VC-CART-006. ECL §14.5 says the control is disabled until sections are configured — the entry observed an all-optional configurable added with an empty `configurationItems`. |
| KB-0DD47BD1 | the amount a payment is for is not the payment's total | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-CHK-006 (order total formula with "payment subtotal") | Formula names the payment-fee term; nothing says `PaymentIn.sum` is the amount due or that `paymentTotal` is a fee roll-up. |
| KB-132A40B3 | null lastLoginDate cannot tell never-tried from tried-and-failed | UNIVERSAL | ABSENT | — | |
| KB-13B32D5F | what makes a promotion reach a given store | UNIVERSAL | RELATED | `oracles/vc-bug-catalog.md` VC-PROMO-002 (policy is store-wide, not per-promotion); `oracles/business-logic.md` BL-CART-003 known-behaviour note | Empty `storeIds` = every store is absent. VC-PROMO-002 calls CombinePolicy "store-wide"; the entry read it as platform-wide (`objectId null`, absent from store settings) on this stand. |
| KB-16AEF0C2 | order operation numbering and parentage | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-ORD-005 | BL-ORD-005 gives `CO{date:yyMMdd}-{counter:D5}` with daily reset. SH/PI prefixes, per-prefix counters, `parentOperationId` null and `childrenOperations` as the real link are absent. |
| KB-1834ABE5 | no Admin surface shows the price a given shopper is charged | UNIVERSAL | ABSENT | — (`pricesWidget` appears nowhere) | |
| KB-18991381 | where an order's coupon codes are readable | CONTRACT | RELATED | `api/graphql-schema.md` §CustomerOrderType field list (`coupons`, `discounts`) | The GraphQL half of the contract is listed; the REST `CustomerOrder` lacking `coupons` and `discounts[].coupon` as the only trace are absent. |
| KB-18ABE89B | admin order address blade false dirty state | UNIVERSAL | ABSENT | — (`countryName` appears only as an input field in `api/order-creation-matrix.md`) | |
| KB-191B1B4C | the master product is a row in its own variations list | UNIVERSAL | RELATED | `oracles/e-commerce-edge-cases-library.md` §14.1 row 4 (addItem with a master id is accepted silently, line bears the master SKU); `oracles/vc-bug-catalog.md` VC-CART-006 | Same outcome (master SKU on the line) reached via the API; the storefront panel listing the master as a row and the Show-in-stock filter are absent. |
| KB-1B18B821 | tax is provider-driven and silently zero without an active provider | SOURCE | RELATED | `oracles/business-logic.md` BL-PRICE-002; `domain/store-settings.md` feature-flag table `taxCalculationEnabled` (OFF → no tax applied) | vc-fix assumes a provider exists and documents the setting half of the gate; the `IsActive`-provider half and the silent-zero consequence are absent. |
| KB-27B4CD10 | storefront members Active column reads contact status | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-B2B-013 ("a UI may render both on one column, but the two must be assertable independently") | vc-fix states the two-axis rule; the missing-projection cause (`securityAccounts{id,email,roles}` without a lock field) is absent. |
| KB-3113CBC1 | where a product's configurability is actually stored | CONTRACT | RELATED | `api/graphql-schema.md` §Product (`isConfigurable`); `domain/products.md` §2 (`productType`: Physical, Digital, Configurable, BillOfMaterials); `oracles/vc-bug-catalog.md` VC-CFG-004 | products.md contradicts the entry: it lists `Configurable` as a `productType` value, the entry found only Physical/Digital/null and configurability as a separate entity. |
| KB-358A70CB | storefront order page projection of the shipment | UNIVERSAL | ABSENT | — (`automation/storefront-selectors.md` has no order-detail section; VC-ORDERS-001 covers status labels only) | |
| KB-35A09C64 | promotion re-evaluation on cart read | UNIVERSAL | ABSENT | — (BL-CART-008 source says recalculation runs on every *save*; the read-path re-evaluation is not stated anywhere) | |
| KB-35F20D97 | what a coupon code that does not work does to a cart | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-CART-009 (`CartAggregate.AddCouponAsync` appends, case-insensitive dedupe, no auto-replace); `oracles/e-commerce-edge-cases-library.md` §1.3 row 5, §14.1 row 1 | ECL §1.3 row 5 (amended 2026-08-27) says coupon matching is case-INSENSITIVE server-side; the entry observed case-sensitive, untrimmed matching. Direct contradiction on the same coordinate. |
| KB-360127D0 | a configuration loses its product and quantity on the way to the order | CONTRACT | ABSENT | — (`OrderConfigurationItemType` / `CartConfigurationItemType` not in `api/graphql-schema.md`) | Entry is active but carries a `contradicts: true` note; KB-59E4B5FC is its correction. |
| KB-3F7C78F6 | wishlists have no REST and no Admin surface | CONTRACT | RELATED | `api/graphql-schema.md` §Wishlists (queries `wishlist`, `sharedWishlist`, `wishlists`); `oracles/vc-bug-catalog.md` VC-LIST-001 | The GraphQL readers are listed; the empty XCart OpenAPI `paths` and the absence of an Admin blade are not stated. |
| KB-4982C91F | order discount amount rounding split | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-PRICE-003 (intermediate higher precision allowed, display 2 decimals) | BL-PRICE-003 permits the split; it does not say both precisions are served on one Admin blade. |
| KB-4A8606CA | an abandoned invitation can leave an account nothing can delete | DEPLOYMENT | ABSENT | — | One record on this stand; cause not isolated by the entry itself. |
| KB-4B889114 | company members Active column vs account locked state | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-B2B-013 | Internal near-duplicate of KB-27B4CD10 and KB-82111688. |
| KB-4C5627CE | shipment lifecycle states and what moves them | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-ORD-007, BL-ORD-003 | The five values and "Send not Sent" are duplicated by BL-ORD-007. BL-ORD-007 asserts `New → Send` is illegal and a tracking number is required; the entry observed a gate-free select on this stand. Chosen RELATED because the "what moves them" half contradicts. |
| KB-4CCC2DD6 | what Cancel document actually cancels | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-ORD-002 (inventory restore conditional on a store flag), BL-ORD-007; `oracles/e-commerce-edge-cases-library.md` §13.1 | Entry observed stock released and the shipment/line items not cancelled; vc-fix has the flag rule and a generic row. |
| KB-4D082C89 | a pending invitation is a locked account with no status | DEPLOYMENT | RELATED | `oracles/business-logic.md` BL-B2B-009, BL-B2B-012 (`Invited` status on the membership row) | vc-fix places `Invited` on `OrganizationMembership.Status`; the entry observed it on `contact.status` with a locked account. Entry carries three `contradicts` notes of its own. |
| KB-4D26A022 | order shipment item allocation | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-ORD-003 (each shipment tracks its own items; verify creates shipments with items) | That a checkout-created shipment is born with `items: []` is not stated. |
| KB-4E45A8BA | admin contact Status picker cannot represent Invited or Locked | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-B2B-013 (dictionary `Invited/Approved/Rejected/Deleted` on membership) | Different picker (contact blade: New/Approved/Rejected/Deleted) and different field; vc-fix gives the membership-status dictionary. |
| KB-53D776C2 | the Admin order tree blanks a zero shipment amount | UNIVERSAL | ABSENT | — | |
| KB-5790A068 | marketing promotions are not change-tracked on this deployment | DEPLOYMENT | ABSENT | — (BL-ORD-008 audit trail is orders only) | |
| KB-59E4B5FC | a configured product as an order line item | CONTRACT | ABSENT | — (order configuration item shapes absent from vc-fix) | Flow KB-AFB2D3C5's Step 6 amendment covers the Admin side internally. |
| KB-5ADBFB34 | only the largest cart-subtotal promotion applies, whatever isExclusive says | SOURCE | DUPLICATE | `oracles/business-logic.md` BL-CART-003 "Known behavior (2026-03-13)" (`BestRewardPromotionPolicy.cs:79-80`, one `CartSubtotalReward`, coupon-backed preferred, CombineStackable keeps one per priority group); `oracles/vc-bug-catalog.md` VC-PROMO-001, VC-PROMO-002 | Same mechanism and same source file. Entry adds ordering by `GetTotalAmount` (money, not raw Amount) and that `isExclusive`/priority play no part; BL-CART-003 adds that a smaller coupon reward still wins. |
| KB-5F7C8FC4 | an empty Tax providers widget is not evidence of no provider | DEPLOYMENT | RELATED | `oracles/e-commerce-edge-cases-library.md` §10.3 row 1 (Admin blade renders blank instead of a clear error) | Generic Admin-degradation pattern only; `POST /api/taxes/search`, the `ngRepeat:dupes` cause and the per-store control are absent. Weak relation. |
| KB-6824BC2B | platform GraphiQL runs as anonymous and takes a query in the URL | TOOLING | DUPLICATE | `api/graphiql-interaction.md` ("GraphiQL Editor Interaction — `${BACK_URL}/ui/graphiql`"; "queries execute as Anonymous" unless the Authorization header is inserted); `oracles/vc-bug-catalog.md` VC-API-003 | Central claim (path + anonymous principal) is stated. `api/api-auth.md` line 87 CONTRADICTS both ("no token needed — uses session cookies from Admin SPA login"). The `?query=` URL parameter and the 404 of `/graphiql` and `/ui/playground` are absent. |
| KB-6AA0D7FB | fixed rate shipping method option pricing | DEPLOYMENT | RELATED | `oracles/business-logic.md` BL-SHIP-001 source (`FixedRateShippingMethod.CalculateRates` — flat Ground/Air rates from settings); `api/order-creation-matrix.md` (`FixedRate/Ground`, `FixedRate/Air` = ${price}) | Mechanism stated; that an unset `…Ground.Rate` is `null`/0 and the option is still offered is the stand-specific part, absent. |
| KB-6CC1EFE6 | deleting a security account leaves the contact behind | UNIVERSAL | ABSENT | — | |
| KB-6D5E2CD1 | what makes a price list apply to a store | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-PRICE-005, BL-PRICE-006, BL-PRICE-007, BL-B2B-002 (org list → store default → Unavailable); `oracles/e-commerce-edge-cases-library.md` §14.4 | vc-fix states the outcome chain; `PricelistAssignment` scope (catalog XOR store), date window, `UserGroupsContainsCondition` and assignment priority are absent (`PricelistAssignment` appears nowhere). |
| KB-6E98AA17 | admin order operations tree staleness after cancel | UNIVERSAL | RELATED | `oracles/e-commerce-edge-cases-library.md` §10.3 row 3 ("Grid shows stale/cached content", [THEORETICAL]) | Generic and marked theoretical in vc-fix; the entry is the concrete instance. Weak relation. |
| KB-7040852E | member keyword search is index-backed | UNIVERSAL | ABSENT | — (BL-CAT-003 / ECL §14.2 cover the catalog index only) | |
| KB-7A12CF52 | what a wishlist sharing key grants a signed-out holder | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-GQL-004 (hard-gated ops return `extensions.code = Unauthorized`, `data: null`); `api/graphql-schema.md` `sharedWishlist(sharingKey)` | BL-GQL-004 gives the generic gate; the three scope-dependent answers (full data / Unauthorized / 200-null) are absent. |
| KB-7A9D4927 | revoking a wishlist share link: re-scoping suspends, deleting revokes | UNIVERSAL | RELATED | `oracles/vc-bug-catalog.md` VC-LIST-001 ("Share URL lives inside the Settings dialog") | Same feature; key persistence across re-scoping is absent. |
| KB-7AB0B13E | removing a product configuration | CONTRACT | RELATED | `oracles/vc-bug-catalog.md` VC-CFG-004 (`POST /api/catalog/products/configurations` body field trap) | Same route, different fact; no-DELETE and the dead Delete button are absent. |
| KB-7E35E6BC | Admin renders order timestamps in local time while the API returns UTC | UNIVERSAL | ABSENT | — | Active but disputed; KB-8C3E463D is its correction (profile timezone, not browser). |
| KB-82111688 | the storefront members Status filter finds nobody | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-B2B-013 | Same axis confusion as KB-27B4CD10; vc-fix states the rule, not the filter symptom. |
| KB-8264632C | how the cart page renders an applied and an unapplied coupon | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-CART-009 (single applied-coupon slot; "Remove coupon" state; `validateCoupon` before `addCoupon`) | The applied-path facts are duplicated. The entry's headline — a stored-but-dead code renders as unsubmitted text with no marker, and only Clear cart removes it — is absent. |
| KB-8A82CF4D | switching a product's configurability on and off | UNIVERSAL | ABSENT | — | |
| KB-8C3E463D | which clock an Admin timestamp is in | UNIVERSAL | ABSENT | — (only BL-SR-001 mentions UTC, for sales-rep statistics) | |
| KB-996BDF08 | cart-level promotion reward placement | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-PRICE-001 (verify reads `cart.items[].placedPrice`) | BL-PRICE-001 states stacking order and would read line items — which is exactly where a `RewardCartGetOfRelSubtotal` never lands. Where the reward lands is absent. |
| KB-A1B35892 | a configured product as a cart line item | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-CART-007 source (`IsConfigured` lines bypass the merge → separate lines), BL-CART-010 (`lineItem.listPrice` = sum of selected placements) | Mechanism for two same-product lines and the price roll-up is stated; the synthesised `Configuration-<SKU>` sku and fixed option quantity are absent. |
| KB-A3CE7FBA | recovering a percentage rate from a discount amount | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-CART-009 verify ("assert against `discountTotal`, not a computed %"), BL-PRICE-009 (product-level `discountPercent`) | vc-fix warns off the division in one verify step; the two conditions (post-item-reward base, unrounded digits) are absent. |
| KB-A4EB3766 | the cart record survives checkout, emptied and reused | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-CROSS-005 side effect (5) "cart is cleared" | Same row reused with same id and a fresh `checkoutId`, and the consequence for investigations, are absent. |
| KB-AB35BCDC | what an order line item stops carrying once the cart becomes an order | CONTRACT | ABSENT | — (`OrderLineItemType` not in `api/graphql-schema.md`; only cart `LineItemType` is) | |
| KB-AD1FA66B | where a cart's money lives, and which copy goes stale | UNIVERSAL | ABSENT | — (`/api/carts` REST appears nowhere in vc-fix) | |
| KB-ADFD93AB | org-specific pricing runs through the organization's user groups | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-PRICE-007, BL-B2B-002 ("organization has a dedicated price list assigned") | vc-fix names the outcome with a different, vaguer mechanism; `UserGroupsContainsCondition` on the org's groups and the Contracts module pattern are absent. |
| KB-B769C7B1 | storefront org role and platform user role are one store | DEPLOYMENT | RELATED | `oracles/business-logic.md` BL-B2B-008 (`changeOrganizationContactRole` MUST NOT change global `ApplicationUser.Roles`); `oracles/e-commerce-edge-cases-library.md` §14.3 row 3 (role change effective at next sign-in) | The re-authenticate clause is duplicated by ECL §14.3. The central claim contradicts BL-B2B-008 — this stand writes the same assignment through both doors. |
| KB-B9C8ECD3 | the scoped discount totals on an order | UNIVERSAL | ABSENT | — (`subTotalDiscount` appears only as a name in the CustomerOrderType field list) | Internal near-duplicate of KB-FF7E4D5B / KB-F1542157. |
| KB-BAEBCDA7 | an organization invitation cannot be cancelled or resent | DEPLOYMENT | RELATED | `oracles/business-logic.md` BL-B2B-012 (revoke → `Deleted` status; an `Invited` membership "can only be resent"; re-invite gated on `ReinvitableStatuses`) | Contradiction: vc-fix documents revoke/resend semantics; the entry found no control on either surface and re-invite refused as DuplicateEmail even after Delete. |
| KB-BC6FC633 | admin account role assignment is staged until save | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-NOTIF-004 (a Save that reports success must have reached the server; staged edits must stay visible) | Generic rule, stated for notification templates; the Roles-blade instance is absent. |
| KB-BCA7468D | two endpoints disagree about whether a password hash is a secret | SOURCE | ABSENT | — | |
| KB-BF730613 | lockoutEnd has three meaningful values | SOURCE | RELATED | `oracles/business-logic.md` BL-AUTH-003 (failed-attempt lockout sets `LockoutEnd`), BL-PLAT-002 (non-empty `LockoutEnd` revokes sessions) | The sentinels `0001-01-01` (explicit unlock) and `9999-12-31` (permanent lock) are absent. |
| KB-C1024558 | telling a coupon-driven discount from an automatic one | UNIVERSAL | ABSENT | — (`DiscountType` not in `api/graphql-schema.md`) | |
| KB-C440D4E3 | there is no product search route under /api/catalog/products | CONTRACT | ABSENT | — (`listentries` appears only as `POST /api/catalog/listentries/move` in BL-CAT-011; `domain/products.md` §2 contradicts the `productType` value set) | |
| KB-CA4C93E4 | discount rate not persisted on order | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-PRICE-009 (`PriceType.discountPercent`, product-level) | vc-fix documents a rate field on the product price; nothing on the order discount row. Weak relation. |
| KB-CC195687 | a variation on an order does not record its parent | CONTRACT | ABSENT | — | |
| KB-CC9A98D3 | order address copies per operation | UNIVERSAL | ABSENT | — (`deliveryAddress` only as a mutation input in `api/order-creation-matrix.md`) | |
| KB-D24EDC70 | what refuses a never-registered account at sign-in was not established | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-AUTH-002 (`emailVerificationRequired` gates protected features); `oracles/vc-bug-catalog.md` VC-AUTH-003 | vc-fix asserts the universal rule the entry could not pin to a mechanism; the entry records the gap. |
| KB-D4A064A5 | promotion discount rounding on the cart | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-PRICE-003 | Same as KB-4982C91F, cart side. |
| KB-D60012DB | discount row WithTax is never written | SOURCE | ABSENT | — (`discountAmountWithTax` listed only as a `LineItemType` field name) | |
| KB-D992AF44 | order discount row is a snapshot, not a live reference | UNIVERSAL | ABSENT | — (`promotionName` appears nowhere) | |
| KB-DA14E8B7 | block on an un-accepted invitation is irreversible | DEPLOYMENT | RELATED | `oracles/business-logic.md` BL-B2B-012, BL-B2B-013, BL-AUTH-012 | vc-fix's two-axis model keeps status and lock separate; on this stand Block/Unblock overwrite `contact.status` and the global lockout, destroying the `Invited` state. |
| KB-E01A9F11 | the promotion blade's required-field warnings are not a save gate | UNIVERSAL | ABSENT | — | |
| KB-E17E4CEF | admin account Status picker cannot represent the values it displays | UNIVERSAL | ABSENT | — (`PendingApproval` appears once, in BL-B2B-004 about quotes) | |
| KB-E367DA11 | wishlist scope has three values and the roster shows two | CONTRACT | RELATED | `api/graphql-schema.md` `wishlists(… scope: String …)`; `oracles/vc-bug-catalog.md` VC-LIST-001 | The scope argument is listed; `AnyoneAnonymous` appears nowhere. |
| KB-E7790BF6 | where an applied coupon and its reward live on a cart | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-CART-009 (`cart.coupons[]` entries; platform appends); `architecture/vc-module-architecture.md` §2 ("coupons are a separate entity, not inline"); `api/graphql-schema.md` §CouponType (`code`, `isAppliedSuccessfully`) | Two-record shape is implied across three files; the one-way join via `DiscountType.coupon` and REST's richer discount row are absent. |
| KB-EAA7BA2F | storefront Lists page is an owner-only roster | UNIVERSAL | RELATED | `api/graphql-schema.md` `wishlists(… scope …)` | The contract lists the `scope` argument the shipped UI never passes; the UI fact is absent. |
| KB-EB991080 | configuration section options are filtered by storefront resolvability | UNIVERSAL | RELATED | `oracles/vc-bug-catalog.md` VC-CAT-003 (products 404 on storefront until linked into the virtual catalog); `domain/products.md` §6 ("Variation section currently renders empty (known bug)") | vc-fix has the resolvability precondition and one empty-section symptom; the silent drop ignoring `isRequired` is absent. |
| KB-EC76F588 | no paymentMethodCode on an order payment; shipment spells its sibling differently | CONTRACT | RELATED | `api/graphql-schema.md` §PaymentInType (`gatewayCode`), payment-result types (`paymentMethodCode`) | The field tables imply the asymmetry without stating it as a trap. |
| KB-EF3CB7FB | Login on behalf is authorized on the storefront not in Admin | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-AUTH-009 (`impersonate.vue` POSTs `/connect/token grant_type=impersonate` with the current token; `canSkipVerification` needs `CanImpersonate`); `oracles/vc-bug-catalog.md` VC-B2B-003 (admin user cannot sign into storefront; impersonation needs a Customer-typed user), VC-B2B-004 | Storefront mechanism and permission naming are stated; the Admin button's behaviour and the 403 failure mode are absent. |
| KB-EF925925 | an open cart page is not re-confirmed before Place order | UNIVERSAL | RELATED | `oracles/e-commerce-edge-cases-library.md` §2.3 rows 1, 3 (price changes between cart and checkout; dynamic pricing not recalculated); `oracles/business-logic.md` BL-CHK-006 | Generic patterns; the mutation-refresh trap and the 22-second observation are absent. |
| KB-F027283D | the discount label a shopper sees is free text nobody keeps honest | UNIVERSAL | ABSENT | — | Flow KB-EB228603 Step 4 states it internally. |
| KB-F1542157 | an order-level discount is not allocated to the line items | UNIVERSAL | RELATED | `oracles/business-logic.md` BL-CHK-006 (aggregate `discountTotal` in the formula), BL-LOY-014 (Line items blade totals bar) | Formula and blade are covered; that line items stay at `discountAmount 0` for a cart-level reward is absent. |
| KB-F8707174 | the cancellation reason is customer-facing | UNIVERSAL | ABSENT | — (`cancelReason` listed as a CustomerOrderType field name only) | |
| KB-FA724D31 | storefront Delete member detaches the contact and orphans the account | DEPLOYMENT | RELATED | `oracles/business-logic.md` BL-B2B-012 (`Deleted` is a status value; the row survives) | vc-fix: a status transition on a persistent row. This stand: membership removed, contact and account and role survive detached. Entry carries a `contradicts` note pointing to KB-4A8606CA. |
| KB-FF7E4D5B | cart-subtotal percentage reward on CustomerOrder | UNIVERSAL | ABSENT | — | Internal near-duplicate of KB-B9C8ECD3 and KB-F1542157. |
| KB-A54C919F (flow) | make a promotion require a coupon and use the code on the storefront | PROCEDURE | RELATED | `oracles/business-logic.md` BL-CART-009 (storefront apply: validate → add, single slot); `oracles/e-commerce-edge-cases-library.md` §1.3 row 5; `domain/sitemap.md` Marketing → Coupons | Step 4/pitfall are covered by BL-CART-009. Step 5 (case-sensitive, untrimmed) is contradicted by ECL §1.3 row 5. Steps 1–3, 6, 7 (Admin coupon widget, derived `hasCoupons`, apply does not consume) are absent. |
| KB-AFB2D3C5 (flow) | an order placed on the storefront and read back in Admin | PROCEDURE | RELATED | `automation/storefront-selectors.md` §4 ("single-page cart + checkout flow on `/cart` … no dedicated `/checkout` route"; Place Order selectors); `oracles/vc-bug-catalog.md` VC-CART-006, VC-CHECKOUT-002; `api/order-creation-matrix.md` (`FixedRate/Ground`, `DefaultManualPaymentMethod`) | Steps 2 and 4 are duplicated. Step 1 (`/search`), Step 3 (variation rows), Steps 5–6 (Admin read-back, `#!/workspace/orders`, Cancel vs Delete) are absent. |
| KB-EB228603 (flow) | create a percentage-off promotion and see it apply on the storefront | PROCEDURE | RELATED | `domain/sitemap.md` Admin Marketing → Promotions / Coupons; `/api/marketing/` routes | Only the blade's existence and REST routes are listed. Steps (More menu, `RewardCartGetOfRelSubtotal`, store scoping, description as shopper label, Usage history is a search) are absent. |

### A. Totals

Per verdict (91 rows):

| verdict | count | share |
|---|---|---|
| DUPLICATE | 2 | 2.2% |
| RELATED | 56 | 61.5% |
| ABSENT | 33 | 36.3% |

Per fact class (91 rows):

| fact class | count |
|---|---|
| UNIVERSAL | 59 |
| CONTRACT | 12 |
| DEPLOYMENT | 10 |
| SOURCE | 6 |
| PROCEDURE | 3 |
| TOOLING | 1 |

Cross-tab (fact class × verdict):

| fact class | DUPLICATE | RELATED | ABSENT | total |
|---|---|---|---|---|
| UNIVERSAL | 0 | 36 | 23 | 59 |
| CONTRACT | 0 | 6 | 6 | 12 |
| DEPLOYMENT | 0 | 8 | 2 | 10 |
| SOURCE | 1 | 3 | 2 | 6 |
| PROCEDURE | 0 | 3 | 0 | 3 |
| TOOLING | 1 | 0 | 0 | 1 |
| **total** | **2** | **56** | **33** | **91** |

Observations on the RELATED bucket (56): 13 of them are RELATED because vc-fix *contradicts* the captured entry on the same coordinate — KB-02238DE5 (BL-B2B-005), KB-06409954 (BL-AUTH-012), KB-13B32D5F (VC-PROMO-002 "store-wide" vs platform-wide), KB-3113CBC1 (products.md `productType` values), KB-35F20D97 and flow KB-A54C919F (ECL §1.3 coupon case sensitivity), KB-4C5627CE (BL-ORD-007 gates), KB-4D082C89 / KB-DA14E8B7 / KB-BAEBCDA7 / KB-FA724D31 / KB-B769C7B1 (BL-B2B-008/012/013 per-org membership model), KB-0C163966 (ECL §14.5 disabled-until-configured). Six of those seven B2B contradictions are consistent with vc-fix documenting the VCST-5028 `OrganizationMembership` model while `vcptcore_stable` runs a Customer module that writes `contact.status` and the global lockout — a module-mix difference, not a factual error on either side. The coupon case-sensitivity pair and the `productType` value set are genuine factual disagreements that one side has wrong. Of the remaining 43 RELATED rows, roughly 9 are weak (a generic ECL pattern or a bare schema field list standing in for the fact: KB-5F7C8FC4, KB-6E98AA17, KB-CA4C93E4, KB-E367DA11, KB-EAA7BA2F, KB-EC76F588, KB-18991381, KB-A4EB3766, KB-BC6FC633).

Internal near-duplicates inside (1) noticed while reading: KB-27B4CD10 / KB-4B889114 / KB-82111688 (one fact, three entries); KB-B9C8ECD3 / KB-F1542157 / KB-FF7E4D5B (one fact, three entries); KB-7E35E6BC superseded in substance by KB-8C3E463D; KB-360127D0 superseded by KB-59E4B5FC; KB-4CCC2DD6 overlaps KB-0C102D97 and KB-4C5627CE.

---

## B. Reverse direction: every 4th BL-* invariant (54 of 216, file order)

`oracles/business-logic.md` holds 216 `### BL-` headings across 24 domains (the header of `agents/qa-backend-expert.md` line 22 still says "17 domains, 108 rules"). Every 4th heading in file order (1st, 5th, 9th, …) gives 54 entries. Flags: SRC = has a `- **Source:**` line naming a file/route/type/PR; VER = has `- **Verify:**`; DATE = has an `- **Amended:**` or `- **Promoted:**` date.

| # | id | one-line summary | class | SRC | VER | DATE |
|---|---|---|---|---|---|---|
| 1 | BL-PRICE-001 | discounts stack sale → tier → coupon on the already-discounted amount | UNIVERSAL | Y (`BestRewardPromotionPolicy.cs`) | Y | 2026-07-22 |
| 2 | BL-PRICE-005 | each currency has its own price list; no exchange-rate conversion; missing → Unavailable | UNIVERSAL | N | Y | — |
| 3 | BL-PRICE-009 | `discountPercent` is a 4-decimal away-from-zero fraction, bypasses money rounding policy | SOURCE-DERIVABLE | Y (`ProductPrice.cs`, `PriceType.cs`) | Y | 2026-08-24 |
| 4 | BL-CART-004 | currency switch recalculates primary-currency lines; loyalty lines preserved | UNIVERSAL | N | Y | 2026-06-09 |
| 5 | BL-CART-008 | cart persists across sign-out; guest merge re-prices coupons | SOURCE-DERIVABLE | Y (`MergeCartCommandHandler`, `CartAggregateRepository.SaveAsync`) | Y | 2026-07-27 |
| 6 | BL-CART-012 | configuration-item selection mutations are scoped to one `lineItemId` | SOURCE-DERIVABLE | Y (PR #114 §Scoping) | Y | — |
| 7 | BL-CHK-001 | guest checkout only when `createAnonymousOrderEnabled`; guest order unlinked | UNIVERSAL (config-gated) | Y (`pages/checkout/index.vue`) | Y | 2026-07-22 |
| 8 | BL-CHK-005 | shipping methods derive from the shipping address; change refreshes them | UNIVERSAL | Y (`shipping-details-section.vue`) | Y | 2026-07-22 |
| 9 | BL-ORD-001 | payment/shipment state-machine guards; no `Captured` enum | SOURCE-DERIVABLE | Y (`PaymentFlowService.cs`) | Y | 2026-07-22 |
| 10 | BL-ORD-005 | order number `CO{date:yyMMdd}-{counter:D5}`, daily counter reset | UNIVERSAL (config default) | Y (`CounterOptions.cs`, `SequenceNumberGeneratorService`) | Y | 2026-07-22 |
| 11 | BL-ORD-008 | every order state change is in an append-only change log with actor | UNIVERSAL (aspirational) | N | Y | — |
| 12 | BL-AUTH-003 | lockout after N failed logins (default 5), generic message | UNIVERSAL | Y (`AuthorizationController.Exchange()`) | Y | 2026-07-22 |
| 13 | BL-AUTH-007 | storefront logout only inside the account-menu popup; `data-test-id="sign-out-button"` | SOURCE-DERIVABLE | Y (`top-header.vue`, `useSignMeOut`) | Y | 2026-08-05 |
| 14 | BL-AUTH-011 | Back-to-operator mints a fresh operator token via `grant_type=impersonate` with empty `user_id` | SOURCE-DERIVABLE | Y (`useImpersonate.ts`) | Y | 2026-08-05 |
| 15 | BL-AUTH-015 | active organization resolves by a fixed 5-step chain over accessible orgs | SOURCE-DERIVABLE | Y (`OrganizationAccessResolver.cs:14-79`) | Y | 2026-08-05 / promoted 2026-08-04 |
| 16 | BL-B2B-002 | org price list overrides store default; fallback to store default | UNIVERSAL | N | Y | — |
| 17 | BL-B2B-006 | white-labeling resolution (pointer to BL-WL domain) | UNIVERSAL | N | Y | — |
| 18 | BL-B2B-010 | self-service company registration grants org-membership roles only | UNIVERSAL (VCST-5028 model) | N | Y | — |
| 19 | BL-CAT-001 | aggregated stock 0 → Sold out, Add to Cart disabled | UNIVERSAL | N | Y | — |
| 20 | BL-CAT-005 | product must be in the store's assigned (virtual) catalog to appear | UNIVERSAL | N | Y | — |
| 21 | BL-CAT-009 | category CRUD atomic; delete cascades to subcategories | UNIVERSAL | N | Y | — |
| 22 | BL-CROSS-001 | price list deletion → Unavailable, never $0 | UNIVERSAL | N | Y | — |
| 23 | BL-CROSS-005 | order placement side effects: inventory, email, GA4, history, cart cleared | UNIVERSAL | N | Y | — |
| 24 | BL-CROSS-009 | any write is reflected everywhere within 120 s | UNIVERSAL (aspirational bound) | N | Y | 2026-07-23 |
| 25 | BL-SRCH-001 | facet counts equal filtered result counts | UNIVERSAL | Y (`ChildCategoriesQueryHandler`) | Y | 2026-07-22 |
| 26 | BL-SRCH-005 | special characters in search are literal; no 500 | UNIVERSAL | N | Y | — |
| 27 | BL-SHIP-004 | selected shipping method persists through checkout edits | UNIVERSAL | N | Y | — |
| 28 | BL-BOPIS-004 | PDP store-selector modal is view-only | UNIVERSAL | N | Y | — |
| 29 | BL-BOPIS-008 | confirmed pickup location always at `items[0]` of `cartPickupLocations` | SOURCE-DERIVABLE | N | Y | promoted 2026-04-28 |
| 30 | BL-NOTIF-004 | an admin Save must be observable through the API | UNIVERSAL | Y (`notifications-edit-template.js:439-547`, `NotificationsController.cs`) | Y | promoted 2026-07-29 |
| 31 | BL-IMPEX-001 | CSV re-import updates, never duplicates | UNIVERSAL | N | Y | — |
| 32 | BL-SEO-001 | slug uniqueness validated on save; no auto-suffix | UNIVERSAL | N | Y | — |
| 33 | BL-PROFILE-001 | silent duplicate-skip on `updateMemberAddresses` | SOURCE-DERIVABLE | Y (`MemberAggregateRootBase.cs`, `CheckDuplicateAddressQueryHandler.cs`) | **N** (no Rule/Verify bullets — different layout) | 2026-07-22 / promoted 2026-04-23 |
| 34 | BL-UI-004 | content stays inside its container at every viewport | UNIVERSAL | N | Y | promoted 2026-05-14 |
| 35 | BL-GQL-001 | GraphQL validation and execution errors both return HTTP 200 with `errors[]` | UNIVERSAL (graphql-dotnet behaviour) | N (middleware named only in Amended) | Y | 2026-07-22 / promoted 2026-05-15 |
| 36 | BL-LOY-001 | promotion evaluation scoped to primary-currency lines | SOURCE-DERIVABLE | Y (`CartMappingProfile.cs`, PR #120) | Y | promoted 2026-06-09 |
| 37 | BL-LOY-005 | loyalty-currency line shows no earn-points indicator | SOURCE-DERIVABLE | Y (`LineItemTypeHook`, `LoyaltyPointsCalculator`) | Y | promoted 2026-06-09 |
| 38 | BL-LOY-009 | only cash-currency lines earn points | SOURCE-DERIVABLE | Y (`LoyaltyProgramHandler.EarnProductPointsAsync`) | Y | promoted 2026-06-23 |
| 39 | BL-LOY-014 | Admin Line items blade shows one totals bar per currency | UNIVERSAL (UI, PR #497) | Y (PR vc-module-order #497 + screenshot) | Y | promoted 2026-06-24 |
| 40 | BL-LOY-018 | a mission grants at most once; an order contributes at most once | SOURCE-DERIVABLE | Y (`ApplyMissionInternalAsync:270-497`) | Y | promoted 2026-09-01 |
| 41 | BL-PAY-004 | `allowCartPayment` renders the card form inline on `/cart` in single-step checkout only | SOURCE-DERIVABLE | Y (`payment.vue`, `useCheckout.ts`, PR #2309) | Y | promoted 2026-06-15 |
| 42 | BL-WL-004 | link lists resolve by name; missing → empty array; footer legacy fallback | SOURCE-DERIVABLE | Y (`AddMainMenuLinksAsync`/`AddFooterLinksAsync`) | Y | promoted 2026-07-02 |
| 43 | BL-SR-002 | sales-rep statistics are creator + membership scoped | UNIVERSAL | Y (module README @dev) | Y | 2026-09-04 / promoted 2026-07-23 |
| 44 | BL-SR-006 | cart statistics are currency-scoped; quantity is the primary metric | SOURCE-DERIVABLE | Y (`CustomerCartStatisticsService.BuildQuery`) | Y | 2026-08-24 / promoted 2026-07-23 |
| 45 | BL-SR-010 | one named sort rule per axis; unknown name → default; bad direction → error | SOURCE-DERIVABLE | Y (module README §Sort rules + handlers) | Y | 2026-09-03 / promoted 2026-07-23 |
| 46 | BL-SR-014 | embedded Sales Rep Admin app gates on customer + platform permissions | SOURCE-DERIVABLE | Y (`SalesRepController.cs` `[Authorize]` map) | Y | promoted 2026-07-24 |
| 47 | BL-SR-018 | save mutation echoes the persisted document with fresh UTC `modifiedDate` | SOURCE-DERIVABLE | Y (`LayoutService.SaveLayoutAsync`) | Y | promoted 2026-08-04 |
| 48 | BL-SR-022 | required layout-input fields are schema-enforced; non-scalar value rejected | CONTRACT-DERIVABLE | Y (`InputSalesRepLayoutType`) | Y | promoted 2026-08-04 |
| 49 | BL-SR-026 | a never-saved layout key (`null`) renders registry defaults, not an error | SOURCE-DERIVABLE | Y (module composable) | Y | promoted 2026-08-04 |
| 50 | BL-SR-030 | a save in flight cannot be duplicated by a repeat trigger | SOURCE-DERIVABLE | Y (composable save guard; client-side only) | Y | promoted 2026-08-04 |
| 51 | BL-A11Y-002 | every interactive control has a contextual accessible name | UNIVERSAL | Y (`coupon-card.vue` example) | Y | promoted 2026-08-06 |
| 52 | BL-CR-008 | anonymous visitors never see the review-submission control | SOURCE-DERIVABLE | Y (`product-reviews.vue`) | Y | 2026-08-24 |
| 53 | BL-CR-013 | moderation Approve/Reject/Reset transition status immediately | SOURCE-DERIVABLE | Y (`CustomerReviewsModuleController.cs`) | Y | 2026-08-24 |
| 54 | BL-PLAT-001 | role/permission changes take effect immediately; deleting an assigned role is safe | SOURCE-DERIVABLE | Y (`CustomRoleManager.cs` `SecurityCacheRegion.ExpireRegion()`) | Y | 2026-08-24 |

### B. Totals (54 sampled)

| class | count |
|---|---|
| UNIVERSAL | 29 |
| SOURCE-DERIVABLE | 24 |
| CONTRACT-DERIVABLE | 1 |
| DEPLOYMENT-SPECIFIC | 0 |

| flag | Y | N |
|---|---|---|
| source anchor (file / route / type / PR) | 34 | 20 |
| verify step | 53 | 1 (BL-PROFILE-001) |
| amendment or promotion date | 38 | 16 |

The 16 undated entries are all in the early domains (PRICE-005, CART-012, ORD-008, B2B-002/006/010, CAT-001/005/009, CROSS-001/005, SRCH-005, SHIP-004, BOPIS-004, IMPEX-001, SEO-001) and 15 of them also lack a source anchor — the un-audited original seed. Every entry promoted from 2026-04 onward carries a date, and every Sales Rep / Loyalty / Reviews entry carries a source anchor.

Zero DEPLOYMENT-SPECIFIC invariants in the sample: BL entries are written as platform rules even where the live axis was one environment (BL-LOY-014 cites an environment screenshot as its live proof but states a universal rule). Deployment particulars in vc-fix live in `oracles/vc-bug-catalog.md` instead (VC-CAT-001/002 catalog GUIDs, VC-CFG-002/003 test-product quirks, VC-CHECKOUT-003 Skyflow card), which is the closest structural analogue to the captured entries' `appliesTo`/`evidence.deployment` fields.

### B. Shape of a BL entry

A BL entry is a level-3 heading `### BL-<DOMAIN>-<NNN>: <title> \`[severity]\`` (severity one of `P0-revenue`, `P0-security`, `P1-data`, `P1-ux`, `P2-ux`; a few carry `[GOLDEN RULE]`) followed by a fixed bullet skeleton: **Rule** (the invariant, often several sentences with bolded MUST/NOT clauses and version/ticket caveats), **Verify** (a concrete test recipe naming surfaces, mutations, fields and expected values), **Violation signal** (what a failure looks like), **Agents** (which vc-fix agent owns the check). Audited entries add **Source** (a module + file path, method, line range or PR number, sometimes a quoted code fragment), **Docs** (a VirtoOZ guide citation or an explicit "N/A — implementation detail (§1a)" waiver), and provenance lines **Amended:** `<date> (auto-applied, triangulated — BL-AUDIT-<date>; CONFIRMED|DRIFT|MISSING …)` and/or **Promoted:** `<date> (from <proposals file or TLC id>)`, occasionally **Scope**, **Known behavior**, **Related**, **Applies to** (suite/case ids), **Suite coverage**, **Data path** or **Storefront label mapping**. Dates, audit ids and the CONFIRMED/DRIFT/MISSING verdicts are typed by the amending author into prose, not held as structured fields; there is no `appliesTo`, no deployment, no evidence list and no retire/dispute mechanism other than rewriting the Rule or appending an "→ superseded by" note to the heading (BL-B2B-006).

---

## C. Consumption map: knowledge files → referencing agents / skills / commands

Method: for each of the 34 files under `plugins/vc-fix/knowledge/`, `grep -rl <basename>` across `plugins/vc-fix/agents`, `plugins/vc-fix/skills`, `plugins/vc-fix/commands` (97 files). Two hits on `README.md` were false positives (`skills/qa-evidence/output-paths.md:115` cites `reports/README.md`; `skills/vc-self-check/upstream-reduce.mjs:753` is a literal in a comment) and are excluded.

| knowledge file | referenced from |
|---|---|
| `oracles/business-logic.md` | agents: backend-reviewer, frontend-reviewer, fullstack-backend, fullstack-frontend, monitor-triage-agent, qa-backend-expert, qa-frontend-expert, qa-testing-expert; commands: qa-monitoring, qa-verify-fix; skills: dotnet-fix/SKILL, qa-checklist/SKILL, qa-checklist/checklist-creation-guide, qa-evidence/output-paths, qa-monitoring/SKILL, vue-fix/SKILL |
| `oracles/vc-bug-catalog.md` | agents: backend-reviewer, frontend-reviewer, fullstack-backend, fullstack-frontend, monitor-triage-agent; commands: qa-monitoring; skills: dotnet-fix/SKILL, dotnet-fix/fix-patterns, qa-monitoring/SKILL, vue-fix/SKILL, vue-fix/vue-fix-patterns |
| `oracles/e-commerce-edge-cases-library.md` | agents: qa-backend-expert, qa-frontend-expert, qa-testing-expert; commands: qa-verify-fix; skills: qa-checklist/SKILL, qa-checklist/checklist-creation-guide |
| `oracles/critical-ui-scope.md` | agents: frontend-reviewer, fullstack-frontend; skills: vue-fix/SKILL |
| `domain/catalog.md` | agents: backend-reviewer, frontend-reviewer, fullstack-backend, fullstack-frontend, monitor-triage-agent, qa-backend-expert; commands: qa-monitoring; skills: dotnet-fix/SKILL, dotnet-fix/fix-patterns, qa-checklist/checklist-creation-guide, qa-monitoring/SKILL, vue-fix/SKILL, vue-fix/vue-fix-patterns |
| `domain/products.md` | agents: qa-backend-expert, qa-frontend-expert, qa-testing-expert |
| `domain/sitemap.md` | agents: qa-frontend-expert, qa-testing-expert; skills: qa-checklist/SKILL |
| `domain/store-settings.md` | agents: qa-backend-expert |
| `api/api-auth.md` | agents: qa-backend-expert; commands: qa-bug; skills: project-init/verify-access.mjs, qa-fix-routing/module-registry.ts |
| `api/graphiql-interaction.md` | agents: qa-backend-expert, qa-testing-expert; commands: qa-bug |
| `api/graphql-schema.md` | agents: qa-backend-expert, qa-frontend-expert, qa-testing-expert; commands: qa-bug; skills: qa-checklist/SKILL, qa-checklist/graphql-checklist |
| `api/graphql-test-cases-runner.md` | agents: qa-backend-expert, qa-frontend-expert, qa-testing-expert; skills: qa-checklist/SKILL, qa-checklist/graphql-checklist |
| `api/order-creation-matrix.md` | agents: qa-backend-expert, qa-frontend-expert, qa-testing-expert |
| `api/platform-patterns.md` | agents: monitor-triage-agent, qa-backend-expert, qa-frontend-expert, qa-testing-expert; commands: qa-monitoring; skills: qa-monitoring/SKILL |
| `architecture/vc-frontend-architecture.md` | agents: fullstack-frontend; skills: vue-fix/SKILL, vue-unit-test/SKILL |
| `architecture/vc-module-architecture.md` | agents: fullstack-backend; skills: angular-admin/SKILL, angular-admin/admin-spa-ui-conventions, dotnet-fix/SKILL, dotnet-unit-test/SKILL, vc-shell-fix/SKILL |
| `automation/browser-quirks.md` | agents: qa-frontend-expert, qa-testing-expert |
| `automation/storefront-config-flags.md` | agents: fullstack-frontend; skills: vue-unit-test/vitest-patterns |
| `automation/storefront-selectors.md` | agents: fullstack-frontend; skills: vue-unit-test/SKILL, vue-unit-test/vitest-patterns |
| `agents/qa/shared-instructions.md` | agents: all 7 developer/QA agents (backend-reviewer, frontend-reviewer, fullstack-backend, fullstack-frontend, qa-backend-expert, qa-frontend-expert, qa-testing-expert); commands: qa-fix; skills: qa-evidence/evidence-capture-policy, qa-risk/SKILL |
| `agents/developers/shared-instructions.md` | same set as above |
| `diagnostics/skill-expectations.md` | agents: self-check-diagnostician; commands: project-init, qa-bug, qa-env-check, qa-fix, qa-monitoring, qa-verify-fix, vc-self-check; skills: project-init/SKILL, project-init/lib/diag-obs.mjs, vc-self-check/SKILL, vc-self-check/upstream-reduce.mjs |
| `diagnostics/upstream-schema.md` | agents: self-check-diagnostician; skills: vc-self-check/SKILL, vc-self-check/deliver.mjs, vc-self-check/upstream-reduce.mjs |
| `diagnostics/adr-upstream-default-deny.md` | skills: vc-self-check/SKILL, vc-self-check/deliver.mjs, vc-self-check/upstream-reduce.mjs |
| `execution/azure-html-format.md` | commands: qa-bug, qa-verify-fix; skills: qa-defect/defect-lifecycle-workflow, qa-defect/defect-report-templates, qa-fix-routing/bug-contract.mjs, qa-fix-routing/trackers/azure-tracker.ts |
| `execution/debugging-signals.md` | agents: monitor-triage-agent, qa-backend-expert, qa-frontend-expert, qa-testing-expert; commands: qa-monitoring; skills: qa-monitoring/SKILL |
| `execution/frontend-local-verify.md` | commands: qa-fix; skills: project-init/discover-repos.mjs |
| `execution/module-suite-map.md` | agents: qa-backend-expert; commands: qa-bug, qa-fix; skills: qa-investigate/SKILL, qa-investigate/bug-investigation-flow, qa-risk/risk-prioritization-framework |
| `execution/performance-thresholds.md` | agents: qa-frontend-expert, qa-testing-expert |
| `execution/plugin-root.md` | commands: qa-bug, qa-env-check, qa-fix, qa-monitoring, qa-verify-fix; skills: project-init/SKILL, project-init/gen-profile.mjs, project-init/verify-access.mjs |
| `execution/tracker-ops.md` | commands: qa-bug, qa-env-check, qa-fix, qa-verify-fix; skills: project-init/discover-tracker.mjs, project-init/verify-access.mjs, qa-defect/defect-lifecycle-workflow, qa-investigate/SKILL, qa-investigate/bug-investigation-flow, qa-investigate/evidence-and-root-cause |
| **`execution/live-discovery.md`** | **nothing** |
| **`README.md`** (knowledge root) | **nothing** (the two grep hits are unrelated `README.md` literals) |
| **`agents/README.md`** | **nothing** (same false positives) |

Dangling reference: `skills/vc-docs/SKILL.md:61` points at `knowledge/domain/release-ledger.md`, which does not exist under `knowledge/domain/` (only `catalog.md`, `products.md`, `sitemap.md`, `store-settings.md`); the text says it is a generated `.claude/knowledge/...` file.

### C. Id-level references

`grep -rEo "(BL|VC|ECL)-[A-Z0-9]+-[0-9]+"` across agents/skills/commands finds **23 distinct BL ids** (of 216) and **zero VC-* and zero ECL-* ids**. The bug catalog and edge-case library are cited only by file name, never by entry id. Ids referenced, with counts: BL-CROSS-002 ×5, BL-PRICE-001 ×4, BL-ORD-001 ×3, BL-CHK-003 ×3, BL-AUTH-005 ×3, BL-PRICE-006 ×2, BL-ORD-002 ×2, BL-CROSS-007 ×2, BL-CHK-006 ×2, and ×1 each: BL-SRCH-001, BL-PAY-001, BL-NOTIF-001/002/003, BL-CROSS-004, BL-CAT-001, BL-CART-001/002/004, BL-B2B-001/003/005/006. Referencing files, by id-token count: agents/qa-frontend-expert.md 9, skills/qa-checklist/domain-checklists.md 7, agents/frontend-reviewer.md 7, agents/qa-testing-expert.md 6, agents/qa-backend-expert.md 6, agents/fullstack-backend.md 6, skills/qa-checklist/checklist-creation-guide.md 5, agents/fullstack-frontend.md 5, skills/vue-fix/SKILL.md 4, skills/qa-checklist/SKILL.md 3, skills/dotnet-fix/fix-patterns.md 3, commands/qa-verify-fix.md 3, skills/vue-fix/vue-fix-patterns.md 2, agents/monitor-triage-agent.md 2. All cited ids belong to the first eight domains (PRICE, CART, CHK, ORD, AUTH, B2B, CAT, CROSS) plus NOTIF, SRCH, PAY; none of the 133 invariants in domains 11–24 (GQL, LOY, WL, SR, A11Y, CR, PLAT, STORE and the rest) is cited by id from any agent, skill or command. `agents/qa-backend-expert.md:22` describes the file as "17 domains, 108 rules" — the file now has 24 domains and 216.

---

## Entries not classified, and borderline calls

No active entry or flow was left unclassified. Borderline calls, with the reason for the side chosen:

- **KB-6824BC2B** — DUPLICATE chosen because `api/graphiql-interaction.md` states both the path and the anonymous default; note that `api/api-auth.md:87` states the opposite about the principal, so vc-fix is internally inconsistent on this coordinate.
- **KB-5ADBFB34** — DUPLICATE chosen because BL-CART-003's known-behaviour note cites the same file and lines and the same one-`CartSubtotalReward` outcome; the entry's extra clauses (money ordering, `isExclusive` irrelevant) do not change the mechanism.
- **KB-4C5627CE** — RELATED, not DUPLICATE: the state vocabulary half is stated verbatim by BL-ORD-007, the gating half is contradicted by it.
- **KB-8264632C** — RELATED, not DUPLICATE: BL-CART-009 duplicates the applied path but the entry's central claim is about the unapplied path.
- **KB-B769C7B1, KB-BAEBCDA7, KB-DA14E8B7, KB-FA724D31, KB-4D082C89, KB-06409954** — DEPLOYMENT rather than UNIVERSAL because vc-fix documents a different (VCST-5028 `OrganizationMembership`) model; whether the difference is module version or configuration was not established from this desk.
- **KB-360127D0, KB-7E35E6BC** — still `status: active` but each carries a `contradicts: true` note and a later entry (KB-59E4B5FC, KB-8C3E463D) that corrects it; classified on their body as written.
