'use client';

import { useCart } from './CartContext';
import { useEffect } from 'react';

export default function CartDrawer() {
  const { cart, totalItems, totalPrice, updateQty, removeFromCart, cartOpen, setCartOpen, checkoutCart } = useCart();

  // Lock body scroll when open
  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen]);

  if (!cartOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}
    >
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 520, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'slideUp .28s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>🛒 শপিং কার্ট</div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
              {totalItems}টি প্রোডাক্ট নির্বাচিত
            </div>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            style={{
              background: 'var(--light)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Items */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 18px' }}>
          {!cart.length ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🛒</div>
              <p style={{ marginBottom: 16, color: 'var(--gray)' }}>আপনার কার্ট খালি</p>
              <button
                onClick={() => { setCartOpen(false); document.getElementById('prodSec')?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{ background: 'var(--dark)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                প্রোডাক্ট দেখুন →
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 0', borderBottom: '1px solid var(--border)',
              }}>
                {/* Image/Emoji */}
                <div style={{ minWidth: 40, textAlign: 'center', paddingTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.img && (item.img.startsWith('http') || item.img.startsWith('//')) ? (
                    <img src={item.img} alt={item.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <span style={{ fontSize: 28 }}>{item.img || '📦'}</span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>৳{item.price.toLocaleString()} / পিস</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7 }}>
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      style={{ background: 'var(--light)', border: '1.5px solid var(--border)', borderRadius: 7, width: 28, height: 28, fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dark)', flexShrink: 0 }}
                    >−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      style={{ background: 'var(--light)', border: '1.5px solid var(--border)', borderRadius: 7, width: 28, height: 28, fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dark)', flexShrink: 0 }}
                    >+</button>
                  </div>
                </div>

                {/* Price + Remove */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', gap: 10, flexShrink: 0, paddingTop: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', whiteSpace: 'nowrap' }}>
                    ৳{(item.price * item.qty).toLocaleString()}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{ background: '#FEF2F2', border: 'none', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="সরান"
                  >
                    <svg width="14" height="14" fill="none" stroke="#E63946" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '14px 18px 20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              <span>মোট:</span>
              <span style={{ color: 'var(--dark)' }}>৳{totalPrice.toLocaleString()}</span>
            </div>
            <button
              onClick={checkoutCart}
              style={{
                width: '100%', background: 'var(--dark)', color: '#fff', border: 'none',
                borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#C1121F'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--dark)'}
            >
              ⚡ অর্ডার নিশ্চিত করুন
            </button>
            <button
              onClick={() => setCartOpen(false)}
              style={{
                width: '100%', background: 'none', border: '1.5px solid var(--border)',
                borderRadius: 12, padding: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", marginTop: 8,
              }}
            >
              কেনাকাটা চালিয়ে যান
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
