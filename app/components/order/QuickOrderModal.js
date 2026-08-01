'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts, QUICK_ORDER_MODAL_EVENT } from '@/lib/productData';
import { getCart, cartTotal, updateQty, removeItem, CART_EVENT } from '@/lib/cartData';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';

// THE MISSING FILE (2026-08-01): GlobalOverlays.js already imported and rendered
// this component (`import QuickOrderModal from './order/QuickOrderModal'`), but the
// file itself was never created — every build since that commit failed outright
// (`Module not found: Can't resolve './order/QuickOrderModal'`), which meant Vercel
// kept serving whatever the last *successful* deploy was instead of today's code.
// That's why "অর্ডার" did nothing on the live site: QuickOrderBridge.js dispatches
// QUICK_ORDER_MODAL_EVENT correctly when the cart already has items, but nothing was
// listening for it (see QuickOrderBridge.js's own header note on that branch).
//
// Converted from 32-javascript-all.js: showQuickOrderModal()/closeQuickOrderModal()/
// qoUpdateTotals()/qoQty()/qoRemove()/qoCheckout()/buildModalItemHTML() (lines
// ~7791-7877, index_-_2026-07-20T073846_687.html reference upload). Legacy built this
// whole thing as one hand-rolled `<div style="...">` tree with no CSS classes at all
// (unlike CartSidebar.js's .cart-side/.ci-* classes) — ported 1:1 with the same inline
// styles rather than inventing new classes for something the legacy source itself
// never gave classes to.
//
// State/actions reuse lib/cartData.js (getCart/updateQty/removeItem/cartTotal) —
// same module CartSidebar.js already uses — instead of re-deriving qoQty/qoRemove's
// localStorage-touching logic a second time. qoCheckout() -> router.push('/checkout'),
// same as CartSidebar.js's handleCheckout (the persisted 'vc_cart' key is already the
// source of truth /checkout reads).
//
// Self-contained like MembershipModal.js/StockNotifyModal.js: owns its own open
// state, listens for QUICK_ORDER_MODAL_EVENT (no detail — just re-reads getCart()).

function ModalItemImg({ emoji }) {
  const [broken, setBroken] = useState(false);
  const isUrl = typeof emoji === 'string' && (emoji.startsWith('http://') || emoji.startsWith('https://'));
  if (!emoji) return <span style={{ fontSize: 30 }}>📦</span>;
  if (isUrl && !broken) {
    return (
      <img
        src={emoji}
        alt=""
        style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 8, display: 'block' }}
        onError={() => setBroken(true)}
      />
    );
  }
  return <span style={{ fontSize: 30 }}>{emoji}</span>;
}

export default function QuickOrderModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState([]);
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
    const onOpen = () => { setCart(getCart()); setIsOpen(true); };
    window.addEventListener(QUICK_ORDER_MODAL_EVENT, onOpen);
    return () => window.removeEventListener(QUICK_ORDER_MODAL_EVENT, onOpen);
  }, []);

  // Stay in sync with any other cart-touching component (CartSidebar, FloatCartBadge, ...)
  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => setCart(e.detail?.cart ?? getCart());
    window.addEventListener(CART_EVENT, handler);
    return () => window.removeEventListener(CART_EVENT, handler);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) lockBody(); else unlockBody();
  }, [isOpen]);

  // Legacy: qoQty(-1)/qoRemove() both auto-close the modal once the cart empties out
  useEffect(() => {
    if (isOpen && cart.length === 0) setIsOpen(false);
  }, [isOpen, cart.length]);

  const close = () => setIsOpen(false);

  const handleQty = (id, delta) => {
    const res = updateQty(prodsRef.current, id, delta);
    if (!res.ok && res.reason === 'stock') {
      showToast(`❌ সর্বোচ্চ স্টক সীমায় পৌঁছে গেছে (${res.maxStock}টি)`);
      return;
    }
    setCart(res.cart);
  };

  const handleRemove = (id) => setCart(removeItem(id));

  const checkout = () => {
    if (!cart.length) { showToast('কার্ট খালি!'); return; }
    setIsOpen(false);
    router.push('/checkout');
  };

  if (!isOpen) return null;

  const total = cartTotal(cart);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'slideUp .28s ease',
      }}
      >
        <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>🛒 শপিং কার্ট</div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{cart.length}টি প্রোডাক্ট নির্বাচিত</div>
          </div>
          <button
            onClick={close}
            style={{ background: 'var(--light)', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '0 18px' }}>
          {cart.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ minWidth: 40, textAlign: 'center', paddingTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ModalItemImg emoji={item.emoji} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>৳{item.price.toLocaleString()} / পিস</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7 }}>
                  <button
                    onClick={() => handleQty(item.id, -1)}
                    style={{ background: 'var(--light)', border: '1.5px solid var(--border)', borderRadius: 7, width: 28, height: 28, fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dark)', flexShrink: 0 }}
                  >
                    −
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                  <button
                    onClick={() => handleQty(item.id, 1)}
                    style={{ background: 'var(--light)', border: '1.5px solid var(--border)', borderRadius: 7, width: 28, height: 28, fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dark)', flexShrink: 0 }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', gap: 10, flexShrink: 0, paddingTop: 2 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', whiteSpace: 'nowrap' }}>৳{(item.price * item.qty).toLocaleString()}</div>
                <button
                  onClick={() => handleRemove(item.id)}
                  title="সরান"
                  style={{ background: '#FEF2F2', border: 'none', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="14" height="14" fill="none" stroke="#E63946" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 18px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
            <span>মোট:</span><span style={{ color: 'var(--dark)' }}>৳{total.toLocaleString()}</span>
          </div>
          <button
            onClick={checkout}
            style={{ width: '100%', background: 'var(--dark)', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
          >
            ⚡ অর্ডার নিশ্চিত করুন
          </button>
          <button
            onClick={close}
            style={{ width: '100%', background: 'none', border: '1.5px solid var(--border)', borderRadius: 12, padding: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", marginTop: 8 }}
          >
            কেনাকাটা চালিয়ে যান
          </button>
        </div>
      </div>
    </div>
  );
}
