// Shared window CustomEvent names for site-wide overlay triggers that Footer.js
// (and eventually Navbar.js / other components) fire, mirroring the existing
// vc:categoryFilter / vc:openProduct / vc:quickOrder pattern in categoryData.js
// and productData.js.
//
// Legacy: these correspond to openAcc(), openTrackOrder(), openOfferPage(), and
// openInfo(type) in 32-javascript-all.js. Those functions open modals/overlays that
// belong to later, not-yet-converted sections per VANGCUR_MASTER_PROMPT.md:
//   - openAcc()         -> 21-login-modal.html / 22-account-page.html  (Priority 2)
//   - openTrackOrder()  -> 28-order-tracking-modal.html                (Priority 3)
//   - openOfferPage()   -> 34-offer-page-overlay.html                  (Priority 4)
//   - openInfo(type)    -> 30-policy-modal.html / 29-info-overlay.html (Priority 4)
// Until those components exist, Footer.js dispatches these events into the void
// (no listener yet) rather than crash-calling undefined globals. When each modal
// component is built, it should add a `window.addEventListener(EVENT, handler)`
// for the matching event below.

export const OPEN_ACCOUNT_EVENT = 'vc:openAccount';
export const OPEN_TRACK_ORDER_EVENT = 'vc:openTrackOrder';
export const OPEN_OFFER_PAGE_EVENT = 'vc:openOfferPage';
export const OPEN_INFO_EVENT = 'vc:openInfo'; // detail: { type: 'shipping'|'returns'|'privacy'|'terms' }

// Bug fix (2026-07-31): CartSidebar/WishlistDrawer used to be mounted inside
// ClientHome.js only, so the cart/wishlist icons (and the "কার্টে যোগ"/wishlist-add
// actions themselves, via QUICK_CART_EVENT/toggleWish) only worked on the homepage —
// /product/[slug], /srp, /checkout dispatch those same events/calls but had nothing
// listening. Moved to app/components/GlobalOverlays.js, mounted once in the root
// layout (app/layout.js) alongside QuickOrderBridge, so they work on every route.
// Navbar (only rendered inside ClientHome today, by design — /product and /srp have
// no site chrome) dispatches these to open the drawers rather than owning the
// isOpen state itself, since that state now lives one level up, outside ClientHome's
// own component tree.
export const OPEN_CART_EVENT = 'vc:openCart';
export const OPEN_WISHLIST_EVENT = 'vc:openWishlist';

// --- Order-waiting flow (25-waiting-page.html / app/components/order/WaitingPage.js) ---
// Legacy: order placement (not-yet-built OrderForm.js, ~18-checkout section) inserts
// the order then directly manipulates #waitOverlay DOM (32-javascript-all.js lines
// ~4990-5044). Converted as an event so OrderForm.js and WaitingPage.js can be built
// independently: OrderForm.js dispatches this once the Supabase insert succeeds.
// detail: { orderId, orderNum, isGuest }
export const OPEN_WAIT_OVERLAY_EVENT = 'vc:openWaitOverlay';

// Legacy: showBgConfirmPopup(order) — 32-javascript-all.js line ~5766. This is the
// *actual* "order confirmed" UI in the live site (not the dormant #waitConfirmed panel
// inside wait-overlay itself — see the verification note in WaitingPage.js). Belongs to
// a not-yet-built ConfirmPopup component. detail: { order }
export const SHOW_BG_CONFIRM_EVENT = 'vc:showBgConfirmPopup';

// Legacy: genInvoice(o) — 32-javascript-all.js line ~5851 (PDF invoice generation,
// not yet converted). detail: { orderId, order, ctx? } — order is included when the
// caller already has the full object in hand (e.g. BgConfirmPopup.js), so the future
// invoice component doesn't need a redundant Supabase fetch; order may be omitted
// otherwise. `ctx` mirrors legacy's dlInvoiceById(id, callerCtx)/invBackBtn's
// callerCtx check (~1670-1678): OrderTracking.js sets ctx:'track' so the future
// InvoiceModal.js's back-button can skip showing PostOrderInfo (see its header note)
// for invoices reopened from order tracking, same as legacy did for callerCtx==='track'.
// Omitted (as BgConfirmPopup.js/WaitingPage.js still do) it means "fresh post-checkout
// invoice" — the default branch that does show PostOrderInfo.
export const GENERATE_INVOICE_EVENT = 'vc:generateInvoice';

// Legacy: openOrder(false) — reopens the checkout form (not-yet-built OrderForm.js),
// used by the Rejected state's "আবার চেষ্টা করুন" button. detail: { warn: boolean }
export const OPEN_ORDER_FORM_EVENT = 'vc:openOrderForm';

// Legacy: invBackBtn onclick's default branch (32-javascript-all.js ~1670-1678) —
// after the not-yet-built InvoiceModal.js closes, if callerCtx is neither 'acc' nor
// 'track' (i.e. this was a fresh post-checkout invoice, not one reopened from the
// account page or order tracking), it shows #postOverlay. PostOrderInfo.js (27-post-
// order-info.html) listens for this event; InvoiceModal.js should dispatch it in that
// default branch once built. No detail needed.
export const SHOW_POST_ORDER_INFO_EVENT = 'vc:showPostOrderInfo';
