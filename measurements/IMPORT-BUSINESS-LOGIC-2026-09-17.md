# Import — business-logic.md → the normative plane

source      C:/_VIRTO/vc-mcp-testing-module/plugins/vc-fix/knowledge/oracles/business-logic.md
sha256      94fe94c74d6810f62f45481e3bba0fb6d7d1215771106d29a63dedbf0a8e5a08
origin      fed4b2b5b957c1c2f553cb9f0127f170d2e7c8c1 2026-09-08T23:43:47+02:00
base        C:/_VIRTO/vc-knowledge
mode        dry run (pass --write)

parsed              216 rules in 25 domains
importable          216
held back           0
carry a coordinate  49  (93 anchors)
no coordinate       167  — reached by id and domain, which is what a rule is for
no severity tag     0
known contradiction 10  — the overlap annex found these by reading
neighbour sighting  15  — share a coordinate with an observed entry

## Contradictions the annex established

A person read the rule and the entry side by side and found them to disagree. Both are
recorded and neither is edited: the rule says what the platform is meant to do, the entry says
what somebody watched it do. Settling one means deciding which, and saying so ON the rule --
after --write, with the KB id printed below:

    kb dispute <KB id> --deployment <env> --note "<what was seen instead>"

Six of the B2B pairs are probably NOT one side being wrong. The annex reads them as vc-fix
describing the VCST-5028 OrganizationMembership model while this stand runs a Customer module
that writes contact.status and the global lockout. A scope axis settles those, not a dispute.

  BL-CART-003      
      vs KB-13B32D5F
  BL-CART-009      
      vs KB-35F20D97
      vs KB-A54C919F
  BL-ORD-007       
      vs KB-4C5627CE
  BL-AUTH-012      
      vs KB-06409954
      vs KB-DA14E8B7
  BL-B2B-005       
      vs KB-02238DE5
  BL-B2B-008       
      vs KB-B769C7B1
      vs KB-4D082C89
  BL-B2B-009       
      vs KB-4D082C89
  BL-B2B-012       
      vs KB-4D082C89
      vs KB-BAEBCDA7
      vs KB-FA724D31
      vs KB-DA14E8B7
  BL-B2B-013       
      vs KB-DA14E8B7
  BL-CAT-006       
      vs KB-0C163966

## Rules that land beside an observation

Not a disagreement -- a shared coordinate. These are the rules the arrival hook and
`writtenNeighbours` will show next to an entry somebody wrote from a deployment, which is the
whole reason an anchor is worth extracting. Listed so a reader can spot a pair the annex missed.

  BL-CART-005      Query.cart
      KB-055845A3  a cart line can serve a unit price that is in neither the configuration nor the line's history
      KB-35A09C64  promotion re-evaluation on cart read
      KB-AD1FA66B  where a cart's money lives, and which copy goes stale
  BL-CART-010      Mutations.changeCartItemSelected, LineItemType.listPrice
      KB-055845A3  a cart line can serve a unit price that is in neither the configuration nor the line's history
      KB-AB35BCDC  what an order line item stops carrying once the cart becomes an order
  BL-CHK-006       CartType.total
      KB-1B18B821  tax is provider-driven and silently zero without an active provider
      KB-EF925925  an open cart page is not re-confirmed before Place order
  BL-AUTH-008      GET /account/impersonate/:userId, /sign-in
      KB-EF3CB7FB  Login on behalf is authorized on the storefront not in Admin
  BL-AUTH-011      POST /connect/token
      KB-EF3CB7FB  Login on behalf is authorized on the storefront not in Admin
  BL-AUTH-013      POST /connect/token, /sign-in
      KB-EF3CB7FB  Login on behalf is authorized on the storefront not in Admin
  BL-B2B-010       /sign-up, GET /api/platform/security/users/{userName}, /api/customer/organization-memberships/search
      KB-BF730613  lockoutEnd has three meaningful values, and one of them looks like the opposite of what it means
      KB-D24EDC70  what refuses a never-registered account at sign-in was not established, and here is where the looking stopped
  BL-B2B-011       POST /api/platform/security/roles/search, PUT /api/organizations, Mutations.changeOrganizationContactRole, PUT /api/customer/organization-memberships/{id}
      KB-02238DE5  storefront org-role gating granularity
      KB-B769C7B1  storefront org role and platform user role are one store
  BL-GQL-004       Query.slugInfo, Query.orders, Query.cart, Query.contact
      KB-055845A3  a cart line can serve a unit price that is in neither the configuration nor the line's history
      KB-35A09C64  promotion re-evaluation on cart read
      KB-AD1FA66B  where a cart's money lives, and which copy goes stale
  BL-LOY-005       CartType.items
      KB-055845A3  a cart line can serve a unit price that is in neither the configuration nor the line's history
  BL-LOY-009       CartType.items
      KB-055845A3  a cart line can serve a unit price that is in neither the configuration nor the line's history
  BL-LOY-010       CartType.validationErrors
      KB-35F20D97  what a coupon code that does not work does to a cart
  BL-LOY-012       CartType.validationErrors, Mutations.addOrUpdateCartPayment
      KB-35F20D97  what a coupon code that does not work does to a cart
  BL-PAY-003       /account/orders, Mutations.createOrderFromCart, /cart
      KB-358A70CB  storefront order page projection of the shipment
      KB-8264632C  how the storefront cart page renders an applied and an unapplied coupon
      KB-A1B35892  a configured product as a cart line item
      KB-E7790BF6  where an applied coupon and its reward live on a cart
      KB-EF925925  an open cart page is not re-confirmed before Place order
      KB-F027283D  the discount label a shopper sees is free text nobody keeps honest
  BL-PAY-004       /cart, /checkout/payment, Mutations.initializeCartPayment, Mutations.initializePayment
      KB-8264632C  how the storefront cart page renders an applied and an unapplied coupon
      KB-A1B35892  a configured product as a cart line item
      KB-E7790BF6  where an applied coupon and its reward live on a cart
      KB-EF925925  an open cart page is not re-confirmed before Place order
      KB-F027283D  the discount label a shopper sees is free text nobody keeps honest

