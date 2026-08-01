'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getWishlist, saveWishlist, WISHLIST_EVENT, productHref,
  QUICK_ORDER_EVENT, QUICK_CART_EVENT,
} from '@/lib/productData';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';

// Converted from 32-javascript-all.js:
// - getWishlist/saveWishlist/isWishlisted/toggleWish already live in lib/productData.js
//   (shared with ProductCard.js / SRPProductCard.js) — not re-implemented here.
// - openWishlist()/closeWishlist() (lines ~1235-1254) -> isOpen/onClose props. ClientHome
//   owns the open state, same pattern CartDrawer/LoginModal will use later.
// - renderWishlist() (lines ~1255-1282) -> JSX below. Verified against globals.css:
//   .wl-item/.wl-img/.wl-info/.wl-name/.wl-price/.wl-btn/.wl-add/.wl-order-btn/.wl-rem
//   all already exist there with the right colors/hover states (incl. .wl-rem:hover),
//   so this uses those classes directly instead of the hardcoded inline styles +
//   onmouseover/onmouseout the raw extraction had — same visual result, matches the
//   "keep legacy CSS exact, don't reinvent it in JS" rule. No opacity:0/vc-visible
//   reveal-gating on any of these classes, so no IntersectionObserver needed here.
// - removeFromWishlistInModal() (lines ~1274-1282) -> removeItem() below. Legacy also
//   called renderProds(PRODS) to un-heart the product grid; ProductCard.js/
//   SRPProductCard.js now listen for WISHLIST_EVENT themselves to do the same thing,
//   so this component doesn't need to reach into them directly.
// - openPPFromWishlist(id) -> router.push(productHref(item)). 19-product-full-page.html
//   is now a real route (app/product/[slug]/, owner's decision), so this just navigates
//   there instead of dispatching into an overlay — same change made in ProductCard.js
//   and SRPProductCard.js.
// - "🛒 কার্টে যোগ" -> dispatches QUICK_CART_EVENT (same event ProductCard/SRPProductCard
//   use for their cart-icon button). 20-cart-sidebar.html isn't built yet either.
// - "⚡ অর্ডার করুন" -> closes the drawer + dispatches QUICK_ORDER_EVENT with {id}. Legacy
//   built a one-off orderItems=[{...p, qty:1}] array and called openOrder(false) directly;
//   23-order-overlay.html (OrderForm.js) isn't built yet, so it can build that array
//   itself from the id when it adds a listener later.
// - syncWishlistFromSupabase/saveWishlistToSupabase (lines ~1162-1188) are the cross-device-sync
//   half — not converted here. Now that 21-login-modal.html is built, that sync lives in
//   app/components/auth/LoginModal.js (listens for WISHLIST_EVENT + calls saveWishlistToSupabase
//   whenever a user is signed in), not here — this drawer doesn't need to know about auth at all.
//   The `wishlists` realtime subscription (lines ~560-567, cross-tab/device live updates while
//   this drawer is open) still isn't converted — genuinely deferred, not just relocated.
// Markup/behavior source: 18-wishlist-overlay.html section extraction

function WishImg({ emoji }) {
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

export default function WishlistDrawer({ isOpen, onClose }) {
  const router = useRouter();
  const [items, setItems] = useState([]);

  // Load on mount + stay in sync with adds/removes from ProductCard, SRPProductCard, etc.
  useEffect(() => {
    setItems(getWishlist());
    const handler = (e) => setItems(e.detail?.wishlist ?? getWishlist());
    window.addEventListener(WISHLIST_EVENT, handler);
    return () => window.removeEventListener(WISHLIST_EVENT, handler);
  }, []);

  // Legacy: openWishlist()/closeWishlist() called lockBody()/unlockBody() (iOS scroll fix)
  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
  }, [isOpen]);

  // Legacy: openPPFromWishlist(id) -> PRODUCT_OPEN_EVENT dispatch into the pp-overlay.
  // Now that 19-product-full-page.html is a real route (owner's decision), navigate
  // straight there. `item` already carries {id, name}, enough for productHref()'s slug.
  const openProduct = (item) => {
    onClose();
    router.push(productHref(item));
  };

  // Empty-state CTA (audit fix) — same pattern as CartSidebar's goToProducts.
  const goToProducts = () => {
    onClose();
    document.getElementById('prodSec')?.scrollIntoView({ behavior: 'smooth' });
  };

  const addToCart = (id) => {
    window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id } }));
    showToast('✅ কার্টে যোগ হয়েছে');
  };

  const orderNow = (id) => {
    onClose();
    window.dispatchEvent(new CustomEvent(QUICK_ORDER_EVENT, { detail: { id } }));
  };

  const removeItem = (id) => {
    saveWishlist(getWishlist().filter((x) => String(x.id) !== String(id)));
    showToast('Wishlist থেকে সরানো হয়েছে');
  };

  return (
    <div className={`wishlist-overlay${isOpen ? ' show' : ''}`} id="wishlistOverlay">
      <div className="wishlist-box">
        <div className="wishlist-head">
          <h3>❤️ আমার Wishlist</h3>
          <button className="cart-x" onClick={onClose}>✕</button>
        </div>
        <div className="wishlist-body" id="wishlistBody">
          {items.length === 0 ? (
            <div className="wl-empty">
              <div style={{ fontSize: 44, marginBottom: 10 }}>🤍</div>
              <p style={{ marginBottom: 16 }}>আপনার Wishlist খালি</p>
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
            items.map((item) => (
              <div className="wl-item" id={`wli_${item.id}`} key={item.id}>
                <div
                  className="wl-img"
                  onClick={() => openProduct(item)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <WishImg emoji={item.emoji} />
                </div>
                <div className="wl-info" style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="wl-name"
                    onClick={() => openProduct(item)}
                    style={{ cursor: 'pointer' }}
                    title="প্রোডাক্ট দেখুন"
                  >
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <div className="wl-price">৳{Number(item.price).toLocaleString()}</div>
                    <button
                      className="wl-btn wl-rem"
                      onClick={() => removeItem(item.id)}
                      title="Wishlist থেকে সরান"
                      style={{ padding: 4, display: 'flex', alignItems: 'center' }}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="wl-actions" style={{ flexDirection: 'column' }}>
                  <button className="wl-btn wl-add" onClick={() => addToCart(item.id)}>🛒 কার্টে যোগ</button>
                  <button className="wl-btn wl-order-btn" onClick={() => orderNow(item.id)}>⚡ অর্ডার করুন</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
                                    }
