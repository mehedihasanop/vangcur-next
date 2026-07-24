'use client';

import { useState, useRef } from 'react';
import {
  isWishlisted, toggleWish,
  PRODUCT_OPEN_EVENT, QUICK_ORDER_EVENT, QUICK_CART_EVENT, STOCK_NOTIFY_EVENT,
} from '@/lib/productData';

// Converted from 32-javascript-all.js:
// - _prodImgHTML() (legacy lines ~811-816)
// - getCardSpecs() (legacy lines ~818-830)
// - _buildProdCard() (legacy lines ~832-869)
// - _renderDynamicStars() (legacy lines ~6483-6500)
// - ripple effect on .prod-cta clicks + heartbeat on .wish-btn clicks
//   (legacy document-level delegated listeners, lines ~2088-2122 — reimplemented
//   per-card here since React owns these elements directly)
// Markup source: 10-products.html "JS দ্বারা গতিশীলভাবে..." class inventory

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Legacy: getCardSpecs(p) — respects specs._quick_keys ordering when the admin set one,
// otherwise the first two non-underscore-prefixed spec entries
function getCardSpecs(p) {
  const specs = p.specs || {};
  const quickKeys = specs._quick_keys;
  let entries = [];
  if (Array.isArray(quickKeys)) {
    quickKeys.forEach((k) => { if (specs[k] !== undefined) entries.push([k, specs[k]]); });
  } else {
    entries = Object.entries(specs).filter(([k]) => !k.startsWith('_'));
  }
  return entries.slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' • ');
}

// Legacy: _renderDynamicStars(rating) — full/partial(gradient)/empty stars
function StarRating({ rating }) {
  const r = Math.max(0, Math.min(5, parseFloat(rating) || 4.5));
  const full = Math.floor(r);
  const partial = r - full;
  const empty = 5 - full - (partial > 0 ? 1 : 0);
  const pct = Math.round(partial * 100);
  return (
    <span style={{ color: '#F59E0B' }}>
      {Array.from({ length: full }).map((_, i) => <span key={'f' + i}>★</span>)}
      {partial > 0 && (
        <span style={{ position: 'relative', display: 'inline-block', color: '#E5E7EB' }}>
          ★
          <span style={{ position: 'absolute', left: 0, top: 0, width: pct + '%', overflow: 'hidden', color: '#F59E0B' }}>★</span>
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => <span key={'e' + i} style={{ color: '#E5E7EB' }}>★</span>)}
    </span>
  );
}

// Legacy: _prodImgHTML(imgVal, name, lazy) — emoji text vs <img> with onError fallback
function ProdImg({ imgVal, name, lazy }) {
  const [broken, setBroken] = useState(false);
  const isUrl = typeof imgVal === 'string' && (imgVal.startsWith('http://') || imgVal.startsWith('https://'));
  if (!imgVal) return <span style={{ fontSize: 52 }}>📦</span>;
  if (isUrl && !broken) {
    return (
      <img
        src={imgVal}
        alt={name || ''}
        loading={lazy ? 'lazy' : undefined}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setBroken(true)}
      />
    );
  }
  if (isUrl && broken) return <span style={{ fontSize: 52 }}>📦</span>;
  return <span style={{ fontSize: 52 }}>{imgVal}</span>;
}

export default function ProductCard({ prod: p, isFirst }) {
  const [wished, setWished] = useState(() => isWishlisted(p.id));
  const wishBtnRef = useRef(null);

  const sold = p.stock <= 0;
  const badgeClass = p.badge ? `badge-${p.badge.toLowerCase()}` : '';
  const discPct = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  const discBgColor = p.discountColor === 'green' ? '#16A34A' : '#FF6B00';
  const showDiscBadge = discPct >= 5 && !sold;
  // Legacy: rating-derived fake review count — Math.floor((id*37 + stock*13) % 80 + 20)
  const reviewCount = Math.floor((Number(p.id) || 1) * 37 + p.stock * 13) % 80 + 20;

  const openProduct = () => {
    window.dispatchEvent(new CustomEvent(PRODUCT_OPEN_EVENT, { detail: { id: p.id } }));
  };

  const handleWish = (e) => {
    const nowWished = toggleWish(p);
    setWished(nowWished);
    if (!prefersReducedMotion() && wishBtnRef.current) {
      const btn = wishBtnRef.current;
      btn.classList.remove('vc-heart-anim');
      void btn.offsetWidth;
      btn.classList.add('vc-heart-anim');
      btn.addEventListener('animationend', () => btn.classList.remove('vc-heart-anim'), { once: true });
    }
  };

  // Legacy: document-level ripple listener on .prod-cta, reimplemented per-button here
  const handleCtaClick = (e, action) => {
    if (!prefersReducedMotion()) {
      const btn = e.currentTarget;
      const r = document.createElement('span');
      r.className = 'vc-ripple-el';
      const rect = btn.getBoundingClientRect();
      r.style.left = (e.clientX - rect.left) + 'px';
      r.style.top = (e.clientY - rect.top) + 'px';
      btn.appendChild(r);
      setTimeout(() => r.remove(), 600);
    }
    action();
  };

  return (
    <div className="prod-card" data-pid={p.id}>
      {sold
        ? <div className="prod-badge badge-sold">Sold Out</div>
        : p.badge && <div className={`prod-badge ${badgeClass}`}>{p.badge}</div>}
      {showDiscBadge && (
        <div
          className="discount-badge"
          style={{ top: p.badge ? '32px' : '10px', background: discBgColor }}
        >
          {discPct}% ছাড়
        </div>
      )}
      <div className="prod-img-wrap" style={{ position: 'relative' }}>
        <div className="prod-img" onClick={openProduct} style={{ overflow: 'hidden' }}>
          <ProdImg imgVal={(p.imgs || ['📦'])[0]} name={p.name} lazy={!isFirst} />
        </div>
        <button
          ref={wishBtnRef}
          className={'wish-btn' + (wished ? ' wishlisted' : '')}
          onClick={handleWish}
          title="Wishlist"
        >
          {wished ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="prod-info">
        <div className="prod-name" onClick={openProduct}>{p.name}</div>
        <div className="prod-spec">{getCardSpecs(p)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5, fontSize: 11 }}>
          <StarRating rating={p.rating || 4.5} />
          <span style={{ color: 'var(--gray)' }}>{(p.rating || 4.5).toFixed(1)} ({reviewCount})</span>
        </div>
        <div className="prod-price-row">
          <span className="prod-price">৳{p.price.toLocaleString()}</span>
          <span className="prod-old">৳{p.old.toLocaleString()}</span>
        </div>
        <div className="prod-cta-row">
          {sold ? (
            <button
              className="prod-cta"
              style={{ width: '100%', background: '#F59E0B', color: '#fff', border: 'none' }}
              onClick={(e) => handleCtaClick(e, () => window.dispatchEvent(
                new CustomEvent(STOCK_NOTIFY_EVENT, { detail: { id: p.id, name: p.name } })
              ))}
            >
              🔔 স্টকে আসলে জানান
            </button>
          ) : (
            <>
              <button
                className="prod-cta"
                onClick={(e) => handleCtaClick(e, () => window.dispatchEvent(
                  new CustomEvent(QUICK_ORDER_EVENT, { detail: { id: p.id } })
                ))}
              >
                ⚡ অর্ডার করুন
              </button>
              <button
                className="prod-cart-icon-btn"
                title="কার্টে যোগ করুন"
                onClick={() => window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id: p.id } }))}
              >
                🛒
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
