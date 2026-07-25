// Shared window CustomEvent names for site-wide overlay triggers that Footer.js
// (and eventually other components) fire, mirroring the existing
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

// Legacy: Product Page open/close hide/show-float-btns branch (32-javascript-all.js
// ~758-792). 19-product-full-page.html isn't converted yet (Priority 2), so
// FloatButtons.js listens for these now; the future ProductDetail component
// should dispatch them on open/close. No detail needed.
export const PP_OPEN_EVENT = 'vc:ppOpen';
export const PP_CLOSE_EVENT = 'vc:ppClose';

// Note: this file previously also had SRP_OPEN_EVENT / SRP_CLOSE_EVENT /
// SRP_TRIGGER_EVENT for a fixed-overlay version of the search-result page.
// The owner decided /srp (app/srp/) should be a real standalone route instead
// of an overlay, so those events had no remaining dispatcher or purpose and
// were removed — Navbar.js now opens search with a plain router.push('/srp?q=...').
