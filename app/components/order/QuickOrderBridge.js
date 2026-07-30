'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  DEFAULT_PRODS, QUICK_ORDER_EVENT, fetchCustomProducts, mergeCustomProducts,
} from '@/lib/productData';

// Fixes a real bug: ProductCard.js, ProductDetailClient.js, SRPProductCard.js, and
// WishlistDrawer.js's "⚡ অর্ডার করুন" / "এখনই অর্ডার করুন" buttons all dispatch
// QUICK_ORDER_EVENT (detail: { id, qty? }) — mirroring the "dispatch now, wire a
// listener later" pattern used for QUICK_CART_EVENT (see CartSidebar.js) — but no
// listener for QUICK_ORDER_EVENT existed anywhere in the codebase, so clicking any
// of those buttons silently did nothing while visiting /checkout directly worked
// fine (it's an unrelated route). This component is that missing listener.
//
// Legacy: orderNow()'s empty-cart branch (32-javascript-all.js ~7702-7712) —
// `orderItems=[{...curProd,qty:curQty,emoji:...}]` then opens the order overlay
// directly, bypassing the persistent `cart` array entirely. That orderItems vs cart
// distinction doesn't exist yet in app/checkout/page.js (which only ever reads the
// persistent `vc_cart` localStorage key) — rather than rebuild that page's item-
// sourcing architecture, this stores the single quick-order item under a separate,
// one-time sessionStorage key ('vc_quick_order_items') that checkout/page.js should
// check first on mount (and clear immediately after reading), falling back to
// vc_cart otherwise. See the mount-effect change in app/checkout/page.js.
//
// Mounted once in the root layout (app/layout.js) so it's active on every route that
// can dispatch QUICK_ORDER_EVENT (/, /srp, /product/[slug]) — not just the home page.
//
// UPDATE: CartSidebar.js's checkout() had the identical "dispatch, no listener"
// bug (a dead CART_CHECKOUT_EVENT). That's since been fixed directly in
// CartSidebar.js with a router.push('/checkout') — no bridge component needed
// there, since the full cart is already persisted to the 'vc_cart' localStorage
// key that /checkout's mount effect reads as its fallback.

export default function QuickOrderBridge() {
  const router = useRouter();
  const prodsRef = useRef(DEFAULT_PRODS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const customRows = await fetchCustomProducts(supabase);
      if (!cancelled && customRows.length) {
        prodsRef.current = mergeCustomProducts(DEFAULT_PRODS, customRows);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onQuickOrder = (e) => {
      const { id, qty } = e.detail || {};
      if (id === undefined) return;
      const prod = prodsRef.current.find((p) => String(p.id) === String(id));
      if (!prod || prod.stock <= 0) return;

      // Legacy: orderItems=[{...curProd,qty:curQty,emoji:(curProd.imgs||['📦'])[0]}]
      const item = { ...prod, qty: qty || 1, emoji: (prod.imgs || ['📦'])[0] };
      try {
        sessionStorage.setItem('vc_quick_order_items', JSON.stringify([item]));
      } catch (err) { /* noop */ }
      router.push('/checkout');
    };

    window.addEventListener(QUICK_ORDER_EVENT, onQuickOrder);
    return () => window.removeEventListener(QUICK_ORDER_EVENT, onQuickOrder);
  }, [router]);

  return null;
}