## Modules the page cites

  vc-module-cart               VirtoCommerce.Cart @ 3.1000.3  (2 rules)
  vc-module-core               VirtoCommerce.Core @ 3.1001.2  (1 rule)
  vc-module-customer           VirtoCommerce.Customer @ 3.1000.7  (10 rules)
  vc-module-customer-review    VirtoCommerce.CustomerReviews @ 3.1000.0  (8 rules)
  vc-module-loyalty            VirtoCommerce.Loyalty — NOT recorded as installed  (8 rules)
  vc-module-marketing          VirtoCommerce.Marketing @ 3.1000.1  (1 rule)
  vc-module-notification       VirtoCommerce.Notifications @ 3.1001.8  (5 rules)
  vc-module-order              VirtoCommerce.Orders @ 3.1000.4  (7 rules)
  vc-module-profile-experience-api VirtoCommerce.ProfileExperienceApiModule @ 3.1000.2  (2 rules)
  vc-module-sales-rep          VirtoCommerce.SalesRep — NOT recorded as installed  (12 rules)
  vc-module-shipping           VirtoCommerce.Shipping @ 3.1000.1  (1 rule)
  vc-module-store              VirtoCommerce.Store @ 3.1000.1  (1 rule)
  vc-module-x-api              VirtoCommerce.Xapi @ 3.1003.2  (1 rule)
  vc-module-x-cart             VirtoCommerce.XCart @ 3.1000.6  (16 rules)
  vc-module-x-catalog          VirtoCommerce.XCatalog @ 3.1000.5  (2 rules)
  vc-module-x-order            VirtoCommerce.XOrder @ 3.1000.1  (3 rules)
  vc-module-x-pickup           VirtoCommerce.XPickup — NOT recorded as installed  (1 rule)

## What each rule will become

