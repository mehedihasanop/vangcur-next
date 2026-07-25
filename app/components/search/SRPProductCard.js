'use client';

import { useRef, useState, useEffect } from 'react';
import {
  isWishlisted, toggleWish,
  PRODUCT_OPEN_EVENT, QUICK_ORDER_EVENT, QUICK_CART_EVENT, STOCK_NOTIFY_EVENT, WISHLIST_EVENT,
} from '@/lib/productData';

// Converted from 32-javascript-all.js:
// - _srpBuildProdCard() (lines ~3239-3340) — same card as the home grid's
//   ProductCard, plus a swipeable/dotted image slider for multi-image products
// - _srpGoSlide() (lines ~3178-3192) and the touchstart/touchmove/touchend swipe
//   handlers (lines ~3194-3221, ~3324-3336) — reimplemented as React state
//   instead of direct DOM transform/dataset mutation
// - _renderDynamicStars() (lines ~6483-6500, shared with ProductCard.js)
// Markup source: 17-search-result-page.html extraction, "SRP Product Card Builder"
//
// Not shared with home/ProductCard.js on purpose: the legacy code itself keeps
// _buildProdCard and _srpBuildProdCard as separate functions (the slider is the
// only real difference), so this mirrors that rather than inventing a shared
// abstraction the legacy source doesn't have.

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

function ProdImg({ imgVal, name }) {
  const [broken, setBroken] = useState(false);
  const isUrl = typeof imgVal === 'string' && (imgVal.startsWith('http://') || imgVal.startsWith('https://'));
  if (!imgVal) return <span style={{ fontSize: 52 }}>📦</span>;
  if (isUrl && !broken) {
    return (
      <img
        src={imgVal}
        alt={name || ''}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setBroken(true)}
      />
    );
  }
  if (isUrl && broken) return <span style={{ fontSize: 52 }}>📦</span>;
  return <span style={{ fontSize: 52 }}>{imgVal}</span>;
}

export default function SRPProductCard({ prod: p }) {
  const [wished, setWished] = useState(() => isWishlisted(p.id));
  const [slideIdx, setSlideIdx] = useState(0);
  const wishBtnRef = useRef(null);
  const touchRef = useRef({ x: 0, y: 0 });

  // Legacy: renderProds(PRODS) was called after removeFromWishlistInModal() to
  // un-heart cards on the grid too — here each card just resyncs itself instead.
  useEffect(() => {
    const handler = () => setWished(isWishlisted(p.id));
    window.addEventListener(WISHLIST_EVENT, handler);
    return () => window.removeEventListener(WISHLIST_EVENT, handler);
  }, [p.id]);

  const sold = p.stock <= 0;
  const discPct = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  const discBgColor = p.discountColor === 'green' ? '#16A34A' : '#FF6B00';
  const showDiscBadge = discPct >= 5 && !sold;
  const reviewCount = Math.floor((Number(p.id) || 1) * 37 + p.stock * 13) % 80 + 20;
  const imgs = p.imgs && p.imgs.length ? p.imgs : ['📦'];
  const hasSlider = imgs.length > 1;

  const openProduct = () => {
    window.dispatchEvent(new CustomEvent(PRODUCT_OPEN_EVENT, { detail: { id: p.id } }));
  };

  const goSlide = (idx) => {
    const total = imgs.length;
    if (idx < 0) idx = total - 1;
    if (idx >= total) idx = 0;
    setSlideIdx(idx);
  };

  const handleTouchStart = (e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
      goSlide(dx < 0 ? slideIdx + 1 : slideIdx - 1);
    }
  };

  const handleWish = () => {
    const nowWished = toggleWish(p);
    setWished(nowWished);
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced && wishBtnRef.current) {
      const btn = wishBtnRef.current;
      btn.classList.remove('vc-heart-anim');
      void btn.offsetWidth;
      btn.classList.add('vc-heart-anim');
      btn.addEventListener('animationend', () => btn.classList.remove('vc-heart-anim'), { once: true });
    }
  };

  const handleCtaClick = (e, action) => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
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
        : p.badge && <div className={`prod-badge badge-${p.badge.toLowerCase()}`}>{p.badge}</div>}
      {showDiscBadge && (
        <div className="discount-badge" style={{ top: p.badge ? '32px' : '10px', background: discBgColor }}>
          {discPct}% ছাড়
        </div>
      )}
      <div className="prod-img-wrap" style={{ position: 'relative' }}>
        <div
          className="prod-img srp-img-wrap"
          onClick={openProduct}
          onTouchStart={hasSlider ? handleTouchStart : undefined}
          onTouchEnd={hasSlider ? handleTouchEnd : undefined}
          style={{ overflow: 'hidden', touchAction: 'pan-y', ...(hasSlider ? { cursor: 'pointer', padding: 0 } : {}) }}
        >
          {hasSlider ? (
            <>
              <div style={{ display: 'flex', transition: 'transform .28s ease', width: '100%', willChange: 'transform', transform: `translateX(-${slideIdx * 100}%)` }}>
                {imgs.map((img, i) => (
                  <div key={i} style={{ minWidth: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <ProdImg imgVal={img} name={p.name} />
                  </div>
                ))}
              </div>
              <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, zIndex: 4 }}>
                {imgs.map((_, i) => (
                  <button
                    key={i}
                    className={'srp-slide-dot' + (i === slideIdx ? ' srp-dot-on' : '')}
                    onClick={(e) => { e.stopPropagation(); goSlide(i); }}
                    style={{ width: 6, height: 6, borderRadius: '50%', border: 'none', background: i === slideIdx ? '#fff' : 'rgba(255,255,255,.5)', padding: 0, cursor: 'pointer', transition: '.2s', flexShrink: 0 }}
                  />
                ))}
              </div>
            </>
          ) : (
            <ProdImg imgVal={imgs[0]} name={p.name} />
          )}
        </div>
        <button
          ref={wishBtnRef}
          className={'wish-btn' + (wished ? ' wishlisted' : '')}
          onClick={(e) => { e.stopPropagation(); handleWish(); }}
          title="Wishlist"
        >
          {wished ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="prod-info">
        <div className="prod-name srp-prod-name" style={{ cursor: 'pointer' }} onClick={openProduct}>{p.name}</div>
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
              className="prod-cta srp-notify-btn"
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
                className="prod-cta srp-order-btn"
                onClick={(e) => handleCtaClick(e, () => window.dispatchEvent(
                  new CustomEvent(QUICK_ORDER_EVENT, { detail: { id: p.id } })
                ))}
              >
                ⚡ অর্ডার করুন
              </button>
              <button
                className="prod-cart-icon-btn srp-cart-btn"
                title="কার্টে যোগ করুন"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id: p.id } })); }}
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
