'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCart } from './CartContext';

function renderStars(rating) {
  const r = Math.max(0, Math.min(5, parseFloat(rating) || 4.5));
  const full = Math.floor(r);
  const partial = r - full;
  const empty = 5 - full - (partial > 0 ? 1 : 0);
  let html = '';
  for (let i = 0; i < full; i++) html += '<span style="color:#F59E0B">★</span>';
  if (partial > 0) {
    const pct = Math.round(partial * 100);
    html += `<span style="position:relative;display:inline-block;color:#E5E7EB">★<span style="position:absolute;left:0;top:0;width:${pct}%;overflow:hidden;color:#F59E0B">★</span></span>`;
  }
  for (let i = 0; i < empty; i++) html += '<span style="color:#E5E7EB">★</span>';
  return html;
}

export default function ProductModal() {
  const { productModal, closeProduct, quickOrder, addToCart, showToast } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  // Get product from window.__vc_products (set by HomeClient)
  const allProducts = (typeof window !== 'undefined' ? window.__vc_products : null) || [];
  const product = allProducts.find(p => String(p.id) === String(productModal?.productId));

  useEffect(() => {
    if (productModal?.open) {
      setActiveImg(0);
      setQty(1);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [productModal?.open, productModal?.productId]);

  // ESC key close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeProduct(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeProduct]);

  if (!productModal?.open || !product) return null;

  const p = product;
  const imgs = Array.isArray(p.imgs) ? p.imgs : (p.image_url ? [p.image_url] : ['📦']);
  const mainImg = imgs[activeImg] || imgs[0];
  const oldPrice = p.old || p.old_price || 0;
  const discPct = oldPrice > p.price ? Math.round((1 - p.price / oldPrice) * 100) : 0;
  const sold = p.stock <= 0;
  const reviewCount = Math.floor(((Number(p.id) || 1) * 37 + (p.stock || 0) * 13) % 80 + 20);

  function handleQuickOrder() {
    const prod = qty > 1 ? { ...p, _forceQty: qty } : p;
    quickOrder(prod, qty);
    closeProduct();
  }

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) addToCart(p);
    showToast('🛒 কার্টে যোগ হয়েছে');
    closeProduct();
  }

  // Parse specs_short into list if it has newlines/semicolons/pipes
  const specLines = p.specs_short
    ? p.specs_short.split(/[\n;|]/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 11000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) closeProduct(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 20,
        width: '100%', maxWidth: 860,
        maxHeight: 'calc(100vh - 32px)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        animation: 'ppFadeIn .22s ease', position: 'relative',
        boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
      }}>
        {/* Close btn */}
        <button
          onClick={closeProduct}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'var(--light)', border: 'none', borderRadius: '50%',
            width: 36, height: 36, fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, color: 'var(--dark)', fontWeight: 700, lineHeight: 1,
          }}
        >✕</button>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div className="pp-modal-inner">

            {/* === LEFT: Gallery === */}
            <div className="pp-gallery-col">
              {/* Main image */}
              <div style={{
                width: '100%', aspectRatio: '1/1', borderRadius: 16,
                background: 'var(--light)', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 10,
              }}>
                {mainImg && (mainImg.startsWith('http') || mainImg.startsWith('//')) ? (
                  <img
                    src={mainImg}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                  />
                ) : (
                  <span style={{ fontSize: 72 }}>{mainImg || '📦'}</span>
                )}
              </div>

              {/* Thumbnails */}
              {imgs.length > 1 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {imgs.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      style={{
                        width: 58, height: 58, borderRadius: 10, overflow: 'hidden',
                        border: i === activeImg ? '2.5px solid var(--dark)' : '1.5px solid var(--border)',
                        background: 'var(--light)', cursor: 'pointer', padding: 0, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 0.15s',
                      }}
                    >
                      {img && (img.startsWith('http') || img.startsWith('//')) ? (
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                      ) : (
                        <span style={{ fontSize: 24 }}>{img}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* === RIGHT: Info === */}
            <div className="pp-info-col">
              {/* Badge */}
              {p.badge && (
                <span style={{
                  display: 'inline-block', padding: '3px 10px',
                  borderRadius: 50, fontSize: 10, fontWeight: 700,
                  background: p.badge.toLowerCase() === 'hot' ? '#E63946' :
                              p.badge.toLowerCase() === 'new' ? '#10B981' : '#3B82F6',
                  color: '#fff', marginBottom: 8,
                }}>{p.badge}</span>
              )}

              {/* Name */}
              <h2 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3, marginBottom: 10, color: 'var(--dark)', paddingRight: 40 }}>
                {p.name}
              </h2>

              {/* Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontSize: 13 }}>
                <span dangerouslySetInnerHTML={{ __html: renderStars(p.rating || 4.5) }} />
                <span style={{ color: 'var(--gray)' }}>
                  {(p.rating || 4.5).toFixed(1)} ({reviewCount} রিভিউ)
                </span>
              </div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)' }}>
                  ৳{p.price?.toLocaleString()}
                </span>
                {oldPrice > p.price && (
                  <>
                    <span style={{ fontSize: 16, color: 'var(--gray)', textDecoration: 'line-through' }}>
                      ৳{oldPrice?.toLocaleString()}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: '#FFF0F0', color: 'var(--red)',
                    }}>{discPct}% ছাড়</span>
                  </>
                )}
              </div>

              {/* Specs */}
              {specLines.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    স্পেসিফিকেশন
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {specLines.map((spec, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                        <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span style={{ color: 'var(--dark)', lineHeight: 1.4 }}>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specs short (if no line breaks — show as paragraph) */}
              {!specLines.length && p.specs_short && (
                <div style={{ marginBottom: 14, fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                  {p.specs_short}
                </div>
              )}

              {/* Description */}
              {p.description && (
                <div style={{ marginBottom: 16, fontSize: 13.5, color: '#444', lineHeight: 1.7 }}>
                  {p.description}
                </div>
              )}

              {/* Delivery info */}
              <div style={{
                background: 'var(--light)', borderRadius: 12, padding: '12px 14px',
                marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span>🚚</span>
                  <span><strong>ঢাকা:</strong> ৳90 · <strong>ঢাকার বাইরে:</strong> ৳130</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span>📦</span>
                  <span>১-৩ কার্যদিবসে ডেলিভারি</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span>✅</span>
                  <span>১০০% অরিজিনাল প্রোডাক্ট গ্যারান্টি</span>
                </div>
              </div>

              {/* Qty + CTA */}
              {sold ? (
                <button style={{
                  width: '100%', background: '#F59E0B', color: '#fff',
                  border: 'none', borderRadius: 12, padding: '14px',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  🔔 স্টকে আসলে জানান
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Qty row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray)' }}>পরিমাণ:</span>
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden',
                    }}>
                      <button
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        style={{ width: 36, height: 36, border: 'none', background: 'var(--light)', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}
                      >−</button>
                      <span style={{ width: 36, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>{qty}</span>
                      <button
                        onClick={() => setQty(q => q + 1)}
                        style={{ width: 36, height: 36, border: 'none', background: 'var(--light)', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}
                      >+</button>
                    </div>
                    {qty > 1 && (
                      <span style={{ fontSize: 13, color: 'var(--gray)' }}>
                        মোট: <strong style={{ color: 'var(--dark)' }}>৳{(p.price * qty).toLocaleString()}</strong>
                      </span>
                    )}
                  </div>

                  {/* Buttons */}
                  <button
                    onClick={handleQuickOrder}
                    style={{
                      width: '100%', background: 'var(--dark)', color: '#fff',
                      border: 'none', borderRadius: 12, padding: '14px',
                      fontSize: 15, fontWeight: 700, cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    ⚡ এখনই অর্ডার করুন
                  </button>
                  <button
                    onClick={handleAddToCart}
                    style={{
                      width: '100%', background: '#fff', color: 'var(--dark)',
                      border: '2px solid var(--dark)', borderRadius: 12, padding: '12px',
                      fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    🛒 কার্টে যোগ করুন
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes ppFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .pp-modal-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          padding: 24px 24px 28px;
        }
        .pp-gallery-col { min-width: 0; }
        .pp-info-col { min-width: 0; }
        @media (max-width: 600px) {
          .pp-modal-inner {
            grid-template-columns: 1fr;
            gap: 18px;
            padding: 18px 16px 24px;
          }
        }
      `}</style>
    </div>
  );
}
