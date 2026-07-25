'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts,
} from '@/lib/productData';
import {
  getCart, saveCart, cartTotal, addToCart, updateQty, removeItem,
  CART_EVENT, CART_ADD_EVENT, CART_CHECKOUT_EVENT, clearCartOnRealPagehide,
} from '@/lib/cartData';
import { QUICK_CART_EVENT } from '@/lib/productData';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';

// Converted from 32-javascript-all.js:
// - openCart()/closeCart() (lines ~1174-1176) -> isOpen/onClose props, same as
//   WishlistDrawer.js. The legacy _pauseHeroSlider()/_pushPanel('cart') panel-stack
//   coordination was never ported for WishlistDrawer either (that infrastructure
//   doesn't exist in this codebase — lockBody/unlockBody is the whole story here),
//   so this doesn't add it either, for consistency.
// - renderCartItems() (lines ~1121-1140) -> JSX below, using the real .cart-item/
//   .ci-* classes from globals.css instead of the legacy's hardcoded inline
//   "প্রোডাক্ট দেখুন" button styles.
// - updQty()/remItem() -> lib/cartData.js's updateQty()/removeItem() (debounced
//   storage write); this component updates its own state immediately for
//   instant UI feedback and lets the debounce only govern the localStorage write.
// - checkout() (lines ~1168-1173) -> dispatches CART_CHECKOUT_EVENT with a copy of
//   the cart (legacy's orderItems array) instead of calling openOrder(false)
//   directly, since 23-order-overlay.html (OrderForm.js) isn't built yet — same
//   "dispatch now, wire a listener later" pattern as QUICK_ORDER_EVENT.
// - addToCart()'s stock-clamp logic -> lib/cartData.js's addToCart(); this
//   component listens for QUICK_CART_EVENT (dispatched by ProductCard,
//   SRPProductCard, WishlistDrawer) to actually call it, since those components
//   only carry a product id, not the full stock-aware product record.
// - _triggerCartJiggle()'s #floatCartBtn half is skipped: #floatCartBtn/
//   #floatCartCount belong to a floating cart button that isn't part of
//   20-cart-sidebar.html and hasn't been built yet (FloatButtons.js today is
//   WhatsApp/Messenger only). The #cartDot half (Navbar's cart icon) is wired
//   in Navbar.js instead, which listens for CART_ADD_EVENT directly.
// Markup source: 20-cart-sidebar.html
//
// Note: stock numbers here come from one fetch on mount (defaults + custom_products),
// not a live realtime subscription like ProductGrid.js keeps — a cart-open action is
// user-initiated and infrequent enough that a few-seconds-stale stock number is an
// acceptable trade-off against running a second full realtime channel just for this.

function CartImg({ emoji }) {
  const [broken, setBroken] = useState(false);
  const isUrl = typeof emoji === 'string' && (emoji.startsWith('http://') || emoji.startsWith('https://'));
  if (!emoji) return <span style={{ fontSize: 22 }}>📦</span>;
  if (isUrl && !broken) {
    return (
      <img
        src={emoji}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9, display: 'block' }}
        onError={() => setBroken(true)}
      />
    );
  }
  if (isUrl && broken) return <span style={{ fontSize: 22 }}>📦</span>;
  return <span style={{ fontSize: 22 }}>{emoji}</span>;
}

export default function CartSidebar({ isOpen, onClose }) {
  const [cart, setCart] = useState([]);
  const prodsRef = useRef(DEFAULT_PRODS);

  // Load cart on mount + stay in sync with any saveCart() call (this component's
  // own actions, or a future component that touches the same cart)
  useEffect(() => {
    setCart(getCart());
    const handler = (e) => setCart(e.detail?.cart ?? getCart());
    window.addEventListener(CART_EVENT, handler);
    return () => window.removeEventListener(CART_EVENT, handler);
  }, []);

  // Legacy: pagehide listener's cart-clearing half
  useEffect(() => clearCartOnRealPagehide(), []);

  // Fetch product list once, for stock-limit checks only (see note above)
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

  // Legacy: addToCart(id, qty) — triggered by ProductCard/SRPProductCard/WishlistDrawer's
  // "🛒 কার্টে যোগ" buttons, which only dispatch an id (see productData.js comment)
  useEffect(() => {
    const onQuickCart = (e) => {
      const id = e.detail?.id;
      if (id === undefined) return;
      const res = addToCart(prodsRef.current, id, 1);
      if (res.ok) showToast('✅ কার্টে যোগ হয়েছে');
      else if (res.reason === 'stock') showToast('❌ স্টক শেষ!');
    };
    window.addEventListener(QUICK_CART_EVENT, onQuickCart);
    return () => window.removeEventListener(QUICK_CART_EVENT, onQuickCart);
  }, []);

  // Legacy: openCart()/closeCart() -> lockBody()/unlockBody()
  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
  }, [isOpen]);

  const handleQty = (id, delta) => {
    const res = updateQty(prodsRef.current, id, delta);
    if (!res.ok && res.reason === 'stock') {
      showToast(`❌ সর্বোচ্চ স্টক সীমায় পৌঁছে গেছে (${res.maxStock}টি)`);
      return;
    }
    setCart(res.cart);
  };

  const handleRemove = (id) => {
    setCart(removeItem(id));
  };

  // Legacy: checkout()
  const handleCheckout = () => {
    if (!cart.length) { showToast('কার্ট খালি!'); return; }
    onClose();
    window.dispatchEvent(new CustomEvent(CART_CHECKOUT_EVENT, { detail: { items: cart.map((i) => ({ ...i })) } }));
  };

  const goToProducts = () => {
    onClose();
    document.getElementById('prodSec')?.scrollIntoView({ behavior: 'smooth' });
  };

  const total = cartTotal(cart);

  return (
    <>
      <div className={`cart-back${isOpen ? ' on' : ''}`} id="cartBack" onClick={onClose} />
      <div className={`cart-side${isOpen ? ' open' : ''}`} id="cartSide">
        <div className="cart-head">
          <h3>🛒 আপনার কার্ট</h3>
          <button className="cart-x" onClick={onClose}>✕</button>
        </div>
        <div className="cart-body" id="cartBody">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div style={{ fontSize: 44, marginBottom: 10 }}>🛒</div>
              <p style={{ marginBottom: 16 }}>আপনার কার্ট খালি</p>
              <button
                onClick={goToProducts}
                style={{
                  background: 'var(--dark)', color: '#fff', border: 'none', padding: '10px 22px',
                  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                প্রোডাক্ট দেখুন →
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="ci-img"><CartImg emoji={item.emoji} /></div>
                <div className="ci-info">
                  <div className="ci-name">{item.name}</div>
                  <div className="ci-price">৳{(item.price * item.qty).toLocaleString()}</div>
                  <div className="ci-qty-row">
                    <button className="ci-q-btn" onClick={() => handleQty(item.id, -1)}>−</button>
                    <span className="ci-q-num">{item.qty}</span>
                    <button className="ci-q-btn" onClick={() => handleQty(item.id, 1)}>+</button>
                    <button className="ci-remove" onClick={() => handleRemove(item.id)}>সরান</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="cart-foot" id="cartFoot">
            <div className="cart-total-row"><span>সর্বমোট:</span><span id="cartTotal">৳{total.toLocaleString()}</span></div>
            <button className="btn-checkout" onClick={handleCheckout}>চেকআউট করুন →</button>
          </div>
        )}
      </div>
    </>
  );
}
