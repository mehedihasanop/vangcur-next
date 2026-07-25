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

// Legacy: closeSRP()/opening-SRP branch (32-javascript-all.js ~600-685) and the
// Product Page open/close hide/show-float-btns branch (~758-792). Neither
// 17-search-result-page.html nor 19-product-full-page.html is converted yet
// (Priority 2), so BackToTop.js / FloatButtons.js listen for these events now and
// the future SearchPage/ProductDetail components should dispatch them:
//   - SRP_OPEN_EVENT  detail: { bodyEl } — the SRP modal's scrollable container,
//     so BackToTop can mirror the legacy _srpScrollHandler(bodyEl) behavior
//   - SRP_CLOSE_EVENT / PP_OPEN_EVENT / PP_CLOSE_EVENT — no detail needed
export const SRP_OPEN_EVENT = 'vc:srpOpen';
export const SRP_CLOSE_EVENT = 'vc:srpClose';
export const PP_OPEN_EVENT = 'vc:ppOpen';
export const PP_CLOSE_EVENT = 'vc:ppClose';

// Legacy: viewAllSearch(q) -> openSRP(q) (32-javascript-all.js lines ~2978-2990).
// Fired by anything that wants to open the search-result-page overlay with a
// query — Navbar's Enter-key search and its dropdown's "সব ফলাফল দেখুন" button.
// SearchPage.js (17-search-result-page.html, Priority 2) is the sole listener;
// detail: { query }
export const SRP_TRIGGER_EVENT = 'vc:srpTrigger';
