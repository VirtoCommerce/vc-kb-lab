// THE BAR, SET BEFORE THE VARIANTS ARE RUN, and by hand. Three flows exist: placing an order
// (AFB2D3C5), creating a percentage-off promotion (EB228603), putting a coupon on one and applying
// it (A54C919F). For each real question from demand.jsonl that is ABOUT reaching one of those
// goals, the expected answer is that flow. Everything else must MISS -- including questions that
// merely travel through the same pages.
export const EXPECT = {
  // --- must hit: the question IS one of the three goals, however it is phrased
  'how do I place an order on the storefront from an empty cart': 'KB-AFB2D3C5',
  'place an order on the storefront as a signed-in customer': 'KB-AFB2D3C5',
  'place an order on the storefront and read it back in Admin': 'KB-AFB2D3C5',
  'place an order on the B2B storefront checkout and read the order totals': 'KB-AFB2D3C5',
  'place an order on the B2B storefront: add products to cart and complete checkout': 'KB-AFB2D3C5',
  'create a percentage-off promotion in the Admin Marketing module': 'KB-EB228603',
  'create a promotion in the Admin SPA marketing module': 'KB-EB228603',
  'create a percentage-off promotion in the Marketing module and make it active': 'KB-EB228603',
  // --- must MISS: a fact question, or a procedure no flow covers. Named individually rather than
  // by default, so the bar says what it means.
  'sign in to the Admin platform UI': null,
  'cancel a customer order from the Admin': null,
  'what happens to an order\u2019s shipment and payment when the order is cancelled': null,
  'what happens to an order\'s shipment and payment when the order is cancelled': null,
  'does the admin order screen show the same totals the storefront charged': null,
  'which money fields does an order line item carry with and without tax': null,
  'what fields does OrderShipmentType have': null,
  'what fields does OrderShipmentItemType have': null,
  'how does a configurable product become a line item in the cart': null,
  'what does validateCoupon return': null,
  'what does the addCoupon mutation accept and return': null,
  'what does the storefront GraphQL API expose for applying and validating a coupon on a cart': null,
  'which REST route searches catalog products by product type': null,
  'What fields does InputCreateWishlistType have?': null,
  'does the order discount carry a percent or only an amount': null,
  'what happens to an existing cart when its promotion is edited': null,
  'why is the shipping cost zero on this store': null,
  'Which endpoints does this deployment serve under /api/marketing/promotions': null,
};
// Deliberately NOT in the bar, because I cannot honestly call them either way and a bar written to
// be met is not a bar: "where is the checkout" (the order flow answers it outright, and the word
// appears in no goal), "how do I add a variation to the cart", "how do I search the catalog for
// products by keyword". They are reported separately.
export const BORDERLINE = [
  'where is the checkout',
  'how do I add a variation to the cart',
  'how do I search the catalog for products by keyword',
];
