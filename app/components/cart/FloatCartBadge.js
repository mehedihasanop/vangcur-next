'use client';

import { useEffect, useRef, useState } from 'react';
import { getCart, cartCount, CART_EVENT, CART_ADD_EVENT } from '@/lib/cartData';
import { OPEN_CART_EVENT } from '@/lib/uiEvents';

// Converted from 32-javascript-all.js:
// - showFloatCart() / updateCartUI()'s #floatCartBtn half (lines ~1092-1102, ~1113-1120)
// - _triggerCartJiggle()'s #floatCartBtn half (lines ~1104-1111) — the #cartDot half
//   already lives in Navbar.js, same ref+classList+reflow technique mirrored here
//   for consistency (see that file's own header note, now outdated since this exists)
// Markup source: 35-floating-cart-badge.html
//
// Route scope: legacy hid this while #srpOverlay was open (search used to be a
// same-page overlay with its own header). /srp is now a real route with NO cart
// affordance of its own — grep confirms SearchPageClient.js has no cart icon, and
// SRPProductCard's "🛒 কার্ট" button only dispatches QUICK_CART_EVENT to add, never
// opens the drawer. Same story for /product/[slug]. Reproducing the SRP-hide
// behavior here would leave visitors on those routes with no way at all to open
// the cart drawer, so this is mounted globally (GlobalOverlays.js, every route)
// instead — flag to the owner if the old hide-on-search behavior is actually
// wanted back once /srp gets its own cart icon.
//
// Legacy toggled `btn.style.display` directly (no CSS .show class exists for
// .float-cart-btn — verified via grep) and used a separate .float-cart-auto-hide
// fade-out class right before hiding. Both collapse into one thing here: this
// component simply doesn't render once cartCount is 0, so CSS's own mount
// animation (floatCartIn) replays naturally whenever the count goes back above 0 —
// same visual result as the auto-hide/re-show pair, no extra timer needed since
// React mount/unmount already replaces the inline-style toggle.

export default function FloatCartBadge() {
  const [count, setCount] = useState(0);
  const btnRef = useRef(null);

  useEffect(() => {
    setCount(cartCount(getCart()));
    const onChange = (e) => setCount(cartCount(e.detail?.cart ?? getCart()));
    window.addEventListener(CART_EVENT, onChange);
    return () => window.removeEventListener(CART_EVENT, onChange);
  }, []);

  // Legacy: _triggerCartJiggle()'s #floatCartBtn half — remove+reflow+add so the
  // animation can replay even mid-shake from a rapid second add.
  useEffect(() => {
    const onAdd = () => {
      const btn = btnRef.current;
      if (!btn) return;
      btn.classList.remove('cart-jiggle');
      void btn.offsetWidth;
      btn.classList.add('cart-jiggle');
      clearTimeout(btn._jiggleTimer);
      btn._jiggleTimer = setTimeout(() => btn.classList.remove('cart-jiggle'), 750);
    };
    window.addEventListener(CART_ADD_EVENT, onAdd);
    return () => window.removeEventListener(CART_ADD_EVENT, onAdd);
  }, []);

  if (count <= 0) return null;

  return (
    <div
      className="float-cart-btn"
      id="floatCartBtn"
      ref={btnRef}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))}
      style={{ display: 'block' }}
    >
      <div className="float-cart-inner">
        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        <span className="float-cart-badge" id="floatCartCount">{count}</span>
      </div>
    </div>
  );
}