| rule | severity | anchors | flags |
|---|---|---|---|
| BL-PRICE-001 | P0-revenue | — | no-coordinate |
| BL-PRICE-002 | P0-revenue | — | no-coordinate |
| BL-PRICE-003 | P0-revenue | — | no-coordinate |
| BL-PRICE-004 | P0-revenue | — | no-coordinate |
| BL-PRICE-005 | P0-revenue | — | no-coordinate |
| BL-PRICE-006 | P1-data | — | no-coordinate |
| BL-PRICE-007 | P0-revenue | — | no-coordinate |
| BL-PRICE-008 | P0-revenue | — | no-coordinate |
| BL-PRICE-009 | P2-ux | PriceType.discountPercent |  |
| BL-CART-001 | P0-revenue | — | no-coordinate |
| BL-CART-002 | P0-revenue | — | no-coordinate |
| BL-CART-003 | P0-revenue | — | no-coordinate, known-contradiction |
| BL-CART-004 | P0-revenue | — | no-coordinate |
| BL-CART-005 | P1-data | Query.cart | neighbour-observation |
| BL-CART-006 | P1-data | — | no-coordinate |
| BL-CART-007 | P1-data | — | no-coordinate |
| BL-CART-008 | P1-data | — | no-coordinate |
| BL-CART-009 | P1-data | CartType.coupons, Mutations.removeCoupon, Query.validateCoupon, Mutations.addCoupon | known-contradiction |
| BL-CART-010 | P0-revenue | Mutations.changeCartItemSelected, LineItemType.listPrice | neighbour-observation |
| BL-CART-011 | P1-data | — | no-coordinate |
| BL-CART-012 | P1-data | — | no-coordinate |
| BL-CART-013 | P1-data | — | no-coordinate |
| BL-CART-014 | P1-data | — | no-coordinate |
| BL-CART-015 | P1-data | Mutations.moveToSavedForLater, Mutations.moveFromSavedForLater, Query.configurationItems |  |
| BL-CHK-001 | P0-revenue | — | no-coordinate |
| BL-CHK-002 | P0-revenue | — | no-coordinate |
| BL-CHK-003 | P1-data | — | no-coordinate |
| BL-CHK-004 | P0-revenue | — | no-coordinate |
| BL-CHK-005 | P1-data | — | no-coordinate |
| BL-CHK-006 | P0-revenue | CartType.total | neighbour-observation |
| BL-CHK-007 | P0-revenue | — | no-coordinate |
| BL-CHK-008 | P1-data | — | no-coordinate |
| BL-ORD-001 | P0-revenue | — | no-coordinate |
| BL-ORD-002 | P1-data | — | no-coordinate |
| BL-ORD-003 | P1-data | — | no-coordinate |
| BL-ORD-004 | P0-revenue | — | no-coordinate |
| BL-ORD-005 | P1-data | — | no-coordinate |
| BL-ORD-006 | P0-revenue | — | no-coordinate |
| BL-ORD-007 | P1-data | — | no-coordinate, known-contradiction |
| BL-ORD-009 | P1-data | — | no-coordinate |
| BL-ORD-008 | P1-data | GET /api/order/customerOrders/{id}/changes |  |
| BL-ORD-010 | P1-data | CustomerOrderType.orderTotals, CustomerOrderType.currency |  |
| BL-AUTH-001 | P0-revenue | — | no-coordinate |
| BL-AUTH-002 | P1-data | — | no-coordinate |
| BL-AUTH-003 | P1-data | — | no-coordinate |
| BL-AUTH-004 | P2-ux | — | no-coordinate |
| BL-AUTH-005 | P1-data | POST /api/catalog/products |  |
| BL-AUTH-006 | P1-data | — | no-coordinate |
| BL-AUTH-007 | P1-ux | /sign-out, /logout |  |
| BL-AUTH-008 | P1-data | GET /account/impersonate/:userId, /sign-in | neighbour-observation |
| BL-AUTH-009 | P0-security | — | no-coordinate |
| BL-AUTH-010 | P1-ux | — | no-coordinate |
| BL-AUTH-011 | P1-data | POST /connect/token | neighbour-observation |
| BL-AUTH-012 | P0-revenue | GET /api/platform/security/users/{id}/locked, POST /api/customer/organization-memberships/{id}/lock, POST /connect/token | known-contradiction |
| BL-AUTH-013 | P1-data | POST /connect/token, /sign-in | neighbour-observation |
| BL-AUTH-014 | P1-data | /connect/authorize, POST /api |  |
| BL-AUTH-015 | P0-revenue | — | no-coordinate |
| BL-AUTH-016 | P0-revenue | — | no-coordinate |
| BL-AUTH-017 | P1-data | POST /api/platform/security/login |  |
| BL-B2B-001 | P0-revenue | — | no-coordinate |
| BL-B2B-002 | P0-revenue | — | no-coordinate |
| BL-B2B-003 | P1-data | — | no-coordinate |
| BL-B2B-004 | P0-revenue | CustomerOrderType.isApproved |  |
| BL-B2B-005 | P1-data | — | no-coordinate, known-contradiction |
| BL-B2B-006 | P1-data | — | no-coordinate |
| BL-B2B-007 | P0-revenue | UserType.permissions |  |
| BL-B2B-008 | P1-data | PUT /api/customer/organization-memberships/{id}, GET /api/platform/security/users/{userName}, /api/customer/organization-memberships/search | known-contradiction |
| BL-B2B-009 | P1-data | GET /api/customer/organization-memberships/user/{userId}/count, GET /api/platform/security/users/{userName} | known-contradiction |
| BL-B2B-010 | P1-data | /sign-up, GET /api/platform/security/users/{userName}, /api/customer/organization-memberships/search | neighbour-observation |
| BL-B2B-011 | P1-data | POST /api/platform/security/roles/search, PUT /api/organizations, Mutations.changeOrganizationContactRole, PUT /api/customer/organization-memberships/{id} | neighbour-observation |
| BL-B2B-012 | P1-data | — | no-coordinate, known-contradiction |
| BL-B2B-013 | P1-data | — | no-coordinate, known-contradiction |
| BL-CAT-001 | P0-revenue | — | no-coordinate |
| BL-CAT-002 | P1-data | — | no-coordinate |
| BL-CAT-003 | P2-ux | — | no-coordinate |
| BL-CAT-004 | P2-ux | — | no-coordinate |
| BL-CAT-005 | P1-data | — | no-coordinate |
| BL-CAT-006 | P0-revenue | — | no-coordinate, known-contradiction |
| BL-CAT-007 | P1-data | — | no-coordinate |
| BL-CAT-008 | P2-ux | POST /api/catalog/measures/search, GET /api/catalog/measures/{id}, PUT /api/catalog/measures, PATCH /api/catalog/measures/{id} |  |
| BL-CAT-009 | P1-data | GET /api/catalog/categories |  |
| BL-CAT-010 | P1-data | POST /api/catalog/listentrylinks, GET /api/platform/security/permissions |  |
| BL-CAT-011 | P1-data | POST /api/catalog/listentries/move |  |
| BL-CAT-012 | P2-ux | — | no-coordinate |
| BL-CROSS-001 | P0-revenue | Query.products |  |
| BL-CROSS-002 | P0-revenue | — | no-coordinate |
| BL-CROSS-003 | P1-data | — | no-coordinate |
| BL-CROSS-004 | P0-revenue | — | no-coordinate |
| BL-CROSS-005 | P0-revenue | — | no-coordinate |
| BL-CROSS-006 | P1-data | — | no-coordinate |
| BL-CROSS-007 | P1-data | — | no-coordinate |
| BL-CROSS-008 | P0-revenue | — | no-coordinate |
| BL-CROSS-009 | P1-data | — | no-coordinate |
| BL-CROSS-010 | P0-revenue | — | no-coordinate |
| BL-CROSS-011 | P1-data | — | no-coordinate |
| BL-CROSS-012 | P0-revenue | — | no-coordinate |
| BL-SRCH-001 | P1-data | — | no-coordinate |
| BL-SRCH-002 | P2-ux | — | no-coordinate |
| BL-SRCH-003 | P1-data | — | no-coordinate |
| BL-SRCH-004 | P1-data | — | no-coordinate |
| BL-SRCH-005 | P2-ux | — | no-coordinate |
| BL-SHIP-001 | P0-revenue | — | no-coordinate |
| BL-SHIP-002 | P1-data | — | no-coordinate |
| BL-SHIP-003 | P0-revenue | — | no-coordinate |
| BL-SHIP-004 | P1-data | — | no-coordinate |
| BL-BOPIS-001 | P1-data | PickupLocationType.id, InputShipmentType.pickupLocationId |  |
| BL-BOPIS-002 | P0-revenue | — | no-coordinate |
| BL-BOPIS-003 | P1-data | — | no-coordinate, module-not-installed:vc-module-x-pickup |
| BL-BOPIS-004 | P1-data | — | no-coordinate |
| BL-BOPIS-005 | P1-data | — | no-coordinate |
| BL-BOPIS-006 | P1-data | — | no-coordinate |
| BL-BOPIS-007 | P2-ux | — | no-coordinate |
| BL-BOPIS-008 | P1-data | PickupLocationType.name |  |
| BL-NOTIF-001 | P1-data | — | no-coordinate |
| BL-NOTIF-002 | P1-data | — | no-coordinate |
| BL-NOTIF-003 | P0-revenue | — | no-coordinate |
| BL-NOTIF-004 | P1-data | — | no-coordinate |
| BL-NOTIF-005 | P1-data | — | no-coordinate |
| BL-NOTIF-006 | P1-data | — | no-coordinate |
| BL-NOTIF-007 | P2-ux | — | no-coordinate |
| BL-IMPEX-001 | P1-data | — | no-coordinate |
| BL-IMPEX-002 | P1-data | — | no-coordinate |
| BL-IMPEX-003 | P1-data | — | no-coordinate |
| BL-IMPEX-004 | P1-data | — | no-coordinate |
| BL-SEO-001 | P1-data | — | no-coordinate |
| BL-SEO-002 | P2-ux | Query.slugInfo |  |
| BL-SEO-003 | P2-ux | — | no-coordinate |
| BL-SEO-004 | P1-data | — | no-coordinate |
| BL-PROFILE-001 | P1-data | Mutations.updateMemberAddresses |  |
| BL-UI-001 | P2-ux | — | no-coordinate |
| BL-UI-002 | P2-ux | — | no-coordinate |
| BL-UI-003 | P2-ux | — | no-coordinate |
| BL-UI-004 | P2-ux | — | no-coordinate |
| BL-UI-005 | P2-ux | — | no-coordinate |
| BL-UI-006 | P1-data | — | no-coordinate |
| BL-UI-007 | P1-data | Query.role |  |
| BL-GQL-001 | P1-data | Query.orders |  |
| BL-GQL-002 | P2-ux | — | no-coordinate |
| BL-GQL-003 | P1-data | PriceType.actual, PriceType.list, Mutations.changeCartItemQuantity |  |
| BL-GQL-004 | P0-security | Query.slugInfo, Query.orders, Query.cart, Query.contact | neighbour-observation |
| BL-LOY-001 | P0-revenue | — | no-coordinate |
| BL-LOY-002 | P1-data | Mutations.addItem, CartType.currency |  |
| BL-LOY-003 | P1-data | CartType.cartTotals, CartType.currency |  |
| BL-LOY-004 | P0-revenue | — | no-coordinate |
| BL-LOY-005 | P2-ux | CartType.items | neighbour-observation, module-not-installed:vc-module-loyalty |
| BL-LOY-006 | P1-data | CartType.currency |  |
| BL-LOY-007 | P0-revenue | — | no-coordinate, module-not-installed:vc-module-loyalty |
| BL-LOY-008 | P0-revenue | — | no-coordinate, module-not-installed:vc-module-loyalty |
| BL-LOY-009 | P1-data | CartType.items | neighbour-observation, module-not-installed:vc-module-loyalty |
| BL-LOY-010 | P1-data | CartType.validationErrors | neighbour-observation, module-not-installed:vc-module-loyalty |
| BL-LOY-012 | P1-data | CartType.validationErrors, Mutations.addOrUpdateCartPayment | neighbour-observation, module-not-installed:vc-module-loyalty |
| BL-LOY-013 | P1-data | Query.order |  |
| BL-LOY-014 | P2-ux | — | no-coordinate |
| BL-LOY-015 | P0-revenue | — | no-coordinate, module-not-installed:vc-module-loyalty, module-not-installed:vc-module-loyalty |
| BL-LOY-016 | P0-revenue | — | no-coordinate |
| BL-LOY-017 | P0-revenue | — | no-coordinate |
| BL-LOY-018 | P0-revenue | — | no-coordinate |
| BL-LOY-019 | P0-revenue | — | no-coordinate |
| BL-PAY-001 | P0-revenue | Mutations.createOrderFromCart |  |
| BL-PAY-003 | P0-revenue | /account/orders, Mutations.createOrderFromCart, /cart | neighbour-observation |
| BL-PAY-004 | P0-revenue | /cart, /checkout/payment, Mutations.initializeCartPayment, Mutations.initializePayment | neighbour-observation |
| BL-WL-001 | P2-ux | — | no-coordinate |
| BL-WL-002 | P1-data | — | no-coordinate |
| BL-WL-003 | P1-data | — | no-coordinate |
| BL-WL-004 | P2-ux | — | no-coordinate |
| BL-WL-005 | P2-ux | — | no-coordinate |
| BL-WL-006 | P2-ux | — | no-coordinate |
| BL-SR-001 | P1-data | — | no-coordinate |
| BL-SR-002 | P0-security | — | no-coordinate |
| BL-SR-003 | P1-data | — | no-coordinate |
| BL-SR-004 | P1-data | — | no-coordinate |
| BL-SR-005 | P1-data | — | no-coordinate, module-not-installed:vc-module-sales-rep |
| BL-SR-006 | P1-data | — | no-coordinate, module-not-installed:vc-module-sales-rep |
| BL-SR-007 | P1-data | — | no-coordinate |
| BL-SR-008 | P1-data | — | no-coordinate |
| BL-SR-009 | P1-data | — | no-coordinate |
| BL-SR-010 | P1-data | — | no-coordinate |
| BL-SR-011 | P0-security | /company/dashboard, /company/my-customers, /company/my-customers/{orgId}, /company/sales-reps, /account/dashboard |  |
| BL-SR-012 | P2-ux | — | no-coordinate |
| BL-SR-013 | P2-ux | — | no-coordinate |
| BL-SR-014 | P1-data | POST /api/sales-rep/search, PUT /api/sales-rep | module-not-installed:vc-module-sales-rep |
| BL-SR-015 | P1-data | — | no-coordinate, module-not-installed:vc-module-sales-rep |
| BL-SR-016 | P1-data | — | no-coordinate, module-not-installed:vc-module-sales-rep |
| BL-SR-017 | P2-ux | — | no-coordinate, module-not-installed:vc-module-sales-rep |
| BL-SR-018 | P2-ux | — | no-coordinate, module-not-installed:vc-module-sales-rep |
| BL-SR-019 | P2-ux | — | no-coordinate, module-not-installed:vc-module-sales-rep |
| BL-SR-020 | P1-data | — | no-coordinate, module-not-installed:vc-module-sales-rep |
| BL-SR-021 | P0-security | — | no-coordinate, module-not-installed:vc-module-sales-rep |
| BL-SR-022 | P1-data | — | no-coordinate, module-not-installed:vc-module-sales-rep |
| BL-SR-023 | P1-data | — | no-coordinate, module-not-installed:vc-module-sales-rep |
| BL-SR-024 | P1-data | — | no-coordinate |
| BL-SR-025 | P1-data | — | no-coordinate |
| BL-SR-026 | P1-data | — | no-coordinate |
| BL-SR-027 | P2-ux | — | no-coordinate |
| BL-SR-028 | P2-ux | — | no-coordinate |
| BL-SR-029 | P2-ux | — | no-coordinate |
| BL-SR-030 | P2-ux | — | no-coordinate |
| BL-SR-031 | P2-ux | — | no-coordinate |
| BL-SR-032 | P2-ux | — | no-coordinate |
| BL-A11Y-001 | P1-data | — | no-coordinate |
| BL-A11Y-002 | P1-data | — | no-coordinate |
| BL-A11Y-003 | P1-data | — | no-coordinate |
| BL-A11Y-004 | P1-data | — | no-coordinate |
| BL-CR-001 | P1-data | — | no-coordinate |
| BL-CR-008 | P1-data | — | no-coordinate |
| BL-CR-009 | P2-ux | Query.canLeaveFeedback |  |
| BL-CR-010 | P1-data | — | no-coordinate |
| BL-CR-012 | P2-ux | — | no-coordinate |
| BL-CR-013 | P1-data | — | no-coordinate |
| BL-CR-016 | P1-data | — | no-coordinate |
| BL-CR-017 | P1-data | — | no-coordinate |
| BL-CR-018 | P0-security | — | no-coordinate |
| BL-PLAT-001 | P1-data | — | no-coordinate |
| BL-PLAT-002 | P1-data | — | no-coordinate |
| BL-PLAT-004 | P2-ux | — | no-coordinate |
| BL-STORE-001 | P1-data | — | no-coordinate |

## What a reader will and will not reach

`kb rules`, `kb rules <domain>` and `kb show BL-...` reach every one of them. The arrival hook
and `writtenNeighbours` reach the 49 that carry a coordinate.

`kb ask` does NOT. resolve.mjs loads the derived, captured and flow indexes and not the rules
index, so a question a rule answers returns the observations around it and never the rule. That
is arguably the design -- a rule is found by working in its domain, which is why the catalog has
no question column -- but "does a coupon apply to the sale price" is a question BL-CART-003
answers, and today it comes back without it. Deciding it belongs with the session hook and the
skill (A4, A6), and the shape that does not repeat the dead-weight failure is: rules in the
ranked list but in their own labelled block, after what somebody actually saw. 216 unattested
entries mixed into 100 observed ones would drown the half of the corpus that was earned.

Nothing written. 216 rule(s) would be captured. Pass --write.
