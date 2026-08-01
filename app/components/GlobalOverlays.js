'use client';

import { useEffect, useState } from 'react';
import CartSidebar from './cart/CartSidebar';
import WishlistDrawer from './cart/WishlistDrawer';
import FloatCartBadge from './cart/FloatCartBadge';
import FloatWishBadge from './cart/FloatWishBadge';
import OfferPopup from './modals/OfferPopup';
import OfferPageOverlay from './modals/OfferPageOverlay';
import RecoveryToast from './modals/RecoveryToast';
import BackInStockToast from './modals/BackInStockToast';
import MembershipModal from './modals/MembershipModal';
import InvoiceModal from './modals/InvoiceModal';
import StockNotifyModal from './modals/StockNotifyModal';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT } from '@/lib/uiEvents';

// Bug fix (2026-07-31): the `#toast` div + CartSidebar + WishlistDrawer used to be
// rendered inside app/ClientHome.js only, which is exclusively the homepage's tree.
// /product/[slug] (ProductDetailClient.js) and /srp (SearchPageClient.js) are
// separate routes with no site Navbar/Footer (owner's decision, matching legacy's
// pp-overlay/srp having their own header) — but they still call showToast() and
// still dispatch QUICK_CART_EVENT/toggleWish() the exact same way ProductCard.js
// does. With nothing mounting #toast/CartSidebar/WishlistDrawer on those routes,
// every toast on those pages silently no-op'd (showToast() finds no #toast node)
// and "কার্টে যোগ" there did nothing at all (no CartSidebar listening for
// QUICK_CART_EVENT). /checkout has the same missing-#toast problem for its own
// error/warning toasts.
//
// Fix: this component is mounted once in the root layout (app/layout.js), the same
// tier as QuickOrderBridge — outside any single page's tree, so it's present on
// every route without being remounted on navigation between them (React/Next.js
// keeps the root layout instance alive across route changes).
//
// Navbar (still only rendered inside ClientHome.js — /product and /srp still have
// no site chrome, that owner decision is untouched) can no longer own the drawers'
// isOpen state directly, since that state now lives here, one level up. It instead
// dispatches OPEN_CART_EVENT/OPEN_WISHLIST_EVENT (see ClientHome.js), which this
// component listens for.

export default function GlobalOverlays() {
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);

  useEffect(() => {
    const onOpenCart = () => setCartOpen(true);
    const onOpenWish = () => setWishOpen(true);
    window.addEventListener(OPEN_CART_EVENT, onOpenCart);
    window.addEventListener(OPEN_WISHLIST_EVENT, onOpenWish);
    return () => {
      window.removeEventListener(OPEN_CART_EVENT, onOpenCart);
      window.removeEventListener(OPEN_WISHLIST_EVENT, onOpenWish);
    };
  }, []);

  return (
    <>
      <div className="toast" id="toast"></div>
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer isOpen={wishOpen} onClose={() => setWishOpen(false)} />
      {/* 35-floating-cart-badge.html (2026-07-31) — see its own header note on why
          this is global (every route), diverging from legacy's SRP-hide behavior. */}
      <FloatCartBadge />
      {/* 36-floating-wishlist-badge.html (2026-07-31) — same reasoning as
          FloatCartBadge above; triggered by WISH_ADD_EVENT (lib/productData.js). */}
      <FloatWishBadge />
      {/* 33-offer-popup-modal.html (2026-07-31) — self-contained: fetches its own
          config/products and runs its own auto-show timer, unlike CartSidebar/
          WishlistDrawer above which are opened by OPEN_CART_EVENT/OPEN_WISHLIST_EVENT. */}
      <OfferPopup />
      {/* 34-offer-page-overlay.html (2026-07-31) — self-contained like OfferPopup,
          but opens via OPEN_OFFER_PAGE_EVENT (Footer.js's "📢 চলতি অফারসমূহ" button,
          already dispatching into the void until now) instead of a timer. */}
      <OfferPageOverlay />
      {/* 41-back-in-stock-toast.html (2026-08-01) — self-contained like OfferPopup:
          runs its own delayed scan (no open-event needed), same 4000ms delay legacy's
          _scheduleNotificationToasts used. Mounted *before* RecoveryToast below on
          purpose — legacy's scheduler always checked this one first, and mount order
          here determines which component's setTimeout registers (and so fires) first;
          see lib/notificationQueue.js for the full coordination mechanism that
          preserves that ordering now that they're two separate components. */}
      <BackInStockToast />
      {/* 38-abandoned-draft-recovery-toast.html (2026-07-31) — self-contained
          like OfferPopup: reads localStorage on a delay, no open-event needed.
          Hides itself while on /checkout (see its own header note). Now defers to
          BackInStockToast above via lib/notificationQueue.js — see that file's and
          this component's header notes. */}
      <RecoveryToast />
      {/* 39-membership-progress-modal.html (2026-07-31) — self-contained like
          OfferPopup above: owns its own open/close state, listens for
          OPEN_MEMBERSHIP_EVENT (dispatched by AccountPage.js's membership stat-box
          with detail: { completedCount }). Global here so it works wherever
          AccountPage.js happens to be mounted (today: only reachable via /checkout —
          see VANGCUR_MASTER_PROMPT.md Priority 0, AccountPage.js isn't mounted on the
          homepage yet, unrelated to this section). */}
      <MembershipModal />
      {/* InvoiceModal.js (2026-08-01) — the last piece GENERATE_INVOICE_EVENT
          dispatchers (BgConfirmPopup.js, WaitingPage.js, OrderTracking.js,
          AccountPage.js) were waiting on. Self-contained like MembershipModal above:
          owns its own open/close state, listens for GENERATE_INVOICE_EVENT itself.
          Global here for the same reason as everything else in this file — reachable
          from every route that can dispatch that event. */}
      <InvoiceModal />
      {/* 40-stock-notify-modal.html (2026-08-01) — self-contained like MembershipModal
          above: owns its own open/close state, listens for STOCK_NOTIFY_EVENT itself
          (dispatched with detail: { id, name } by ProductCard.js, SRPProductCard.js,
          and ProductDetailClient.js's "স্টকে আসলে জানান" button — all three previously
          firing into the void per lib/productData.js's own comment). Global here so
          it's reachable from all three routes at once, same reasoning as everything
          else in this file. */}
      <StockNotifyModal />
    </>
  );
}
